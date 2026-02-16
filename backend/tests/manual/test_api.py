"""
Simple test script to verify the OpenOA API is working.
Run this after starting the API server.
"""
import requests
import pandas as pd
from io import StringIO

# API endpoint
BASE_URL = "http://localhost:8000"


def test_health_check():
    """Test the health check endpoint."""
    print("Testing health check endpoint...")
    response = requests.get(f"{BASE_URL}/")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Health check passed: {data}")
        return True
    else:
        print(f"✗ Health check failed: {response.status_code}")
        return False


def test_analyze_endpoint():
    """Test the analyze endpoint with sample data."""
    print("\nTesting analyze endpoint...")
    
    # Create sample SCADA data
    scada_data = pd.DataFrame({
        'timestamp': pd.date_range('2023-01-01', periods=100, freq='10min'),
        'wind_speed': [5.5, 6.2, 7.1, 8.0, 6.5] * 20,
        'power': [100, 150, 200, 250, 175] * 20,
    })
    
    # Create sample meter data
    meter_data = pd.DataFrame({
        'timestamp': pd.date_range('2023-01-01', periods=100, freq='10min'),
        'energy': [10.5, 12.2, 15.1, 18.0, 13.5] * 20,
    })
    
    # Save to CSV in memory
    scada_csv = StringIO()
    meter_csv = StringIO()
    scada_data.to_csv(scada_csv, index=False)
    meter_data.to_csv(meter_csv, index=False)
    scada_csv.seek(0)
    meter_csv.seek(0)
    
    # Prepare files for upload
    files = {
        'scada_file': ('scada.csv', scada_csv.getvalue(), 'text/csv'),
        'meter_file': ('meter.csv', meter_csv.getvalue(), 'text/csv'),
    }
    
    # Make request
    response = requests.post(f"{BASE_URL}/analyze", files=files)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Analysis completed successfully!")
        print(f"  P50: {data['p50']:,.2f} MWh")
        print(f"  P90: {data['p90']:,.2f} MWh")
        print(f"  Samples: {len(data['samples'])} values")
        return True
    else:
        print(f"✗ Analysis failed: {response.status_code}")
        print(f"  Error: {response.text}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("OpenOA API Test Suite")
    print("=" * 60)
    
    health_ok = test_health_check()
    analyze_ok = test_analyze_endpoint()
    
    print("\n" + "=" * 60)
    if health_ok and analyze_ok:
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to API. Is it running on http://localhost:8000?")
    except Exception as e:
        print(f"✗ Test error: {str(e)}")
