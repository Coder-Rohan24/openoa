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
    Run Annual Energy Production (AEP) analysis using OpenOA's MonteCarloAEP.
    
    This function uses the full OpenOA library to perform wind plant performance analysis
    with Monte Carlo simulation for uncertainty quantification.
    
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
    logger.info("Starting OpenOA Monte Carlo AEP analysis")
    
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
        
        # Convert timestamps
        scada_data['timestamp'] = pd.to_datetime(scada_data['timestamp'])
        meter_data['timestamp'] = pd.to_datetime(meter_data['timestamp'])
        
        # Add asset_id if not present
        if 'asset_id' not in scada_data.columns:
            scada_data['asset_id'] = 'turbine_01'
        
        # Rename to OpenOA standard format for SCADA
        scada_data = scada_data.rename(columns={
            'timestamp': 'time',
            'wind_speed': 'WMET_HorWdSpd',
            'power': 'WTUR_W'
        })
        
        # Rename meter data  
        meter_data = meter_data.rename(columns={
            'timestamp': 'time',
            'energy': 'MMTR_SupWh'
        })
        
        logger.info(f"Prepared SCADA: {len(scada_data)} rows, Meter: {len(meter_data)} rows")
        
        # Generate curtailment data (required by OpenOA)
        # Using meter timestamps and assuming no losses for simplified analysis
        curtail_data = pd.DataFrame({
            'time': meter_data['time'].copy(),
            'IAVL_DnWh': 0.0,  # Availability losses (kWh)
            'IAVL_ExtPwrDnWh': 0.0  # Curtailment losses (kWh)
        })
        
        logger.info(f"Created curtailment data: {len(curtail_data)} rows")
        
        # Generate hourly reanalysis data from SCADA
        # Resample to hourly frequency (OpenOA expects hourly reanalysis)
        scada_hourly = scada_data[['time', 'WMET_HorWdSpd']].copy()
        scada_hourly_resampled = scada_hourly.set_index('time').resample('1h').agg({
            'WMET_HorWdSpd': 'mean'
        })
        
        # Fill any NaN values with mean
        scada_hourly_resampled['WMET_HorWdSpd'] = scada_hourly_resampled['WMET_HorWdSpd'].fillna(
            scada_hourly_resampled['WMET_HorWdSpd'].mean()
        )
        
        # Create reanalysis DataFrame matching OpenOA's expected structure
        reanalysis_data = pd.DataFrame({
            'datetime': scada_hourly_resampled.index,
            'WMETR_HorWdSpd': scada_hourly_resampled['WMET_HorWdSpd'].values,
            'WMETR_HorWdDir': 180.0,  # Default wind direction (degrees)
            'WMETR_AirDen': 1.225  # Standard air density (kg/m³)
        })
        
        # Set DatetimeIndex (OpenOA requires this)
        reanalysis_data = reanalysis_data.set_index(pd.DatetimeIndex(reanalysis_data['datetime']))
        
        # Use asfreq to ensure consistent hourly frequency
        reanalysis_data = reanalysis_data.asfreq('1h')
        
        # Reset datetime column from index after asfreq
        reanalysis_data['datetime'] = reanalysis_data.index
        
        logger.info(f"Created reanalysis data: {len(reanalysis_data)} rows, "
                   f"from {reanalysis_data.index.min()} to {reanalysis_data.index.max()}")
        
        # Create PlantMetaData with embedded metadata definitions
        metadata = PlantMetaData(
            latitude=40.0,
            longitude=-105.0,
            capacity=100.0,
            # Curtailment metadata as dictionary
            curtail={
                'time': 'time',
                'IAVL_DnWh': 'IAVL_DnWh',
                'IAVL_ExtPwrDnWh': 'IAVL_ExtPwrDnWh'
            },
            # Reanalysis metadata as nested dictionary
            reanalysis={
                'synthetic': {
                    'time': 'datetime',
                    'WMETR_HorWdSpd': 'WMETR_HorWdSpd',
                    'WMETR_HorWdDir': 'WMETR_HorWdDir',
                    'WMETR_AirDen': 'WMETR_AirDen'
                }
            }
        )
        
        logger.info(f"Created PlantMetaData - Capacity: {metadata.capacity} MW")
        
        # Create PlantData with all required datasets
        # Pass curtail and reanalysis DURING construction
        plant_data = PlantData(
            analysis_type="MonteCarloAEP",
            metadata=metadata,
            scada=scada_data,
            meter=meter_data,
            curtail=curtail_data,
            reanalysis={'synthetic': reanalysis_data}
        )
        
        logger.info("PlantData created with all datasets")
        
        # Initialize MonteCarloAEP analysis
        # Use daily resolution for short-term data (change to "MS" for monthly if you have months of data)
        # Set end_date_lt to last date of reanalysis to avoid month-end requirement
        # Reduce uncertainty_windiness to match our short data period
        last_reanal_date = reanalysis_data.index.max()
        logger.info(f"Initializing OpenOA MonteCarloAEP with daily resolution, end_date_lt={last_reanal_date}")
        
        mc_aep = MonteCarloAEP(
            plant=plant_data,
            reanalysis_products=['synthetic'],  # Use our synthetic reanalysis data
            time_resolution='D',  # Daily resolution (use 'MS' for monthly if >= 1 month of data)
            end_date_lt=last_reanal_date,  # Use all available data
            uncertainty_windiness=(1.0, 1.0)  # Minimum 1 year for demo data (default is (10.0, 20.0) years!)
        )
        
        # Run the analysis with 50 simulations
        logger.info("Running OpenOA Monte Carlo simulation with 50 iterations...")
        
        mc_aep.run(
            num_sim=50,  # Number of Monte Carlo simulations
            progress_bar=False  # Disable progress bar for API
        )
        
        # Extract results from OpenOA
        # OpenOA stores results in results DataFrame
        samples = mc_aep.results['aep_GWh'].values * 1000  # Convert GWh to MWh
        
        # Calculate percentiles
        p50 = float(np.percentile(samples, 50))  # Median
        p90 = float(np.percentile(samples, 10))  # P90 exceedance = 10th percentile
        
        # Prepare result dictionary
        result = {
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "samples": [round(float(s), 2) for s in samples.tolist()]
        }
        
        logger.info(f"OpenOA analysis complete - P50: {result['p50']} MWh, P90: {result['p90']} MWh")
        logger.info(f"Generated {len(result['samples'])} simulation samples using OpenOA")
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in AEP analysis: {str(e)}", exc_info=True)
        raise
    except AttributeError as e:
        logger.error(f"OpenOA attribute error: {str(e)}", exc_info=True)
        raise ValueError(f"OpenOA integration error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in AEP analysis: {str(e)}", exc_info=True)
        raise
