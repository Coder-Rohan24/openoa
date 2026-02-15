"""Debug script to test reanalysis data creation"""
import pandas as pd
import numpy as np

# Read test data
scada_df = pd.read_csv('test_data/scada_sample.csv')
print(f"SCADA data: {len(scada_df)} rows")
print(f"Date range: {scada_df['timestamp'].min()} to {scada_df['timestamp'].max()}")

# Convert and rename like in the service
scada_df['timestamp'] = pd.to_datetime(scada_df['timestamp'])
scada_data = scada_df.rename(columns={
    'timestamp': 'time',
    'wind_speed': 'WMET_HorWdSpd',
    'power': 'WTUR_W'
})

# Resample to hourly
scada_hourly_resampled = scada_data[['time', 'WMET_HorWdSpd']].set_index('time').resample('1h').agg({
    'WMET_HorWdSpd': 'mean'
})

print(f"\nAfter hourly resampling: {len(scada_hourly_resampled)} rows")
print(f"Index type: {type(scada_hourly_resampled.index)}")
print(f"Index: {scada_hourly_resampled.index.min()} to {scada_hourly_resampled.index.max()}")

# Fill NaN
scada_hourly_resampled['WMET_HorWdSpd'] = scada_hourly_resampled['WMET_HorWdSpd'].fillna(
    scada_hourly_resampled['WMET_HorWdSpd'].mean()
)

# Create reanalysis DataFrame
reanalysis_data = pd.DataFrame({
    'datetime': scada_hourly_resampled.index,
    'WMETR_HorWdSpd': scada_hourly_resampled['WMET_HorWdSpd'].values,
    'WMETR_HorWdDir': 180.0,
    'WMETR_AirDen': 1.225
})

print(f"\nReanalysis data before indexing: {len(reanalysis_data)} rows")
print(f"Columns: {list(reanalysis_data.columns)}")
print(reanalysis_data.head(3))

# Set DatetimeIndex
reanalysis_data = reanalysis_data.set_index(pd.DatetimeIndex(reanalysis_data['datetime']))

print(f"\nReanalysis data after set_index: {len(reanalysis_data)} rows")
print(f"Index type: {type(reanalysis_data.index)}")
print(f"Index freq: {reanalysis_data.index.freq}")

# Use asfreq
reanalysis_data = reanalysis_data.asfreq('1h')

print(f"\nReanalysis data after asfreq: {len(reanalysis_data)} rows")
print(f"Index freq: {reanalysis_data.index.freq}")
print(reanalysis_data.head(3))

# Reset datetime column
reanalysis_data['datetime'] = reanalysis_data.index

print(f"\nFinal reanalysis data: {len(reanalysis_data)} rows")
print(f"Columns: {list(reanalysis_data.columns)}")
print(f"Dtypes: {reanalysis_data.dtypes.to_dict()}")
print(reanalysis_data.head(3))
