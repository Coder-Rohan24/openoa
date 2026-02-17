"""
Energy Production Analysis Services

Provides energy production metrics and time-series analysis.
Focuses on meter data aggregation and performance metrics.
"""
import logging
from typing import Dict, List
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def compute_monthly_energy(meter_df: pd.DataFrame) -> List[Dict[str, any]]:
    """
    Calculate monthly energy production totals from meter data.
    
    Aggregates meter energy readings by month to show seasonal production patterns
    and identify trends in plant performance.
    
    Args:
        meter_df: DataFrame containing meter data with columns:
                 - timestamp: DateTime column
                 - energy_kwh (or 'energy'): Energy production in kWh
    
    Returns:
        List of dictionaries containing:
            - month: Month identifier in 'YYYY-MM' format (e.g., '2023-01')
            - energy: Total energy for that month in MWh
            - days: Number of days with data in that month
            - avg_daily: Average daily energy in MWh
    
    Raises:
        ValueError: If input dataframe is invalid or missing required columns
    
    Example:
        >>> monthly = compute_monthly_energy(meter_df)
        >>> print(monthly[0])
        {'month': '2023-01', 'energy': 4532.5, 'days': 31, 'avg_daily': 146.2}
    """
    logger.info("Computing monthly energy production")
    
    try:
        # Validate input
        if not isinstance(meter_df, pd.DataFrame):
            raise ValueError("Input must be a pandas DataFrame")
        
        if meter_df.empty:
            raise ValueError("DataFrame cannot be empty")
        
        if 'timestamp' not in meter_df.columns:
            raise ValueError("Meter DataFrame must have 'timestamp' column")
        
        # Check for energy column (support both 'energy' and 'energy_kwh')
        energy_col = None
        if 'energy_kwh' in meter_df.columns:
            energy_col = 'energy_kwh'
        elif 'energy' in meter_df.columns:
            energy_col = 'energy'
        else:
            raise ValueError("Meter DataFrame must have 'energy_kwh' or 'energy' column")
        
        logger.debug(f"Using energy column: {energy_col}")
        
        # Create copy to avoid modifying original
        data = meter_df[['timestamp', energy_col]].copy()
        
        # 1. Convert timestamp to datetime
        data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')
        
        # Remove rows with invalid timestamps
        invalid_count = data['timestamp'].isna().sum()
        if invalid_count > 0:
            logger.warning(f"Removing {invalid_count} rows with invalid timestamps")
            data = data.dropna(subset=['timestamp'])
        
        if len(data) == 0:
            raise ValueError("No valid data after removing invalid timestamps")
        
        # Remove negative energy values (physically impossible)
        negative_count = (data[energy_col] < 0).sum()
        if negative_count > 0:
            logger.warning(f"Removing {negative_count} negative energy values")
            data = data[data[energy_col] >= 0]
        
        # 2. Set timestamp as index
        data = data.set_index('timestamp')
        data = data.sort_index()
        
        logger.info(
            f"Data range: {data.index.min().strftime('%Y-%m-%d')} to "
            f"{data.index.max().strftime('%Y-%m-%d')}"
        )
        
        # 3. Resample monthly and sum energy
        monthly_energy = data[energy_col].resample('MS').agg({
            'energy': 'sum',
            'count': 'count'
        })
        
        # MS = Month Start frequency
        # Alternative resampling for better aggregation
        monthly_data = data.resample('MS').agg({
            energy_col: ['sum', 'count']
        })
        
        # Flatten multi-level column names
        monthly_data.columns = ['energy_sum', 'record_count']
        
        # Calculate days per month (actual days with data)
        days_per_month = data.resample('MS').apply(
            lambda x: (x.index.max() - x.index.min()).days + 1 if len(x) > 0 else 0
        )
        
        # 4. Build result list
        result = []
        for timestamp, row in monthly_data.iterrows():
            energy_kwh = row['energy_sum']
            record_count = int(row['record_count'])
            
            # Skip months with no data
            if pd.isna(energy_kwh) or energy_kwh == 0:
                continue
            
            # Convert kWh to MWh for better readability
            energy_mwh = energy_kwh / 1000.0
            
            # Get days for this month
            days = days_per_month.loc[timestamp] if timestamp in days_per_month.index else 0
            
            # Calculate average daily energy
            avg_daily = energy_mwh / days if days > 0 else 0
            
            month_entry = {
                'month': timestamp.strftime('%Y-%m'),
                'energy': round(float(energy_mwh), 2),
                'days': int(days),
                'avg_daily': round(float(avg_daily), 2),
                'records': record_count
            }
            
            result.append(month_entry)
        
        if len(result) == 0:
            raise ValueError("No monthly energy data could be computed")
        
        logger.info(
            f"Monthly energy computed - {len(result)} months, "
            f"Total: {sum(m['energy'] for m in result):.2f} MWh"
        )
        
        # Log sample of first and last months
        if len(result) > 0:
            logger.debug(f"First month: {result[0]}")
            logger.debug(f"Last month: {result[-1]}")
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in monthly energy computation: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in monthly energy computation: {str(e)}", exc_info=True)
        raise ValueError(f"Monthly energy computation failed: {str(e)}")


