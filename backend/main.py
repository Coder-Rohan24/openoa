"""
OpenOA Cloud Analyst - FastAPI Backend
Production-ready API for wind plant performance analysis.
"""
import logging
import os
import sys
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import List

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.openoa_services import run_aep_analysis
from services.data_quality import generate_data_quality_summary
from services.wind_analysis import compute_wind_statistics, compute_weibull_fit
from services.energy_analysis import compute_monthly_energy, calculate_capacity_factor
from services.power_curve_analysis import generate_power_curve

# Load environment variables (.env.local takes precedence over .env)
env_local = Path(__file__).parent / '.env.local'
if env_local.exists():
    load_dotenv(env_local)
    print(f"✓ Loaded local environment from .env.local")
else:
    load_dotenv()
    print(f"✓ Loaded environment from .env (or system variables)")

# Environment configuration
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 OpenOA Cloud Analyst API Starting Up")
    logger.info("=" * 60)
    logger.info(f"Environment: {ENVIRONMENT}")
    logger.info(f"Host: {HOST}")
    logger.info(f"Port: {PORT}")
    logger.info(f"Log Level: {LOG_LEVEL}")
    logger.info(f"CORS: {FRONTEND_URL}")
    logger.info("=" * 60)
    logger.info("✅ API Ready to Accept Requests")
    logger.info("=" * 60)
    yield
    # Shutdown
    logger.info("=" * 60)
    logger.info("🛑 OpenOA Cloud Analyst API Shutting Down")
    logger.info("=" * 60)

