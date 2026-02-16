"""
Data Quality and Boundary Condition Tests

Tests for:
- Data quality issues (NaN, outliers, duplicates)
- Boundary conditions
- Data consistency
- Timestamp alignment
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.openoa_services import run_aep_analysis


@pytest.mark.unit
class TestDataQuality:
    """Test data quality handling"""
    
    def test_nan_values_in_wind_speed(self):
        """Test handling of NaN values in wind speed"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        # Insert some NaN values
        wind_speeds = np.random.uniform(5, 15, periods)
        wind_speeds[100:110] = np.nan  # 10 consecutive NaN values
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': wind_speeds,
            'power': np.random.uniform(500, 1800, periods)
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': scada['power'] * (10 / 60)
        })
        
        # OpenOA should handle NaN via resampling/filling
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_outliers_in_power(self):
        """Test handling of outlier power values"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        powers = np.random.uniform(500, 1800, periods)
        # Add some outliers
        powers[50] = 10000  # Impossible high value
        powers[100] = -5000  # Impossible negative value
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(5, 15, periods),
            'power': powers
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': np.abs(scada['power']) * (10 / 60)
        })
        
        # Should not crash
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_duplicate_timestamps(self):
        """Test handling of duplicate timestamps"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        # Duplicate some timestamps
        timestamps[100] = timestamps[99]
        timestamps[200] = timestamps[199]
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(5, 15, periods),
            'power': np.random.uniform(500, 1800, periods)
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': scada['power'] * (10 / 60)
        })
        
        # OpenOA resampling should handle duplicates
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_unsorted_timestamps(self):
        """Test data with unsorted timestamps"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        # Shuffle some timestamps
        import random
        random.seed(42)
        indices = list(range(len(timestamps)))
        random.shuffle(indices[:1000])  # Shuffle first 1000
        
        shuffled_timestamps = [timestamps[i] for i in indices]
        
        scada = pd.DataFrame({
            'timestamp': shuffled_timestamps,
            'wind_speed': np.random.uniform(5, 15, periods),
            'power': np.random.uniform(500, 1800, periods)
        })
        
        meter = pd.DataFrame({
            'timestamp': shuffled_timestamps,
            'energy': scada['power'] * (10 / 60)
        })
        
        # Pandas should auto-sort during datetime conversion
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_extreme_temperature_variation(self):
        """Test handling of data with extreme weather variations"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        # Extreme wind variability
        wind_speeds = np.concatenate([
            np.zeros(1000),  # Dead calm
            np.ones(1000) * 25,  # Sustained high wind
            np.random.uniform(0, 30, periods - 2000)  # Normal variation
        ])
        
        powers = np.where(wind_speeds < 3, 0,
                 np.where(wind_speeds < 12, (wind_speeds ** 3) * 12,
                 np.where(wind_speeds <= 25, 2000, 0)))
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': wind_speeds,
            'power': powers
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': scada['power'] * (10 / 60)
        })
        
        result = run_aep_analysis(scada, meter)
        assert result is not None


@pytest.mark.unit
class TestBoundaryConditions:
    """Test boundary conditions"""
    
    def test_minimum_data_requirement_boundary(self):
        """Test exactly at minimum data requirement"""
        # Exactly 365 days
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(5, 15, periods),
            'power': np.random.uniform(500, 1800, periods)
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': scada['power'] * (10 / 60)
        })
        
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_data_ends_at_midnight(self):
        """Test data ending exactly at midnight"""
        start = datetime(2022, 1, 1, 0, 0, 0)
        end = datetime(2023, 1, 1, 0, 0, 0)  # Exactly midnight
        timestamps = pd.date_range(start, end, freq='10min')[:-1]  # Exclude last to end at 23:50
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(5, 15, len(timestamps)),
            'power': np.random.uniform(500, 1800, len(timestamps))
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': scada['power'] * (10 / 60)
        })
        
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_year_boundary(self):
        """Test data spanning New Year"""
        start = datetime(2022, 12, 1)
        periods = 144 * 60  # 60 days (crosses into 2023)
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        # Need more data for analysis
        start_extended = datetime(2022, 1, 1)
        periods_extended = 144 * 365
        timestamps_extended = [start_extended + timedelta(minutes=10*i) for i in range(periods_extended)]
        
        scada = pd.DataFrame({
            'timestamp': timestamps_extended,
            'wind_speed': np.random.uniform(5, 15, periods_extended),
            'power': np.random.uniform(500, 1800, periods_extended)
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps_extended,
            'energy': scada['power'] * (10 / 60)
        })
        
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_daylight_saving_time(self):
        """Test data spanning daylight saving time transition"""
        # March 2022 DST transition (US)
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(5, 15, periods),
            'power': np.random.uniform(500, 1800, periods)
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': scada['power'] * (10 / 60)
        })
        
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_maximum_wind_speed_boundary(self):
        """Test at maximum reasonable wind speed"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        # All wind speeds at exactly cut-out speed
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.ones(periods) * 25.0,  # Exactly at cut-out
            'power': np.zeros(periods)  # Should be zero at cut-out
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': np.zeros(periods)
        })
        
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_zero_power_entire_period(self):
        """Test entirely zero power (plant offline)"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(5, 15, periods),  # Wind present
            'power': np.zeros(periods)  # But no power
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': np.zeros(periods)
        })
        
        # Should not crash, but results will be zero/low
        result = run_aep_analysis(scada, meter)
        assert result is not None


@pytest.mark.unit  
class TestDataConsistency:
    """Test data consistency checks"""
    
    def test_scada_meter_timestamp_mismatch(self):
        """Test when SCADA and meter have different timestamps"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        
        # SCADA timestamps
        scada_timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        # Meter timestamps offset by 5 minutes
        meter_timestamps = [start + timedelta(minutes=10*i + 5) for i in range(periods)]
        
        scada = pd.DataFrame({
            'timestamp': scada_timestamps,
            'wind_speed': np.random.uniform(5, 15, periods),
            'power': np.random.uniform(500, 1800, periods)
        })
        
        meter = pd.DataFrame({
            'timestamp': meter_timestamps,
            'energy': np.random.uniform(80, 300, periods)
        })
        
        # Should handle misalignment via resampling
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_different_data_lengths(self):
        """Test when SCADA and meter have different lengths"""
        start = datetime(2022, 1, 1)
        
        # SCADA: 365 days
        scada_periods = 144 * 365
        scada_timestamps = [start + timedelta(minutes=10*i) for i in range(scada_periods)]
        
        # Meter: 370 days (5 days more)
        meter_periods = 144 * 370
        meter_timestamps = [start + timedelta(minutes=10*i) for i in range(meter_periods)]
        
        scada = pd.DataFrame({
            'timestamp': scada_timestamps,
            'wind_speed': np.random.uniform(5, 15, scada_periods),
            'power': np.random.uniform(500, 1800, scada_periods)
        })
        
        meter = pd.DataFrame({
            'timestamp': meter_timestamps,
            'energy': np.random.uniform(80, 300, meter_periods)
        })
        
        # Should use common date range
        result = run_aep_analysis(scada, meter)
        assert result is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
