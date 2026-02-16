"""Simple test without API - directly call the service function"""
import pandas as pd
from services.openoa_services import run_aep_analysis

# Read test data
scada_df = pd.read_csv('test_data/scada_sample.csv')
meter_df = pd.read_csv('test_data/meter_sample.csv')

print(f"SCADA: {len(scada_df)} rows")
print(f"Meter: {len(meter_df)} rows")
print("\nRunning AEP analysis...")

try:
    result = run_aep_analysis(scada_df, meter_df)
    print("\nSUCCESS!")
    print(f"P50: {result['p50']} MWh")
    print(f"P90: {result['p90']} MWh")
    print(f"Samples: {len(result['samples'])}")
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
