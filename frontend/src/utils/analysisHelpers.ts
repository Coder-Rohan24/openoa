interface AnalysisData {
  p50: number;
  p90: number;
  samples: number[];
}

interface Statistics {
  mean: number;
  stdDev: number;
  count: number;
}

export const calculateStatistics = (data: AnalysisData | null): Statistics => {
  if (!data || !data.samples || data.samples.length === 0) {
    return { mean: 0, stdDev: 0, count: 0 };
  }

  const samples = data.samples;
  const count = samples.length;
  const mean = samples.reduce((sum, val) => sum + val, 0) / count;
  const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev, count };
};

export const prepareHistogramData = (data: AnalysisData | null) => {
  if (!data || !data.samples || data.samples.length === 0) {
    return null;
  }

  const samples = data.samples;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const binCount = 20;
  const binWidth = (max - min) / binCount;

  // Create bins
  const bins = Array(binCount).fill(0);
  const labels = [];

  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    labels.push(`${binStart.toFixed(0)}`);
  }

  // Fill bins
  samples.forEach((sample) => {
    const binIndex = Math.min(Math.floor((sample - min) / binWidth), binCount - 1);
    bins[binIndex]++;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Frequency',
        data: bins,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };
};

export const generateExecutiveSummary = (
  data: AnalysisData | null,
  dataQualityScore?: number
) => {
  if (!data) return null;
  
  const stats = calculateStatistics(data);
  const p50 = data.p50;
  const p90 = data.p90;
  const ratio = ((p90 / p50) * 100).toFixed(1);
  const uncertainty = (((p50 - p90) / p50) * 100).toFixed(1);
  
  return {
    primary: `The wind plant is projected to produce ${p50.toLocaleString()} MWh annually at P50 confidence level.`,
    secondary: `Monte Carlo simulation with ${stats.count.toLocaleString()} iterations indicates P90 exceedance of ${p90.toLocaleString()} MWh (${ratio}% of P50). Production uncertainty is ±${uncertainty}%.`,
    tertiary: dataQualityScore 
      ? `Data quality score: ${(dataQualityScore * 100).toFixed(1)}%` 
      : 'Run data quality analysis for additional insights.'
  };
};

export const downloadJSON = (data: any, filename: string = 'wind-analysis') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};
