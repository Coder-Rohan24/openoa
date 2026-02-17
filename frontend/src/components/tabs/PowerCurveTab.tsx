import { useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import type { PowerCurveTabProps } from '../../types/component.types';
import MetricCard from '../MetricCard.tsx';

const PowerCurveTab = ({ powerCurve, loading, onLoad }: PowerCurveTabProps) => {
  useEffect(() => {
    if (!powerCurve && !loading) {
      onLoad();
    }
  }, [powerCurve, loading, onLoad]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating power curve...</p>
        </div>
      </div>
    );
  }

  if (!powerCurve || !powerCurve.wind_speed_bins) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm text-gray-700">No power curve data available</p>
      </div>
    );
  }

  // Prepare scatter plot data
  const scatterData = {
    labels: powerCurve.wind_speed_bins,
    datasets: [
      {
        label: 'Average Power',
        data: powerCurve.wind_speed_bins.map((ws: number, idx: number) => ({
          x: ws,
          y: powerCurve.avg_power_per_bin[idx] || 0
        })),
        backgroundColor: 'rgba(14, 165, 233, 0.7)',
        borderColor: 'rgba(14, 165, 233, 1)',
        pointRadius: 5,
        showLine: true,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: 'Turbine Power Curve',
        font: { size: 14, weight: 'bold' as const }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Wind Speed (m/s)' } },
      y: { title: { display: true, text: 'Power (kW)' }, beginAtZero: true }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Turbine Power Curve</h2>
      
      {/* Power Curve Chart */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="h-96">
          <Bar data={scatterData} options={chartOptions} />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Bins" 
          value={powerCurve.wind_speed_bins.length.toString()} 
          subtitle="Data Points" 
          color="blue" 
        />
        <MetricCard 
          title="Max Power" 
          value={`${Math.max(...powerCurve.avg_power_per_bin.filter((p: number) => p !== null)).toFixed(0)} kW`} 
          subtitle="Peak Output" 
          color="cyan" 
        />
        <MetricCard 
          title="Total Samples" 
          value={powerCurve.count_per_bin.reduce((a: number, b: number) => a + b, 0).toLocaleString()} 
          subtitle="Observations" 
          color="indigo" 
        />
      </div>
    </div>
  );
};

export default PowerCurveTab;