# Initialize FastAPI app
app = FastAPI(
    title="OpenOA Cloud Analyst",
    description="API for wind plant performance analysis using OpenOA",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS configured for: {FRONTEND_URL}")


# Response models
class HealthResponse(BaseModel):
    status: str


class AnalysisResponse(BaseModel):
    p50: float
    p90: float
    samples: List[float]


# Routes
@app.get("/", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint to verify API is running.
    """
    logger.info("Health check requested")
    return {"status": "OpenOA API running"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    scada_file: UploadFile = File(..., description="SCADA data file (CSV)"),
    meter_file: UploadFile = File(..., description="Meter data file (CSV)")
):
    """
    Run AEP analysis on uploaded wind plant data.
    
    Args:
        scada_file: CSV file containing SCADA data
        meter_file: CSV file containing meter data
    
    Returns:
        Analysis results with P50, P90, and sample distribution
    
    Raises:
        HTTPException: If file processing or analysis fails
    """
    logger.info(f"Analysis requested - SCADA: {scada_file.filename}, Meter: {meter_file.filename}")
    
    try:
        # Validate file types
        if not scada_file.filename.endswith('.csv'):
            logger.warning(f"Invalid SCADA file type: {scada_file.filename}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SCADA file must be a CSV file"
            )
        
        if not meter_file.filename.endswith('.csv'):
            logger.warning(f"Invalid meter file type: {meter_file.filename}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Meter file must be a CSV file"
            )
        
        # Read files into memory
        scada_content = await scada_file.read()
        meter_content = await meter_file.read()
        
        # Convert to pandas DataFrames
        try:
            scada_df = pd.read_csv(BytesIO(scada_content))
            logger.info(f"SCADA file loaded - {len(scada_df)} rows, {len(scada_df.columns)} columns")
        except Exception as e:
            logger.error(f"Failed to parse SCADA file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse SCADA CSV file: {str(e)}"
            )
        
        try:
            meter_df = pd.read_csv(BytesIO(meter_content))
            logger.info(f"Meter file loaded - {len(meter_df)} rows, {len(meter_df.columns)} columns")
        except Exception as e:
            logger.error(f"Failed to parse meter file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse meter CSV file: {str(e)}"
            )
        
        # Run analysis
        try:
            logger.info("Starting AEP analysis...")
            result = run_aep_analysis(scada_df, meter_df)
            logger.info(f"Analysis completed successfully - P50: {result['p50']:.2f} MWh, P90: {result['p90']:.2f} MWh")
            return result
        except ValueError as e:
            logger.error(f"Analysis validation error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Analysis failed: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Internal analysis error: {str(e)}"
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@app.post("/analyze/data-quality")
async def analyze_data_quality(
    scada_file: UploadFile = File(..., description="SCADA data file (CSV)"),
    meter_file: UploadFile = File(..., description="Meter data file (CSV)")
):
    """
    Analyze data quality for both SCADA and meter datasets.
    
    Returns comprehensive quality metrics including completeness, missing values,
    time coverage, and overall quality scores.
    """
    logger.info(f"Data quality analysis requested")
    
    try:
        # Read and parse files
        scada_content = await scada_file.read()
        meter_content = await meter_file.read()
        
        scada_df = pd.read_csv(BytesIO(scada_content))
        meter_df = pd.read_csv(BytesIO(meter_content))
        
        logger.info(f"Files loaded - SCADA: {len(scada_df)} rows, Meter: {len(meter_df)} rows")
        
        # Run analysis
        result = generate_data_quality_summary(scada_df, meter_df)
        logger.info(f"Data quality analysis completed - Score: {result.get('overall_quality_score', 'N/A')}")
        
        return result
    
    except Exception as e:
        logger.error(f"Data quality analysis error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data quality analysis failed: {str(e)}"
        )


@app.post("/analyze/wind-statistics")
async def analyze_wind_statistics(
    scada_file: UploadFile = File(..., description="SCADA data file (CSV)")
):
    """
    Compute wind resource statistics from SCADA data.
    
    Returns mean, median, std dev, and histogram data for wind speed distribution.
    """
    logger.info(f"Wind statistics analysis requested")
    
    try:
        scada_content = await scada_file.read()
        scada_df = pd.read_csv(BytesIO(scada_content))
        
        logger.info(f"SCADA file loaded - {len(scada_df)} rows")
        
        result = compute_wind_statistics(scada_df)
        logger.info(f"Wind statistics computed - Mean: {result.get('mean', 'N/A'):.2f} m/s")
        
        return result
    
    except Exception as e:
        logger.error(f"Wind statistics error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Wind statistics analysis failed: {str(e)}"
        )


@app.post("/analyze/weibull")
async def analyze_weibull(
    scada_file: UploadFile = File(..., description="SCADA data file (CSV)")
):
    """
    Compute Weibull distribution parameters for wind resource.
    
    Returns shape (k) and scale (c) parameters for Weibull distribution fitting.
    """
    logger.info(f"Weibull distribution analysis requested")
    
    try:
        scada_content = await scada_file.read()
        scada_df = pd.read_csv(BytesIO(scada_content))
        
        result = compute_weibull_fit(scada_df)
        logger.info(f"Weibull fit completed - k={result.get('shape_k', 'N/A'):.2f}, c={result.get('scale_c', 'N/A'):.2f}")
        
        return result
    
    except Exception as e:
        logger.error(f"Weibull analysis error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Weibull analysis failed: {str(e)}"
        )


@app.post("/analyze/power-curve")
async def analyze_power_curve(
    scada_file: UploadFile = File(..., description="SCADA data file (CSV)")
):
    """
    Generate turbine power curve from SCADA data.
    
    Returns binned power curve data showing wind speed to power relationship.
    """
    logger.info(f"Power curve generation requested")
    
    try:
        scada_content = await scada_file.read()
        scada_df = pd.read_csv(BytesIO(scada_content))
        
        result = generate_power_curve(scada_df)
        logger.info(f"Power curve generated with {len(result.get('wind_speed_bins', []))} bins")
        
        return result
    
    except Exception as e:
        logger.error(f"Power curve error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Power curve generation failed: {str(e)}"
        )


@app.post("/analyze/monthly-energy")
async def analyze_monthly_energy(
    meter_file: UploadFile = File(..., description="Meter data file (CSV)")
):
    """
    Calculate monthly energy production from meter data.
    
    Returns time series of monthly energy totals and daily averages.
    """
    logger.info(f"Monthly energy analysis requested")
    
    try:
        meter_content = await meter_file.read()
        meter_df = pd.read_csv(BytesIO(meter_content))
        
        result = compute_monthly_energy(meter_df)
        logger.info(f"Monthly energy computed for {len(result)} months")
        
        return {"monthly_data": result}
    
    except Exception as e:
        logger.error(f"Monthly energy error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Monthly energy analysis failed: {str(e)}"
        )


@app.post("/analyze/capacity-factor")
async def analyze_capacity_factor(
    meter_file: UploadFile = File(..., description="Meter data file (CSV)"),
    rated_capacity: float = Form(2000.0)
):
    """
    Calculate capacity factor from meter data.
    
    Args:
        meter_file: Meter data CSV
        rated_capacity: Rated capacity in kW (default: 2000 kW for typical 2MW turbine)
    
    Returns capacity factor percentage and energy metrics.
    """
    logger.info(f"Capacity factor analysis requested - Rated: {rated_capacity} kW")
    
    try:
        meter_content = await meter_file.read()
        meter_df = pd.read_csv(BytesIO(meter_content))
        
        result = calculate_capacity_factor(meter_df, rated_capacity)
        logger.info(f"Capacity factor: {result.get('capacity_factor', 'N/A'):.2f}%")
        
        return result
    
    except Exception as e:
        logger.error(f"Capacity factor error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Capacity factor analysis failed: {str(e)}"
        )


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """
    Global HTTP exception handler for consistent error responses.
    """
    logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """
    Global exception handler for unexpected errors.
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    
    # Production-ready uvicorn configuration
    logger.info(f"Starting uvicorn server on {HOST}:{PORT}")
    logger.info(f"Running in {ENVIRONMENT} mode")
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,  # Disabled due to Windows path issues
        log_level=LOG_LEVEL.lower(),
        access_log=True,
        workers=1
    )
