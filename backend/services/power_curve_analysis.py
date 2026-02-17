"""
Power Curve Analysis Services

Provides turbine power curve generation and performance analysis.
Focuses on wind speed to power relationships for turbine characterization.
"""
import logging
from typing import Dict
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def generate_power_curve(scada_df: pd.DataFrame) -> Dict[str, any]:
    """
    Generate turbine power curve from SCADA data.
    
    Creates binned power curve showing relationship between wind speed and power output.
    This is the fundamental performance characteristic used in wind energy analysis.
    
    Args:
        scada_df: DataFrame containing SCADA data with columns:
                 - WMET_HorWdSpd: Horizontal wind speed (m/s)
                 - WTUR_W: Turbine power output (kW)
    
    Returns:
        Dictionary containing:
            - wind_speed_bins: List of wind speed bin centers (m/s)
            - avg_power_per_bin: List of average power for each bin (kW)
            - count_per_bin: List of data points per bin
            - std_per_bin: List of standard deviation per bin (kW)
    
    Raises:
        ValueError: If input dataframe is invalid or missing required columns
    
    Example:
        >>> power_curve = generate_power_curve(scada_df)
        >>> # Plot: scatter(power_curve['wind_speed_bins'], power_curve['avg_power_per_bin'])
    """
    logger.info("Generating power curve from SCADA data")
    
    try:
        # Validate input
        if not isinstance(scada_df, pd.DataFrame):
            raise ValueError("Input must be a pandas DataFrame")
        
        if scada_df.empty:
            raise ValueError("DataFrame cannot be empty")
        
        # Check for required columns
        required_cols = ['WMET_HorWdSpd', 'WTUR_W']
        missing_cols = [col for col in required_cols if col not in scada_df.columns]
        
        if missing_cols:
            raise ValueError(
                f"Missing required columns: {missing_cols}. "
                f"SCADA data must have 'WMET_HorWdSpd' (wind speed) and 'WTUR_W' (power)."
            )
        
        # Create copy and extract relevant columns
        data = scada_df[['WMET_HorWdSpd', 'WTUR_W']].copy()
        
        # Rename for easier handling
        data.columns = ['wind_speed', 'power']
        
        # Clean data - remove NaN values
        original_count = len(data)
        data = data.dropna()
        cleaned_count = len(data)
        
        if cleaned_count == 0:
            raise ValueError("No valid data after removing NaN values")
        
        if cleaned_count < original_count:
            removed_count = original_count - cleaned_count
            logger.warning(f"Removed {removed_count} rows with NaN values")
        
        # Remove negative wind speeds (physically impossible)
        negative_wind = (data['wind_speed'] < 0).sum()
        if negative_wind > 0:
            logger.warning(f"Removing {negative_wind} rows with negative wind speed")
            data = data[data['wind_speed'] >= 0]
        
        # Remove negative power (can happen during turbine startup issues)
        negative_power = (data['power'] < 0).sum()
        if negative_power > 0:
            logger.warning(f"Removing {negative_power} rows with negative power")
            data = data[data['power'] >= 0]
        
        if len(data) == 0:
            raise ValueError("No valid data after cleaning")
        
        logger.info(f"Power curve data cleaned - {len(data)} valid records")
        
        # Define wind speed bins (industry standard: 0-30 m/s in 1 m/s increments)
        max_wind = data['wind_speed'].max()
        max_bin = min(30, int(np.ceil(max_wind)) + 1)
        
        # Create bin edges: [0, 1, 2, 3, ..., max_bin]
        bin_edges = np.arange(0, max_bin + 1, 1)
        
        # Create bin labels (bin centers for plotting)
        bin_centers = [(bin_edges[i] + bin_edges[i+1]) / 2 
                      for i in range(len(bin_edges) - 1)]
        
        # Bin the wind speed data
        data['wind_bin'] = pd.cut(
            data['wind_speed'],
            bins=bin_edges,
            labels=bin_centers,
            include_lowest=True
        )
        
        # Calculate statistics per bin
        binned_stats = data.groupby('wind_bin', observed=True)['power'].agg([
            ('mean', 'mean'),
            ('std', 'std'),
            ('count', 'count')
        ]).reset_index()
        
        # Ensure all bins are represented (fill missing bins with None)
        all_bins = pd.DataFrame({'wind_bin': bin_centers})
        binned_stats = all_bins.merge(
            binned_stats,
            on='wind_bin',
            how='left'
        )
        
        # Convert wind_bin to numeric for consistency
        binned_stats['wind_bin'] = pd.to_numeric(binned_stats['wind_bin'])
        
        # Fill missing values
        # - Empty bins: mean = NaN (will convert to None for JSON)
        # - Empty bins: std = NaN
        # - Empty bins: count = 0
        binned_stats['count'] = binned_stats['count'].fillna(0).astype(int)
        
        # Build result lists
        wind_speed_bins = binned_stats['wind_bin'].tolist()
        avg_power_per_bin = binned_stats['mean'].tolist()
        std_per_bin = binned_stats['std'].tolist()
        count_per_bin = binned_stats['count'].tolist()
        
        # Convert NaN to None for proper JSON serialization
        avg_power_per_bin = [
            round(float(x), 2) if pd.notna(x) else None 
            for x in avg_power_per_bin
        ]
        std_per_bin = [
            round(float(x), 2) if pd.notna(x) else None 
            for x in std_per_bin
        ]
        
        # Calculate some summary statistics
        non_zero_bins = sum(1 for count in count_per_bin if count > 0)
        max_power = data['power'].max()
        cut_in_speed = None
        rated_power = None
        
        # Try to identify cut-in wind speed (first bin with significant power)
        for i, (power, count) in enumerate(zip(avg_power_per_bin, count_per_bin)):
            if power is not None and count > 5 and power > 10:  # > 10 kW with > 5 samples
                cut_in_speed = wind_speed_bins[i]
                break
        
        # Try to identify rated power (max stable power)
        if max_power > 0:
            # Look for bins near maximum power
            power_threshold = max_power * 0.95
            for i, power in enumerate(avg_power_per_bin):
                if power is not None and power >= power_threshold:
                    rated_power = round(float(max_power), 2)
                    break
        
        result = {
            'wind_speed_bins': [round(float(x), 2) for x in wind_speed_bins],
            'avg_power_per_bin': avg_power_per_bin,
            'count_per_bin': count_per_bin,
            'std_per_bin': std_per_bin,
            'summary': {
                'total_bins': len(wind_speed_bins),
                'non_zero_bins': non_zero_bins,
                'max_power': round(float(max_power), 2),
                'cut_in_speed': round(float(cut_in_speed), 2) if cut_in_speed else None,
                'rated_power': rated_power,
                'total_records': int(len(data))
            }
        }
        
        logger.info(
            f"Power curve generated - {non_zero_bins}/{len(wind_speed_bins)} bins with data, "
            f"Max power: {max_power:.2f} kW"
        )
        
        if cut_in_speed:
            logger.debug(f"Detected cut-in wind speed: {cut_in_speed:.2f} m/s")
        if rated_power:
            logger.debug(f"Detected rated power: {rated_power:.2f} kW")
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in power curve generation: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in power curve generation: {str(e)}", exc_info=True)
        raise ValueError(f"Power curve generation failed: {str(e)}")
