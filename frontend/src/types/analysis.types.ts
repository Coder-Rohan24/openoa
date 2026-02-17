export interface AnalysisData {
  p50: number;
  p90: number;
  samples: number[];
}

export interface DataQuality {
  scada: {
    total_rows: number;
    total_columns: number;
    missing_values: Record<string, number>;
    duplicate_timestamps: number;
    time_coverage_days: number;
    start_date: string;
    end_date: string;
    inferred_frequency: string;
    completeness_score: number;
  };
  meter: {
    total_rows: number;
    total_columns: number;
    missing_values: Record<string, number>;
    duplicate_timestamps: number;
    time_coverage_days: number;
    start_date: string;
    end_date: string;
    inferred_frequency: string;
    completeness_score: number;
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

export type TabName = 'dashboard' | 'quality' | 'wind' | 'energy' | 'aep';
