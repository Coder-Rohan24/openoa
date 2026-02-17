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


def run_aep_analysis(scada_df: pd.DataFrame, meter_df: pd.DataFrame, num_simulations: int = 50) -> Dict[str, any]:
    """
    Run Annual Energy Production (AEP) analysis using OpenOA's MonteCarloAEP.
    
    This function uses the full OpenOA library to perform wind plant performance analysis
    with Monte Carlo simulation for uncertainty quantification.
    
    Args:
        scada_df: DataFrame containing SCADA data
        meter_df: DataFrame containing meter data
        num_simulations: Number of Monte Carlo simulations to run (default: 50)
    
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
        if len(scada_data) < 720:  # 720 hours ≈ 30 days
            raise ValueError(
                "MonteCarloAEP requires at least ~1 month (720 hourly records) of SCADA data."
            )

        if len(meter_data) < 720:
            raise ValueError(
                "MonteCarloAEP requires at least ~1 month (720 hourly records) of meter data."
            )
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
        # Find the common date range across all datasets
        scada_start = scada_data['time'].min()
        scada_end = scada_data['time'].max()
        meter_start = meter_data['time'].min()
        meter_end = meter_data['time'].max()
        reanal_start = reanalysis_data.index.min()
        reanal_end = reanalysis_data.index.max()
        
        logger.info(f"Data ranges:")
        logger.info(f"  SCADA:      {scada_start} to {scada_end}")
        logger.info(f"  Meter:      {meter_start} to {meter_end}")
        logger.info(f"  Reanalysis: {reanal_start} to {reanal_end}")
        
        # Find the latest start date and earliest end date across all datasets
        common_start = max(scada_start, meter_start, reanal_start)
        common_end = min(scada_end, meter_end, reanal_end)
        
        # Calculate total duration - add 1 to include both start and end days
        # E.g., Jan 1 to Dec 31 should be 365 days, not 364
        total_duration_days = (common_end - common_start).days + 1
        total_duration_months = total_duration_days / 30.44  # Average month length
        
        logger.info(f"Common data period: {common_start} to {common_end}")
        logger.info(f"Total duration: {total_duration_days} days ({total_duration_months:.1f} months)")
        
        # OpenOA requires:
        # 1. Integer years for uncertainty_windiness (no decimals!)
        # 2. Sufficient data for the uncertainty window
        # 3. At least 365 days (12 months) for monthly resolution
        
        # Minimum requirement: 365 days for robust analysis
        if total_duration_days < 365:
            raise ValueError(
                f"Insufficient data: {total_duration_days} days ({total_duration_months:.1f} months). "
                f"Need at least 365 days (12 months) for AEP analysis with Monte Carlo uncertainty quantification. "
                f"Please upload data spanning at least one full year."
            )
        
        # Use DAILY resolution with 1-year uncertainty for all cases
        # This is the most reliable configuration for 12-24 months of data
        time_res = 'D'
        uncertainty = (1.0, 1.0)  # Must be integer years!
        
        # Set end_date conservatively to avoid boundary issues
        # Buffer strategy based on available data:
        if total_duration_days <= 370:
            # For exactly 12 months: No buffer (tight margin)
            buffer_days = 0
        elif total_duration_days <= 385:
            # For 12-13 months: Minimal 1-day buffer
            buffer_days = 1
        else:
            # For 13+ months: More conservative 5-day buffer
            buffer_days = 5
        
        end_date_lt = common_end.normalize() - pd.Timedelta(days=buffer_days)
        
        # Double-check we still have enough data after backing off
        # Add 1 for inclusive date counting
        effective_days = (end_date_lt - common_start).days + 1
        if effective_days < 365:
            raise ValueError(
                f"After accounting for incomplete days, only {effective_days} complete days available. "
                f"Need at least 365 days. Please upload more data."
            )
        
        logger.info(f"Using DAILY resolution with uncertainty_windiness=(1.0, 1.0)")
        logger.info(f"Buffered {buffer_days} days from end for clean boundaries")
        logger.info(f"Setting end_date_lt to: {end_date_lt} ({effective_days} complete days)")
        logger.info(f"OpenOA will use ~365 days from the dataset for long-term correction")
        
        mc_aep = MonteCarloAEP(
            plant=plant_data,
            reanalysis_products=['synthetic'],
            time_resolution=time_res,
            end_date_lt=end_date_lt,  # Explicitly set with appropriate buffer
            uncertainty_windiness=uncertainty
        )
        
        # Run the analysis
        logger.info(f"Running OpenOA Monte Carlo simulation with {num_simulations} iterations...")
        
        mc_aep.run(
            num_sim=num_simulations,  # Number of Monte Carlo simulations
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
