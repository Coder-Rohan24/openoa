"""
OpenOA Analysis Services

Service layer for OpenOA integration.
This module wraps OpenOA functionality to keep business logic separate from API layer.
"""
import logging
from typing import Dict, List
import pandas as pd
import numpy as np

from openoa.plant import PlantData, PlantMetaData
from openoa.analysis.aep import MonteCarloAEP

logger = logging.getLogger(__name__)


def prepare_plant_data(scada_df: pd.DataFrame, meter_df: pd.DataFrame) -> PlantData:
    """
    Prepare plant data for OpenOA analysis.
    
    Maps input DataFrames to OpenOA's expected format and creates a PlantData instance.
    
    Args:
        scada_df: DataFrame containing SCADA data with columns:
                  - timestamp: DateTime index
                  - wind_speed: Wind speed measurements (m/s)
                  - power: Power output (kW)
        meter_df: DataFrame containing meter data with columns:
                  - timestamp: DateTime index
                  - energy: Energy production (kWh)
    
    Returns:
        PlantData instance ready for analysis
    
    Raises:
        ValueError: If required columns are missing or data is invalid
    """
    logger.info("Preparing plant data for OpenOA analysis")
    
    try:
        # Validate required columns
        required_scada_cols = ['timestamp', 'wind_speed', 'power']
        required_meter_cols = ['timestamp', 'energy']
        
        missing_scada = [col for col in required_scada_cols if col not in scada_df.columns]
        missing_meter = [col for col in required_meter_cols if col not in meter_df.columns]
        
        if missing_scada:
            raise ValueError(f"Missing required SCADA columns: {missing_scada}")
        if missing_meter:
            raise ValueError(f"Missing required meter columns: {missing_meter}")
        
        # Create copies to avoid modifying originals
        scada_data = scada_df.copy()
        meter_data = meter_df.copy()
        
        # Convert timestamp to datetime
        scada_data['timestamp'] = pd.to_datetime(scada_data['timestamp'])
        meter_data['timestamp'] = pd.to_datetime(meter_data['timestamp'])
        
        # Add asset_id column if not present (required by OpenOA)
        if 'asset_id' not in scada_data.columns:
            scada_data['asset_id'] = 'turbine_01'  # Default turbine ID
        
        # Map column names to OpenOA standard format
        # OpenOA uses standardized column names based on IEC 61400-25
        scada_data = scada_data.rename(columns={
            'timestamp': 'time',
            'wind_speed': 'WMET_HorWdSpd',  # Horizontal wind speed
            'power': 'WTUR_W'                # Turbine power (kW)
        })
        
        meter_data = meter_data.rename(columns={
            'timestamp': 'time',
            'energy': 'MMTR_SupWh'  # Meter supplied energy (kWh)
        })
        
        # Create PlantMetaData with minimal configuration
        metadata = PlantMetaData(
            latitude=40.0,   # Default values for demo
            longitude=-105.0,
            capacity=100.0   # MW
        )
        
        logger.info(f"Created PlantMetaData - Capacity: {metadata.capacity} MW")
        
        # Create PlantData instance with analysis_type
        # This tells OpenOA which columns to expect
        plant_data = PlantData(
            analysis_type="MonteCarloAEP",
            metadata=metadata,
            scada=scada_data,
            meter=meter_data
        )
        
        logger.info(f"PlantData prepared - SCADA: {len(scada_data)} rows, Meter: {len(meter_data)} rows")
        
        return plant_data
        
    except Exception as e:
        logger.error(f"Error preparing plant data: {str(e)}")
        raise


def run_aep_analysis(scada_df: pd.DataFrame, meter_df: pd.DataFrame) -> Dict[str, any]:
    """
    Run Annual Energy Production (AEP) analysis based on meter data.
    
    This function performs a simplified AEP analysis using meter energy data
    and applies Monte Carlo simulation for uncertainty quantification.
    
    Args:
        scada_df: DataFrame containing SCADA data
        meter_df: DataFrame containing meter data
    
    Returns:
        Dictionary containing:
            - p50: Median (50th percentile) AEP estimate (MWh)
            - p90: 90th percentile exceedance AEP estimate (MWh)
            - samples: List of all simulation samples (MWh)
    
    Raises:
        ValueError: If input data is invalid or analysis fails
    """
    logger.info("Starting simplified AEP analysis")
    
    try:
        # Validate input data
        if 'energy' not in meter_df.columns:
            raise ValueError("Meter data must contain 'energy' column")
        
        # Calculate total energy from meter data (kWh)
        total_energy_kwh = meter_df['energy'].sum()
        
        # Convert to MWh
        total_energy_mwh = total_energy_kwh / 1000
        
        logger.info(f"Total energy from meter data: {total_energy_mwh:.2f} MWh")
        
        # Determine the time period covered by the data
        meter_df_copy = meter_df.copy()
        meter_df_copy['timestamp'] = pd.to_datetime(meter_df_copy['timestamp'])
        time_range = (meter_df_copy['timestamp'].max() - meter_df_copy['timestamp'].min()).total_seconds() / (365.25 * 24 * 3600)
        
        # Annualize the energy production
        if time_range > 0:
            annual_energy = total_energy_mwh / time_range
        else:
            annual_energy = total_energy_mwh
        
        logger.info(f"Data covers {time_range:.2f} years, annualized energy: {annual_energy:.2f} MWh")
        
        # Generate Monte Carlo samples with uncertainty
        # Assume +/- 10% uncertainty for simplified analysis
        num_sim = 50
        uncertainty = 0.10  # 10% uncertainty
        
        # Generate samples using normal distribution
        samples = np.random.normal(
            loc=annual_energy,
            scale=annual_energy * uncertainty,
            size=num_sim
        )
        
        # Ensure all samples are positive
        samples = np.maximum(samples, 0)
        
        # Calculate percentiles
        p50 = float(np.percentile(samples, 50))  # Median
        p90 = float(np.percentile(samples, 10))  # P90 exceedance = 10th percentile
        
        # Prepare result dictionary
        result = {
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "samples": [round(float(s), 2) for s in samples.tolist()]
        }
        
        logger.info(f"Analysis complete - P50: {result['p50']} MWh, P90: {result['p90']} MWh")
        logger.info(f"Generated {num_sim} simulation samples")
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in AEP analysis: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Unexpected error in AEP analysis: {str(e)}", exc_info=True)
        raise