def calculate_capacity_factor(meter_df: pd.DataFrame, rated_capacity_kw: float) -> Dict[str, any]:
    """
    Calculate wind plant capacity factor from meter data.
    
    Capacity factor is the ratio of actual energy production to theoretical maximum
    production if the plant operated at rated capacity continuously. This is a key
    performance metric for wind plant assessment.
    
    Args:
        meter_df: DataFrame containing meter data with columns:
                 - timestamp: DateTime column
                 - energy_kwh (or 'energy'): Energy production in kWh
        rated_capacity_kw: Rated (nameplate) capacity of the plant in kW
    
    Returns:
        Dictionary containing:
            - capacity_factor: Percentage (0-100%)
            - actual_energy_kwh: Total actual energy produced (kWh)
            - theoretical_energy_kwh: Maximum possible energy (kWh)
            - duration_hours: Time period analyzed (hours)
            - capacity_factor_decimal: Decimal form (0-1) for further calculations
    
    Raises:
        ValueError: If inputs are invalid or rated capacity is non-positive
    
    Example:
        >>> cf = calculate_capacity_factor(meter_df, rated_capacity_kw=2500)
        >>> print(f"Capacity Factor: {cf['capacity_factor']:.2f}%")
        Capacity Factor: 42.35%
    
    Note:
        Industry benchmarks:
        - Onshore wind: 25-45% typical
        - Offshore wind: 40-60% typical
        - Values > 60% uncommon (would indicate excellent wind resource)
    """
    logger.info(f"Calculating capacity factor with rated capacity: {rated_capacity_kw} kW")
    
    try:
        # Validate inputs
        if not isinstance(meter_df, pd.DataFrame):
            raise ValueError("meter_df must be a pandas DataFrame")
        
        if meter_df.empty:
            raise ValueError("meter_df cannot be empty")
        
        if 'timestamp' not in meter_df.columns:
            raise ValueError("meter_df must have 'timestamp' column")
        
        # Validate rated capacity
        if not isinstance(rated_capacity_kw, (int, float)):
            raise ValueError("rated_capacity_kw must be a number")
        
        if rated_capacity_kw <= 0:
            raise ValueError("rated_capacity_kw must be positive")
        
        if rated_capacity_kw > 1000000:  # Sanity check: 1 GW max
            logger.warning(
                f"Rated capacity {rated_capacity_kw} kW seems unusually high. "
                "Please verify this is correct."
            )
        
        # Check for energy column (support both 'energy_kwh' and 'energy')
        energy_col = None
        if 'energy_kwh' in meter_df.columns:
            energy_col = 'energy_kwh'
        elif 'energy' in meter_df.columns:
            energy_col = 'energy'
        else:
            raise ValueError("meter_df must have 'energy_kwh' or 'energy' column")
        
        # Create copy to avoid modifying original
        data = meter_df[['timestamp', energy_col]].copy()
        
        # Convert timestamp to datetime
        data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')
        
        # Remove invalid timestamps
        invalid_count = data['timestamp'].isna().sum()
        if invalid_count > 0:
            logger.warning(f"Removing {invalid_count} rows with invalid timestamps")
            data = data.dropna(subset=['timestamp'])
        
        if len(data) == 0:
            raise ValueError("No valid data after removing invalid timestamps")
        
        # Remove negative energy values
        negative_count = (data[energy_col] < 0).sum()
        if negative_count > 0:
            logger.warning(f"Removing {negative_count} negative energy values")
            data = data[data[energy_col] >= 0]
        
        if len(data) == 0:
            raise ValueError("No valid data after removing negative energy values")
        
        # Sort by timestamp
        data = data.sort_values('timestamp')
        
        # 1. Calculate total energy produced (actual)
        actual_energy_kwh = float(data[energy_col].sum())
        
        # 2. Calculate time duration
        start_time = data['timestamp'].min()
        end_time = data['timestamp'].max()
        duration_seconds = (end_time - start_time).total_seconds()
        duration_hours = duration_seconds / 3600.0
        
        if duration_hours <= 0:
            raise ValueError("Time duration must be positive")
        
        logger.info(
            f"Data spans {duration_hours:.2f} hours from "
            f"{start_time.strftime('%Y-%m-%d %H:%M')} to "
            f"{end_time.strftime('%Y-%m-%d %H:%M')}"
        )
        
        # 3. Calculate theoretical maximum energy
        # Theoretical energy = Rated capacity (kW) × Time (hours)
        theoretical_energy_kwh = rated_capacity_kw * duration_hours
        
        # 4. Calculate capacity factor
        # CF = (Actual energy / Theoretical energy) × 100%
        capacity_factor_decimal = actual_energy_kwh / theoretical_energy_kwh
        capacity_factor_percent = capacity_factor_decimal * 100.0
        
        # Validate result is reasonable
        if capacity_factor_percent > 100:
            logger.warning(
                f"Capacity factor {capacity_factor_percent:.2f}% exceeds 100%. "
                "This suggests actual production exceeded rated capacity, which is unusual. "
                "Please verify rated_capacity_kw is correct."
            )
        elif capacity_factor_percent > 70:
            logger.warning(
                f"Capacity factor {capacity_factor_percent:.2f}% is unusually high (>70%). "
                "Typical onshore wind: 25-45%, offshore: 40-60%."
            )
        elif capacity_factor_percent < 5:
            logger.warning(
                f"Capacity factor {capacity_factor_percent:.2f}% is unusually low (<5%). "
                "This may indicate plant downtime or data quality issues."
            )
        
        # Build result
        result = {
            'capacity_factor': round(float(capacity_factor_percent), 2),
            'capacity_factor_decimal': round(float(capacity_factor_decimal), 4),
            'actual_energy_kwh': round(float(actual_energy_kwh), 2),
            'actual_energy_mwh': round(float(actual_energy_kwh / 1000), 2),
            'theoretical_energy_kwh': round(float(theoretical_energy_kwh), 2),
            'theoretical_energy_mwh': round(float(theoretical_energy_kwh / 1000), 2),
            'duration_hours': round(float(duration_hours), 2),
            'duration_days': round(float(duration_hours / 24), 2),
            'rated_capacity_kw': float(rated_capacity_kw),
            'rated_capacity_mw': round(float(rated_capacity_kw / 1000), 2),
            'period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            }
        }
        
        logger.info(
            f"Capacity factor calculated: {result['capacity_factor']:.2f}% "
            f"(Actual: {result['actual_energy_mwh']:.2f} MWh / "
            f"Theoretical: {result['theoretical_energy_mwh']:.2f} MWh)"
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in capacity factor calculation: {str(e)}")
        raise
    except ZeroDivisionError as e:
        logger.error("Division by zero in capacity factor calculation")
        raise ValueError("Cannot calculate capacity factor: theoretical energy is zero")
    except Exception as e:
        logger.error(f"Unexpected error in capacity factor calculation: {str(e)}", exc_info=True)
        raise ValueError(f"Capacity factor calculation failed: {str(e)}")
