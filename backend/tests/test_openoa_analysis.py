"""
Comprehensive Test Suite for OpenOA Wind Plant Analysis API

Tests cover:
- Valid data scenarios
- Invalid data handling
- Edge cases
- API endpoints
- Data validation
- OpenOA integration
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
import io
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from services.openoa_services import run_aep_analysis, prepare_plant_data


# ============================================================================
# FIXTURES - Test Data Generators
# ============================================================================

@pytest.fixture
def valid_scada_data_12months():
    """Generate 12 months of valid SCADA data"""
    start = datetime(2022, 1, 1)
    periods = 144 * 365  # 10-min intervals for 12 months
    timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
    
    # Realistic wind speeds (Weibull distribution)
    np.random.seed(42)
    wind_speeds = np.random.weibull(2.0, periods) * 9.0
    wind_speeds = np.clip(wind_speeds, 0, 25)
    
    # Realistic power curve
    powers = np.where(wind_speeds < 3, 0,
             np.where(wind_speeds < 12, (wind_speeds ** 3) * 12,
             np.where(wind_speeds <= 25, 2000, 0)))
    
    return pd.DataFrame({
        'timestamp': timestamps,
        'wind_speed': wind_speeds,
        'power': powers
    })


@pytest.fixture
def valid_meter_data_12months(valid_scada_data_12months):
    """Generate matching meter data"""
    # Energy = Power × Time (10 min = 1/6 hour)
    energies = valid_scada_data_12months['power'] * (10 / 60)
    
    return pd.DataFrame({
        'timestamp': valid_scada_data_12months['timestamp'],
        'energy': energies
    })


@pytest.fixture
def valid_scada_data_13months():
    """Generate 13 months of valid SCADA data"""
    start = datetime(2022, 1, 1)
    periods = 144 * 396  # 10-min intervals for 13 months
    timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
    
    np.random.seed(43)
    wind_speeds = np.random.weibull(2.0, periods) * 9.0
    wind_speeds = np.clip(wind_speeds, 0, 25)
    
    powers = np.where(wind_speeds < 3, 0,
             np.where(wind_speeds < 12, (wind_speeds ** 3) * 12,
             np.where(wind_speeds <= 25, 2000, 0)))
    
    return pd.DataFrame({
        'timestamp': timestamps,
        'wind_speed': wind_speeds,
        'power': powers
    })


@pytest.fixture
def valid_meter_data_13months(valid_scada_data_13months):
    """Generate matching meter data"""
    energies = valid_scada_data_13months['power'] * (10 / 60)
    
    return pd.DataFrame({
        'timestamp': valid_scada_data_13months['timestamp'],
        'energy': energies
    })


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


# ============================================================================
# UNIT TESTS - Service Layer
# ============================================================================

class TestDataValidation:
    """Test data validation and preprocessing"""
    
    def test_valid_scada_columns(self, valid_scada_data_12months, valid_meter_data_12months):
        """Test that valid data passes column validation"""
        result = run_aep_analysis(valid_scada_data_12months, valid_meter_data_12months)
        assert 'p50' in result
        assert 'p90' in result
        assert 'samples' in result
    
    def test_missing_scada_column(self, valid_meter_data_12months):
        """Test error when SCADA column is missing"""
        invalid_scada = pd.DataFrame({
            'timestamp': ['2022-01-01 00:00:00'],
            'wind_speed': [8.0]
            # Missing 'power' column
        })
        
        with pytest.raises(ValueError, match="Missing required SCADA columns"):
            run_aep_analysis(invalid_scada, valid_meter_data_12months)
    
    def test_missing_meter_column(self, valid_scada_data_12months):
        """Test error when meter column is missing"""
        invalid_meter = pd.DataFrame({
            'timestamp': ['2022-01-01 00:00:00']
            # Missing 'energy' column
        })
        
        with pytest.raises(ValueError, match="Missing required meter columns"):
            run_aep_analysis(valid_scada_data_12months, invalid_meter)
    
    def test_insufficient_data(self):
        """Test error when data duration is too short"""
        # Only 6 months of data
        start = datetime(2022, 1, 1)
        periods = 144 * 180  # 6 months
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(5, 15, periods),
            'power': np.random.uniform(500, 1800, periods)
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': np.random.uniform(80, 300, periods)
        })
        
        with pytest.raises(ValueError, match="Insufficient data"):
            run_aep_analysis(scada, meter)
    
    def test_timestamp_formats(self, valid_meter_data_12months):
        """Test different timestamp formats are handled"""
        # ISO 8601 format
        scada_iso = pd.DataFrame({
            'timestamp': pd.date_range('2022-01-01', periods=365*144, freq='10min').strftime('%Y-%m-%dT%H:%M:%S'),
            'wind_speed': np.random.uniform(5, 15, 365*144),
            'power': np.random.uniform(500, 1800, 365*144)
        })
        
        result = run_aep_analysis(scada_iso, valid_meter_data_12months)
        assert result is not None
    
    def test_negative_power(self, valid_meter_data_12months):
        """Test handling of negative power values (turbine consumption)"""
        scada = pd.DataFrame({
            'timestamp': pd.date_range('2022-01-01', periods=365*144, freq='10min'),
            'wind_speed': np.random.uniform(0, 3, 365*144),  # Low wind
            'power': np.random.uniform(-50, 0, 365*144)  # Negative power (consumption)
        })
        
        # Should not raise error, OpenOA handles this
        result = run_aep_analysis(scada, valid_meter_data_12months)
        assert result is not None
    
    def test_zero_energy_periods(self, valid_scada_data_12months):
        """Test handling of zero energy periods (plant downtime)"""
        # Create meter data with some zero periods (10% downtime)
        energy = valid_scada_data_12months['power'] * (10 / 60)  # Normal energy
        zero_indices = np.random.choice(len(energy), size=int(len(energy) * 0.1), replace=False)
        energy[zero_indices] = 0  # Set 10% to zero
        
        meter = pd.DataFrame({
            'timestamp': valid_scada_data_12months['timestamp'],
            'energy': energy
        })
        
        # Should handle partial zero periods gracefully
        result = run_aep_analysis(valid_scada_data_12months, meter)
        assert result is not None
        assert result['p50'] > 0


class TestOpenOAIntegration:
    """Test OpenOA library integration"""
    
    def test_12months_analysis(self, valid_scada_data_12months, valid_meter_data_12months):
        """Test analysis with 12 months of data"""
        result = run_aep_analysis(valid_scada_data_12months, valid_meter_data_12months)
        
        assert isinstance(result, dict)
        assert 'p50' in result
        assert 'p90' in result
        assert 'samples' in result
        
        # P50 should be higher than P90 (P90 is more conservative)
        assert result['p50'] >= result['p90']
        
        # Should have 50 samples
        assert len(result['samples']) == 50
        
        # All samples should be positive
        assert all(s > 0 for s in result['samples'])
    
    def test_13months_analysis(self, valid_scada_data_13months, valid_meter_data_13months):
        """Test analysis with 13 months of data"""
        result = run_aep_analysis(valid_scada_data_13months, valid_meter_data_13months)
        
        assert result['p50'] > 0
        assert result['p90'] > 0
        assert len(result['samples']) == 50
    
    def test_results_consistency(self, valid_scada_data_12months, valid_meter_data_12months):
        """Test that results are consistent across multiple runs"""
        result1 = run_aep_analysis(valid_scada_data_12months, valid_meter_data_12months)
        result2 = run_aep_analysis(valid_scada_data_12months, valid_meter_data_12months)
        
        # Results should be similar (Monte Carlo has some randomness)
        assert abs(result1['p50'] - result2['p50']) / result1['p50'] < 0.1  # Within 10%
        assert abs(result1['p90'] - result2['p90']) / result1['p90'] < 0.1
    
    def test_plant_data_creation(self, valid_scada_data_12months, valid_meter_data_12months):
        """Test PlantData object creation"""
        plant_data = prepare_plant_data(valid_scada_data_12months, valid_meter_data_12months)
        
        assert plant_data is not None
        assert hasattr(plant_data, 'scada')
        assert hasattr(plant_data, 'meter')


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_exactly_365_days(self):
        """Test with exactly 365 days of data"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365  # Exactly 1 year
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
    
    def test_partial_day_at_end(self):
        """Test data ending mid-day"""
        start = datetime(2022, 1, 1, 0, 0)
        # 12 months + partial day (ends at 11:50 instead of 23:50)
        periods = 144 * 365 + 72  # Extra 12 hours
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
    
    def test_leap_year_data(self):
        """Test data spanning a leap year"""
        start = datetime(2020, 1, 1)  # 2020 is a leap year
        periods = 144 * 366  # 366 days
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
    
    def test_high_wind_speeds(self):
        """Test with extreme wind speeds"""
        start = datetime(2022, 1, 1)
        periods = 144 * 365
        timestamps = [start + timedelta(minutes=10*i) for i in range(periods)]
        
        # Very high wind speeds (above cut-out)
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(25, 35, periods),  # Above cut-out
            'power': np.zeros(periods)  # Zero power above cut-out
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': np.zeros(periods)
        })
        
        result = run_aep_analysis(scada, meter)
        assert result is not None
    
    def test_timestamp_gaps(self):
        """Test data with timestamp gaps"""
        start = datetime(2022, 1, 1)
        timestamps = []
        current = start
        
        for i in range(144 * 365):
            timestamps.append(current)
            # Random gaps: sometimes 10 min, sometimes 20 min
            if i % 100 == 0:
                current += timedelta(minutes=20)  # Gap
            else:
                current += timedelta(minutes=10)  # Normal
        
        scada = pd.DataFrame({
            'timestamp': timestamps,
            'wind_speed': np.random.uniform(5, 15, len(timestamps)),
            'power': np.random.uniform(500, 1800, len(timestamps))
        })
        
        meter = pd.DataFrame({
            'timestamp': timestamps,
            'energy': scada['power'] * (10 / 60)
        })
        
        # OpenOA should handle this (resampling fills gaps)
        result = run_aep_analysis(scada, meter)
        assert result is not None


