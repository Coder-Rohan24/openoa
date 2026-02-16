"""
Duration-Specific Tests

Tests specifically for the 378-day vs 396-day issue and other duration boundaries.
This test file focuses on understanding why certain data durations fail.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.openoa_services import run_aep_analysis


@pytest.mark.integration
class TestDurationBoundaries:
    """Test various data duration boundaries"""
    
    def _generate_data(self, days: int):
        """Helper to generate test data for a specific number of days"""
        start = datetime(2022, 1, 1)
        periods = 144 * days
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        np.random.seed(42)
        wind_speeds = np.random.uniform(4, 16, periods)
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
        
        return scada, meter
    
    def test_365_days_exactly(self):
        """Test with exactly 365 days (1 year)"""
        scada, meter = self._generate_data(365)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"365 days - P50: {result['p50']:.2f} MWh")
    
    def test_366_days_leap_year(self):
        """Test with 366 days (leap year)"""
        scada, meter = self._generate_data(366)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"366 days - P50: {result['p50']:.2f} MWh")
    
    def test_370_days(self):
        """Test with 370 days"""
        scada, meter = self._generate_data(370)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"370 days - P50: {result['p50']:.2f} MWh")
    
    def test_378_days_backend_data(self):
        """Test with 378 days (matches working backend test data)"""
        scada, meter = self._generate_data(378)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"378 days - P50: {result['p50']:.2f} MWh")
    
    def test_385_days_buffer_boundary(self):
        """Test with 385 days (buffer calculation boundary)"""
        scada, meter = self._generate_data(385)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"385 days - P50: {result['p50']:.2f} MWh")
    
    def test_390_days(self):
        """Test with 390 days"""
        scada, meter = self._generate_data(390)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"390 days - P50: {result['p50']:.2f} MWh")
    
    def test_396_days_frontend_data(self):
        """Test with 396 days (matches failing frontend test data)"""
        scada, meter = self._generate_data(396)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"396 days - P50: {result['p50']:.2f} MWh")
    
    def test_400_days(self):
        """Test with 400 days"""
        scada, meter = self._generate_data(400)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"400 days - P50: {result['p50']:.2f} MWh")
    
    def test_450_days(self):
        """Test with 450 days (15 months)"""
        scada, meter = self._generate_data(450)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"450 days - P50: {result['p50']:.2f} MWh")
    
    def test_547_days_18_months(self):
        """Test with 547 days (18 months)"""
        scada, meter = self._generate_data(547)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"547 days - P50: {result['p50']:.2f} MWh")
    
    def test_730_days_24_months(self):
        """Test with 730 days (24 months)"""
        scada, meter = self._generate_data(730)
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"730 days - P50: {result['p50']:.2f} MWh")


@pytest.mark.integration
class TestActualDataFiles:
    """Test with actual sample data files from backend and frontend"""
    
    def test_backend_sample_data(self):
        """Test with actual backend/test_data files (378 days)"""
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        scada_path = os.path.join(backend_dir, 'test_data', 'scada_sample.csv')
        meter_path = os.path.join(backend_dir, 'test_data', 'meter_sample.csv')
        
        if not os.path.exists(scada_path) or not os.path.exists(meter_path):
            pytest.skip("Backend test data files not found")
        
        scada = pd.read_csv(scada_path)
        meter = pd.read_csv(meter_path)
        
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"Backend data - P50: {result['p50']:.2f} MWh, P90: {result['p90']:.2f} MWh")
    
    def test_frontend_sample_data(self):
        """Test with actual frontend/public/test_data files (396 days)"""
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        frontend_dir = os.path.join(os.path.dirname(backend_dir), 'frontend')
        scada_path = os.path.join(frontend_dir, 'public', 'test_data', 'scada_sample.csv')
        meter_path = os.path.join(frontend_dir, 'public', 'test_data', 'meter_sample.csv')
        
        if not os.path.exists(scada_path) or not os.path.exists(meter_path):
            pytest.skip("Frontend test data files not found")
        
        scada = pd.read_csv(scada_path)
        meter = pd.read_csv(meter_path)
        
        result = run_aep_analysis(scada, meter)
        assert result is not None
        assert result['p50'] > 0
        print(f"Frontend data - P50: {result['p50']:.2f} MWh, P90: {result['p90']:.2f} MWh")


@pytest.mark.integration
class TestIncrementalDurations:
    """Test incremental durations around problem areas"""
    
    def _generate_data(self, days: int):
        """Helper to generate test data"""
        start = datetime(2022, 1, 1)
        periods = 144 * days
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        np.random.seed(42)
        wind_speeds = np.random.uniform(4, 16, periods)
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
        
        return scada, meter
    
    @pytest.mark.parametrize("days", [
        376, 377, 378, 379, 380, 381, 382, 383, 384, 385,
        386, 387, 388, 389, 390, 391, 392, 393, 394, 395,
        396, 397, 398, 399, 400
    ])
    def test_incremental_durations(self, days):
        """Test every day from 376 to 400 to find exact failure point"""
        scada, meter = self._generate_data(days)
        result = run_aep_analysis(scada, meter)
        assert result is not None, f"Analysis failed for {days} days"
        assert result['p50'] > 0, f"P50 is zero for {days} days"
        print(f"{days} days - P50: {result['p50']:.3f} MWh")


@pytest.mark.integration
class TestMonthBoundaries:
    """Test at exact month boundaries"""
    
    def _generate_data(self, months: int):
        """Generate data for exact number of months"""
        start = datetime(2022, 1, 1)
        end = start + pd.DateOffset(months=months)
        timestamps = pd.date_range(start, end, freq='10min')[:-1]
        
        np.random.seed(42)
        wind_speeds = np.random.uniform(4, 16, len(timestamps))
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
        
        return scada, meter, len(timestamps) / 144
    
    @pytest.mark.parametrize("months", [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24])
    def test_exact_month_boundaries(self, months):
        """Test at exact month boundaries from 12 to 24 months"""
        scada, meter, days = self._generate_data(months)
        result = run_aep_analysis(scada, meter)
        assert result is not None, f"Analysis failed for {months} months"
        assert result['p50'] > 0, f"P50 is zero for {months} months"
        print(f"{months} months ({days:.1f} days) - P50: {result['p50']:.3f} MWh")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])  # -s to show print statements
