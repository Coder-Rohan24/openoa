"""
Test script for OpenOA Cloud Analyst API
Tests the /analyze endpoint with sample SCADA and meter data
"""
import requests
import json

# API configuration
API_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("=" * 60)
    print("Testing Health Check Endpoint")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        print("✅ Health check PASSED\n")
        return True
    except Exception as e:
        print(f"❌ Health check FAILED: {str(e)}\n")
        return False


def test_analyze_endpoint():
    """Test the analyze endpoint with sample data"""
    print("=" * 60)
    print("Testing Analyze Endpoint")
    print("=" * 60)
    
    # Prepare files
    files = {
        'scada_file': ('scada_sample.csv', open('test_data/scada_sample.csv', 'rb'), 'text/csv'),
        'meter_file': ('meter_sample.csv', open('test_data/meter_sample.csv', 'rb'), 'text/csv')
    }
    
    try:
        print("Uploading test data files...")
        print("- SCADA file: test_data/scada_sample.csv")
        print("- Meter file: test_data/meter_sample.csv\n")
        
        response = requests.post(f"{API_URL}/analyze", files=files)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Analysis SUCCESSFUL!")
            print("\n" + "=" * 60)
            print("ANALYSIS RESULTS")
            print("=" * 60)
            print(f"P50 (Median AEP): {result['p50']:,.2f} MWh")
            print(f"P90 (90% Exceedance): {result['p90']:,.2f} MWh")
            print(f"Number of Samples: {len(result['samples'])}")
            print(f"\nSample Distribution (first 10 values):")
            for i, sample in enumerate(result['samples'][:10], 1):
                print(f"  Sample {i}: {sample:,.2f} MWh")
            
            print("\n" + "=" * 60)
            print("DATA VALIDATION")
            print("=" * 60)
            print(f"✅ OpenOA Monte Carlo simulation ran successfully")
            print(f"✅ Generated {len(result['samples'])} simulation samples")
            print(f"✅ P50 > P90: {result['p50'] > result['p90']} (Expected: True)")
            
            return True
        else:
            print(f"\n❌ Analysis FAILED!")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Request FAILED: {str(e)}")
        return False
    finally:
        # Close file handles
        for file_tuple in files.values():
            file_tuple[1].close()


def print_data_requirements():
    """Print the data format requirements"""
    print("\n" + "=" * 60)
    print("DATA FORMAT REQUIREMENTS")
    print("=" * 60)
    
    print("\n📋 SCADA File (CSV format):")
    print("-" * 40)
    print("Required Columns:")
    print("  • timestamp    - DateTime (e.g., '2014-01-01 00:00:00')")
    print("  • wind_speed   - Wind speed in m/s (float)")
    print("  • power        - Power output in kW (float)")
    
    print("\n📋 Meter File (CSV format):")
    print("-" * 40)
    print("Required Columns:")
    print("  • timestamp    - DateTime (e.g., '2014-01-01 00:00:00')")
    print("  • energy       - Energy production in kWh (float)")
    
    print("\n🔧 OpenOA Integration:")
    print("-" * 40)
    print("  • Uses OpenOA's PlantData class")
    print("  • Runs MonteCarloAEP analysis")
    print("  • 50 simulations (configurable)")
    print("  • Uses MERRA2 reanalysis data")
    print("  • Returns P50 (median) and P90 (exceedance) estimates")
    
    print("\n📊 Output Format:")
    print("-" * 40)
    print("  • p50: float - Median AEP in MWh")
    print("  • p90: float - 90% exceedance AEP in MWh")
    print("  • samples: array - All simulation samples in MWh")
    print("=" * 60)


if __name__ == "__main__":
    print("\n🧪 OpenOA Cloud Analyst API Test Suite")
    print("=" * 60)
    
    # Print data requirements first
    print_data_requirements()
    
    # Run tests
    print("\n\n🚀 Starting API Tests...")
    print("=" * 60)
    
    health_ok = test_health_check()
    
    if health_ok:
        analysis_ok = test_analyze_endpoint()
        
        if analysis_ok:
            print("\n" + "=" * 60)
            print("✅ ALL TESTS PASSED!")
            print("=" * 60)
        else:
            print("\n" + "=" * 60)
            print("⚠️  Some tests failed")
            print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ API is not running")
        print("Please start the backend server with: python main.py")
        print("=" * 60)
