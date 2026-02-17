import type { AnalysisData, Statistics, DataQuality, WindStats, PowerCurve, MonthlyEnergy, CapacityFactor } from './analysis.types';

export interface DashboardTabProps {
  data: AnalysisData;
  stats: Statistics;
  histogramData: any;
  chartOptions: any;
}

export interface DataQualityTabProps {
  dataQuality: DataQuality | null;
  loading: boolean;
  onLoad: () => void;
}

export interface WindResourceTabProps {
  windStats: WindStats | null;
  loading: boolean;
  onLoad: () => void;
}

export interface PowerCurveTabProps {
  powerCurve: PowerCurve | null;
  loading: boolean;
  onLoad: () => void;
}

export interface EnergyAnalysisTabProps {
  monthlyEnergy: MonthlyEnergy | null;
  capacityFactor: CapacityFactor | null;
  loading: boolean;
  onLoadMonthly: () => void;
  onLoadCapacity: () => void;
}

export interface AEPAnalysisTabProps {
  data: AnalysisData;
  stats: Statistics;
  histogramData: any;
  chartOptions: any;
}

export interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'cyan' | 'indigo' | 'purple';
}
