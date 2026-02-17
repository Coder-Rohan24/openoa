"""
Data Quality Analysis Services

Provides comprehensive data quality assessment for wind plant datasets.
Focuses on validating SCADA and meter data before analysis.
"""
import logging
from typing import Dict
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


def generate_data_quality_summary(scada_df: pd.DataFrame, meter_df: pd.DataFrame) -> Dict[str, any]:
    """
    Generate comprehensive data quality summary for SCADA and meter datasets.
    
    Analyzes both datasets to provide insights on completeness, coverage, and data issues
    that are critical for wind plant performance analysis.
    
    Args:
        scada_df: DataFrame containing SCADA data with at least 'timestamp' column
        meter_df: DataFrame containing meter data with at least 'timestamp' column
    
    Returns:
        Dictionary containing:
            - scada: Data quality metrics for SCADA data
                - total_rows: Total number of records
                - total_columns: Number of columns
                - missing_values: Dict of column names to missing percentage
                - duplicate_timestamps: Number of duplicate timestamps
                - time_coverage_days: Total days covered by data
                - start_date: First timestamp (ISO format)
                - end_date: Last timestamp (ISO format)
                - inferred_frequency: Detected data frequency (e.g., '10min', '1h')
                - completeness_score: Overall data completeness (0-100%)
            - meter: Same metrics for meter data
            - overall_quality_score: Combined quality score (0-100%)
    
    Raises:
        ValueError: If input dataframes are invalid or missing required columns
    """
    logger.info("Generating data quality summary")
    
    try:
        # Validate inputs
        if not isinstance(scada_df, pd.DataFrame) or not isinstance(meter_df, pd.DataFrame):
            raise ValueError("Both inputs must be pandas DataFrames")
        
        if scada_df.empty or meter_df.empty:
            raise ValueError("DataFrames cannot be empty")
        
        if 'timestamp' not in scada_df.columns:
            raise ValueError("SCADA DataFrame must have 'timestamp' column")
        
        if 'timestamp' not in meter_df.columns:
            raise ValueError("Meter DataFrame must have 'timestamp' column")
        
        # Helper function to analyze a single dataframe
        def analyze_dataset(df: pd.DataFrame, dataset_name: str) -> Dict[str, any]:
            """Analyze individual dataset for quality metrics."""
            logger.debug(f"Analyzing {dataset_name} dataset")
            
            # Create copy and convert timestamp
            data = df.copy()
            data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')
            
            # Remove rows with invalid timestamps
            invalid_timestamps = data['timestamp'].isna().sum()
            if invalid_timestamps > 0:
                logger.warning(f"{dataset_name}: {invalid_timestamps} invalid timestamps found and removed")
                data = data.dropna(subset=['timestamp'])
            
            # Sort by timestamp
            data = data.sort_values('timestamp')
            
            # 1. Total rows and columns
            total_rows = len(data)
            total_columns = len(data.columns)
            
            # 2. Missing values per column (percentage)
            missing_values = {}
            for col in data.columns:
                missing_count = data[col].isna().sum()
                missing_pct = round((missing_count / total_rows) * 100, 2)
                if missing_pct > 0:
                    missing_values[col] = missing_pct
            
            # 3. Duplicate timestamps
            duplicate_timestamps = data['timestamp'].duplicated().sum()
            
            # 4. Time coverage
            start_date = data['timestamp'].min()
            end_date = data['timestamp'].max()
            time_coverage_days = (end_date - start_date).total_seconds() / 86400  # Convert to days
            
            # 5. Infer data frequency
            if len(data) > 1:
                # Calculate time differences between consecutive records
                time_diffs = data['timestamp'].diff().dropna()
                
                # Get most common time difference
                most_common_diff = time_diffs.mode()
                
                if len(most_common_diff) > 0:
                    freq_seconds = most_common_diff.iloc[0].total_seconds()
                    
                    # Map to standard frequencies
                    if freq_seconds < 600:  # Less than 10 minutes
                        inferred_frequency = f"{int(freq_seconds/60)}min"
                    elif freq_seconds < 3600:  # Less than 1 hour
                        inferred_frequency = f"{int(freq_seconds/60)}min"
                    elif freq_seconds < 86400:  # Less than 1 day
                        hours = freq_seconds / 3600
                        if hours == 1.0:
                            inferred_frequency = "1h"
                        else:
                            inferred_frequency = f"{hours}h"
                    else:
                        days = freq_seconds / 86400
                        inferred_frequency = f"{days}d"
                else:
                    inferred_frequency = "unknown"
            else:
                inferred_frequency = "single_record"
            
            # 6. Calculate completeness score
            # Based on: missing values (50%), expected records (30%), duplicates (20%)
            
            # Missing values score (0-50 points)
            avg_missing_pct = np.mean(list(missing_values.values())) if missing_values else 0
            missing_score = max(0, 50 - avg_missing_pct)
            
            # Expected records score (0-30 points)
            # Estimate expected records based on time coverage and frequency
            if inferred_frequency != "unknown" and inferred_frequency != "single_record":
                try:
                    # Parse frequency to get expected interval
                    if 'min' in inferred_frequency:
                        interval_minutes = int(inferred_frequency.replace('min', ''))
                        expected_records = (time_coverage_days * 24 * 60) / interval_minutes
                    elif 'h' in inferred_frequency:
                        interval_hours = float(inferred_frequency.replace('h', ''))
                        expected_records = (time_coverage_days * 24) / interval_hours
                    else:
                        expected_records = total_rows
                    
                    completeness_ratio = min(1.0, total_rows / expected_records)
                    expected_score = completeness_ratio * 30
                except:
                    expected_score = 30  # Default to full score if can't calculate
            else:
                expected_score = 30
            
            # Duplicates score (0-20 points)
            duplicate_ratio = duplicate_timestamps / total_rows if total_rows > 0 else 0
            duplicate_score = max(0, 20 - (duplicate_ratio * 100))
            
            # Total completeness score
            completeness_score = round(missing_score + expected_score + duplicate_score, 2)
            
            return {
                'total_rows': int(total_rows),
                'total_columns': int(total_columns),
                'missing_values': missing_values,
                'duplicate_timestamps': int(duplicate_timestamps),
                'time_coverage_days': round(time_coverage_days, 2),
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'inferred_frequency': inferred_frequency,
                'completeness_score': float(completeness_score)
            }
        
        # Analyze both datasets
        scada_quality = analyze_dataset(scada_df, "SCADA")
        meter_quality = analyze_dataset(meter_df, "Meter")
        
        # Calculate overall quality score (weighted average)
        # SCADA is weighted 60%, Meter 40% (SCADA typically more critical)
        overall_quality_score = round(
            (scada_quality['completeness_score'] * 0.6) + 
            (meter_quality['completeness_score'] * 0.4),
            2
        )
        
        result = {
            'scada': scada_quality,
            'meter': meter_quality,
            'overall_quality_score': float(overall_quality_score)
        }
        
        logger.info(
            f"Data quality summary generated - "
            f"SCADA: {scada_quality['completeness_score']}%, "
            f"Meter: {meter_quality['completeness_score']}%, "
            f"Overall: {overall_quality_score}%"
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in data quality analysis: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in data quality analysis: {str(e)}", exc_info=True)
        raise ValueError(f"Data quality analysis failed: {str(e)}")
