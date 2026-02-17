import { useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import type { WindResourceTabProps } from '../../types/component.types';
import MetricCard from '../MetricCard.tsx';

const WindResourceTab = ({ windStats, loading, onLoad }: WindResourceTabProps) => {
  useEffect(() => {
    if (!windStats && !loading) {
      onLoad();
    }
  }, [windStats, loading, onLoad]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Computing wind statistics...</p>
        </div>
      </div>
    );
  }

  if (!windStats) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm text-gray-700">No wind statistics available</p>
      </div>
    );
  }

  // Prepare histogram data for Chart.js
  const histogramData = {
    labels: windStats.histogram_bins?.slice(0, -1).map((bin: number, idx: number) => 
      `${bin.toFixed(1)}-${windStats.histogram_bins[idx + 1]?.toFixed(1)}`
    ) || [],
    datasets: [
      {
        label: 'Frequency',
        data: windStats.histogram_counts || [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Wind Speed Distribution',
        font: { size: 14, weight: 'bold' as const }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Wind Speed (m/s)' } },
      y: { title: { display: true, text: 'Frequency' }, beginAtZero: true }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Wind Resource Characteristics</h2>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard title="Mean" value={`${windStats.mean.toFixed(2)} m/s`} subtitle="Average" color="blue" />
        <MetricCard title="Median" value={`${windStats.median.toFixed(2)} m/s`} subtitle="50th Percentile" color="cyan" />
        <MetricCard title="Std Dev" value={`${windStats.std.toFixed(2)} m/s`} subtitle="Variability" color="indigo" />
        <MetricCard title="Min" value={`${windStats.min.toFixed(2)} m/s`} subtitle="Minimum" color="purple" />
        <MetricCard title="Max" value={`${windStats.max.toFixed(2)} m/s`} subtitle="Maximum" color="blue" />
      </div>

      {/* Histogram */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="h-80">
          <Bar data={histogramData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default WindResourceTab;
