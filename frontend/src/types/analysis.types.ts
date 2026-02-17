export interface AnalysisData {
  p50: number;
  p90: number;
  samples: number[];
}

export interface DataQuality {
  scada: {
    total_rows: number;
    missing_values: number;
    duplicate_rows: number;
    completeness: number;
    availability: number;
    days_coverage: number;
  };
  meter: {
    total_rows: number;
    missing_values: number;
    duplicate_rows: number;
    completeness: number;
    availability: number;
    days_coverage: number;
  };
  overall_quality_score: number;
}

export interface WindStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  histogram_bins: number[];
  histogram_counts: number[];
}

export interface PowerCurve {
  wind_speed_bins: number[];
  avg_power_per_bin: number[];
  count_per_bin: number[];
  std_per_bin: number[];
}

export interface MonthlyEnergy {
  monthly_data: Array<{
    month: string;
    energy: number;
    days: number;
    avg_daily: number;
  }>;
}

export interface CapacityFactor {
  capacity_factor: number;
  actual_energy_kwh: number;
  actual_energy_mwh: number;
  theoretical_energy_kwh: number;
  theoretical_energy_mwh: number;
  duration_hours: number;
  duration_days: number;
}

export interface Statistics {
  mean: number;
  stdDev: number;
  count: number;
}

export type TabName = 'dashboard' | 'quality' | 'wind' | 'power' | 'energy' | 'aep';