# ============================================================================
# API INTEGRATION TESTS
# ============================================================================

class TestAPI:
    """Test FastAPI endpoints"""
    
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json()["status"] == "OpenOA API running"
    
    def test_analyze_endpoint_valid_data(self, client, valid_scada_data_12months, valid_meter_data_12months):
        """Test /analyze endpoint with valid data"""
        # Convert to CSV
        scada_csv = valid_scada_data_12months.to_csv(index=False)
        meter_csv = valid_meter_data_12months.to_csv(index=False)
        
        files = {
            'scada_file': ('scada.csv', io.BytesIO(scada_csv.encode()), 'text/csv'),
            'meter_file': ('meter.csv', io.BytesIO(meter_csv.encode()), 'text/csv')
        }
        
        response = client.post("/analyze", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert 'p50' in data
        assert 'p90' in data
        assert 'samples' in data
        assert len(data['samples']) == 50
    
    def test_analyze_endpoint_invalid_file_type(self, client):
        """Test /analyze with non-CSV file"""
        files = {
            'scada_file': ('scada.txt', io.BytesIO(b'not a csv'), 'text/plain'),
            'meter_file': ('meter.csv', io.BytesIO(b'timestamp,energy\n'), 'text/csv')
        }
        
        response = client.post("/analyze", files=files)
        assert response.status_code == 400
        assert "must be a CSV file" in response.json()["detail"]
    
    def test_analyze_endpoint_malformed_csv(self, client):
        """Test /analyze with malformed CSV"""
        scada_csv = "this is not a valid csv format!"
        meter_csv = "timestamp,energy\n2022-01-01 00:00:00,100\n"
        
        files = {
            'scada_file': ('scada.csv', io.BytesIO(scada_csv.encode()), 'text/csv'),
            'meter_file': ('meter.csv', io.BytesIO(meter_csv.encode()), 'text/csv')
        }
        
        response = client.post("/analyze", files=files)
        assert response.status_code == 400
        assert "Failed to parse" in response.json()["detail"]
    
    def test_analyze_endpoint_missing_columns(self, client, valid_meter_data_12months):
        """Test /analyze with missing required columns"""
        # SCADA with missing column
        invalid_scada = pd.DataFrame({
            'timestamp': ['2022-01-01 00:00:00'],
            'wind_speed': [8.0]
            # Missing 'power'
        })
        
        scada_csv = invalid_scada.to_csv(index=False)
        meter_csv = valid_meter_data_12months.to_csv(index=False)
        
        files = {
            'scada_file': ('scada.csv', io.BytesIO(scada_csv.encode()), 'text/csv'),
            'meter_file': ('meter.csv', io.BytesIO(meter_csv.encode()), 'text/csv')
        }
        
        response = client.post("/analyze", files=files)
        assert response.status_code == 422
        assert "Missing required SCADA columns" in response.json()["detail"]
    
    def test_analyze_endpoint_insufficient_data(self, client):
        """Test /analyze with insufficient data duration"""
        # Only 1 month of data
        start = datetime(2022, 1, 1)
        periods = 144 * 30  # 1 month
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
        
        files = {
            'scada_file': ('scada.csv', io.BytesIO(scada.to_csv(index=False).encode()), 'text/csv'),
            'meter_file': ('meter.csv', io.BytesIO(meter.to_csv(index=False).encode()), 'text/csv')
        }
        
        response = client.post("/analyze", files=files)
        assert response.status_code == 422
        assert "Insufficient data" in response.json()["detail"]


# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

class TestPerformance:
    """Test performance and resource usage"""
    
    def test_analysis_completes_within_timeout(self, valid_scada_data_12months, valid_meter_data_12months):
        """Test that analysis completes in reasonable time"""
        import time
        
        start_time = time.time()
        result = run_aep_analysis(valid_scada_data_12months, valid_meter_data_12months)
        end_time = time.time()
        
        # Should complete within 2 minutes
        assert (end_time - start_time) < 120
        assert result is not None
    
    def test_large_dataset(self):
        """Test with 18 months of data (larger dataset)"""
        start = datetime(2021, 1, 1)
        periods = 144 * 548  # 18 months
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
        
        import time
        start_time = time.time()
        result = run_aep_analysis(scada, meter)
        end_time = time.time()
        
        assert result is not None
        # Larger dataset should still complete within 3 minutes
        assert (end_time - start_time) < 180


# ============================================================================
# PYTEST CONFIGURATION
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
