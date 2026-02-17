"""
Wind Resource Analysis Services

Provides wind resource characterization and statistical analysis.
Focuses on wind speed distributions and basic resource metrics.
"""
import logging
from typing import Dict
import pandas as pd
import numpy as np
from scipy import stats

logger = logging.getLogger(__name__)


def compute_wind_statistics(scada_df: pd.DataFrame) -> Dict[str, any]:
    """
    Calculate comprehensive wind speed statistics from SCADA data.
    
    Computes statistical measures and histogram data for wind resource characterization.
    Returns structured data suitable for frontend visualization.
    
    Args:
        scada_df: DataFrame containing SCADA data with 'wind_speed' column
    
    Returns:
        Dictionary containing:
            - mean: Average wind speed (m/s)
            - median: Median wind speed (m/s)
            - std: Standard deviation (m/s)
            - min: Minimum wind speed (m/s)
            - max: Maximum wind speed (m/s)
            - histogram_bins: List of bin edges for histogram
            - histogram_counts: List of counts per bin
    
    Raises:
        ValueError: If input dataframe is invalid or missing required columns
    
    Example:
        >>> stats = compute_wind_statistics(scada_df)
        >>> print(f"Average wind speed: {stats['mean']:.2f} m/s")
        >>> # Frontend can plot: histogram(stats['histogram_bins'], stats['histogram_counts'])
    """
    logger.info("Computing wind speed statistics")
    
    try:
        # Validate input
        if not isinstance(scada_df, pd.DataFrame):
            raise ValueError("Input must be a pandas DataFrame")
        
        if scada_df.empty:
            raise ValueError("DataFrame cannot be empty")
        
        if 'wind_speed' not in scada_df.columns:
            raise ValueError("SCADA DataFrame must have 'wind_speed' column")
        
        # Create copy and clean data
        data = scada_df.copy()
        wind_speed = data['wind_speed'].copy()
        
        # Remove NaN values
        original_count = len(wind_speed)
        wind_speed = wind_speed.dropna()
        cleaned_count = len(wind_speed)
        
        if cleaned_count == 0:
            raise ValueError("No valid wind speed data after removing NaN values")
        
        if cleaned_count < original_count:
            removed_count = original_count - cleaned_count
            logger.warning(f"Removed {removed_count} NaN values from wind speed data")
        
        # Remove negative values (physically impossible)
        negative_count = (wind_speed < 0).sum()
        if negative_count > 0:
            logger.warning(f"Removing {negative_count} negative wind speed values")
            wind_speed = wind_speed[wind_speed >= 0]
        
        if len(wind_speed) == 0:
            raise ValueError("No valid wind speed data after cleaning")
        
        # 1. Calculate basic statistics
        mean_wind_speed = float(wind_speed.mean())
        median_wind_speed = float(wind_speed.median())
        std_wind_speed = float(wind_speed.std())
        min_wind_speed = float(wind_speed.min())
        max_wind_speed = float(wind_speed.max())
        
        logger.info(
            f"Wind statistics - Mean: {mean_wind_speed:.2f} m/s, "
            f"Median: {median_wind_speed:.2f} m/s, "
            f"Std: {std_wind_speed:.2f} m/s, "
            f"Range: [{min_wind_speed:.2f}, {max_wind_speed:.2f}] m/s"
        )
        
        # 2. Generate histogram bins and counts
        # Use standard wind speed bins (0-30 m/s in 1 m/s increments)
        # This is industry standard for wind resource assessment
        max_bin = min(30, int(np.ceil(max_wind_speed)))  # Cap at 30 m/s or data max
        bins = np.arange(0, max_bin + 1, 1)  # 0, 1, 2, ..., max_bin
        
        # Calculate histogram
        counts, bin_edges = np.histogram(wind_speed, bins=bins)
        
        # Convert to list for JSON serialization
        histogram_bins = bin_edges.tolist()
        histogram_counts = counts.tolist()
        
        # Calculate bin centers for better visualization
        # Formula: center = (left_edge + right_edge) / 2
        bin_centers = [(histogram_bins[i] + histogram_bins[i+1]) / 2 
                      for i in range(len(histogram_bins) - 1)]
        
        logger.info(f"Generated histogram with {len(histogram_counts)} bins")
        logger.debug(f"Histogram bins: {histogram_bins[:5]}... (showing first 5)")
        logger.debug(f"Histogram counts: {histogram_counts[:5]}... (showing first 5)")
        
        # Prepare result dictionary
        result = {
            "mean": round(mean_wind_speed, 2),
            "median": round(median_wind_speed, 2),
            "std": round(std_wind_speed, 2),
            "min": round(min_wind_speed, 2),
            "max": round(max_wind_speed, 2),
            "histogram_bins": [round(b, 2) for b in histogram_bins],
            "histogram_counts": histogram_counts,
            "bin_centers": [round(c, 2) for c in bin_centers]
        }
        
        logger.info(
            f"Wind statistics computed successfully - "
            f"{cleaned_count} records analyzed, "
            f"mean={result['mean']} m/s"
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in wind statistics: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in wind statistics: {str(e)}", exc_info=True)
        raise ValueError(f"Wind statistics computation failed: {str(e)}")


def compute_weibull_fit(scada_df: pd.DataFrame) -> Dict[str, any]:
    """
    Fit Weibull distribution to wind speed data for resource characterization.
    
    The Weibull distribution is the industry-standard statistical model for wind speed
    distributions. The shape (k) and scale (c) parameters characterize the wind resource
    and are used for long-term energy predictions.
    
    Args:
        scada_df: DataFrame containing SCADA data with 'WMET_HorWdSpd' column
                 (horizontal wind speed in m/s)
    
    Returns:
        Dictionary containing:
            - shape_k: Weibull shape parameter (dimensionless)
            - scale_c: Weibull scale parameter (m/s)
            - mean_weibull: Mean wind speed from Weibull fit (m/s)
            - valid_samples: Number of data points used in fit
    
    Raises:
        ValueError: If input dataframe is invalid or missing required columns
    
    Example:
        >>> weibull = compute_weibull_fit(scada_df)
        >>> print(f"Shape k: {weibull['shape_k']:.2f}, Scale c: {weibull['scale_c']:.2f}")
        Shape k: 2.15, Scale c: 8.45
    
    Note:
        Typical ranges:
        - Shape k: 1.5-3.0 (2.0 is common for wind)
        - Scale c: Similar to mean wind speed but slightly higher
        - Higher k = more consistent winds, lower k = more variable
    """
    logger.info("Computing Weibull distribution fit for wind speed")
    
    try:
        # Validate input
        if not isinstance(scada_df, pd.DataFrame):
            raise ValueError("Input must be a pandas DataFrame")
        
        if scada_df.empty:
            raise ValueError("DataFrame cannot be empty")
        
        if 'WMET_HorWdSpd' not in scada_df.columns:
            raise ValueError("SCADA DataFrame must have 'WMET_HorWdSpd' column")
        
        # Extract wind speed data
        wind_speed = scada_df['WMET_HorWdSpd'].copy()
        
        # Remove NaN values
        original_count = len(wind_speed)
        wind_speed = wind_speed.dropna()
        
        if len(wind_speed) == 0:
            raise ValueError("No valid wind speed data after removing NaN values")
        
        # 2. Remove zero and negative values (required for Weibull fitting)
        wind_speed = wind_speed[wind_speed > 0]
        
        valid_count = len(wind_speed)
        removed_count = original_count - valid_count
        
        if removed_count > 0:
            logger.warning(
                f"Removed {removed_count} non-positive values "
                f"({removed_count/original_count*100:.1f}% of data)"
            )
        
        if valid_count == 0:
            raise ValueError("No positive wind speed values available for Weibull fitting")
        
        if valid_count < 100:
            logger.warning(
                f"Only {valid_count} samples available. "
                "Weibull fit may be unreliable with < 100 samples."
            )
        
        # 3. Fit Weibull distribution using scipy
        # weibull_min.fit returns (shape, loc, scale)
        # For wind: loc=0 (no location shift), so we fix it
        try:
            shape_k, loc, scale_c = stats.weibull_min.fit(wind_speed, floc=0)
        except Exception as e:
            logger.error(f"Weibull fitting failed: {str(e)}")
            raise ValueError(f"Failed to fit Weibull distribution: {str(e)}")
        
        # Validate fitted parameters are reasonable
        if shape_k <= 0 or scale_c <= 0:
            raise ValueError(
                f"Invalid Weibull parameters: k={shape_k:.3f}, c={scale_c:.3f}. "
                "Both must be positive."
            )
        
        if shape_k > 10 or shape_k < 0.5:
            logger.warning(
                f"Weibull shape k={shape_k:.2f} is outside typical range (0.5-10). "
                "Typical wind: 1.5-3.0."
            )
        
        if scale_c > 50:
            logger.warning(
                f"Weibull scale c={scale_c:.2f} m/s seems unusually high. "
                "Typical wind scales are < 20 m/s."
            )
        
        # Calculate mean wind speed from Weibull parameters
        # Mean = scale * Gamma(1 + 1/shape)
        from scipy.special import gamma
        mean_weibull = scale_c * gamma(1 + 1/shape_k)
        
        # 4. Build result
        result = {
            'shape_k': round(float(shape_k), 3),
            'scale_c': round(float(scale_c), 3),
            'mean_weibull': round(float(mean_weibull), 2),
            'valid_samples': int(valid_count)
        }
        
        logger.info(
            f"Weibull fit complete - k={result['shape_k']:.3f}, "
            f"c={result['scale_c']:.3f} m/s, "
            f"mean={result['mean_weibull']:.2f} m/s "
            f"({valid_count} samples)"
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in Weibull fitting: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in Weibull fitting: {str(e)}", exc_info=True)
        raise ValueError(f"Weibull fitting failed: {str(e)}")
