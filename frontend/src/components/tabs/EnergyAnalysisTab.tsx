import { useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import type { EnergyAnalysisTabProps } from '../../types/component.types';

const EnergyAnalysisTab = ({ 
  monthlyEnergy, 
  capacityFactor, 
  loading, 
  onLoadMonthly, 
  onLoadCapacity 
}: EnergyAnalysisTabProps) => {
  useEffect(() => {
    if (!monthlyEnergy && !loading) {
      onLoadMonthly();
    }
    if (!capacityFactor && !loading) {
      onLoadCapacity();
    }
  }, [monthlyEnergy, capacityFactor, loading, onLoadMonthly, onLoadCapacity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Computing energy metrics...</p>
        </div>
      </div>
    );
  }

  // Prepare monthly energy chart data
  const monthlyChartData = monthlyEnergy ? {
    labels: monthlyEnergy.monthly_data.map((d) => d.month),
    datasets: [
      {
        label: 'Monthly Energy (MWh)',
        data: monthlyEnergy.monthly_data.map((d) => d.energy),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: 'Monthly Energy Production',
        font: { size: 14, weight: 'bold' as const }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Month' } },
      y: { title: { display: true, text: 'Energy (MWh)' }, beginAtZero: true }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Energy Production Analysis</h2>
      
      {/* Capacity Factor Card */}
      {capacityFactor && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{(capacityFactor.capacity_factor * 100).toFixed(2)}%</div>
              <div className="text-sm text-gray-600 mt-1">Capacity Factor</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{capacityFactor.actual_energy_mwh.toFixed(2)} MWh</div>
              <div className="text-sm text-gray-600 mt-1">Actual Energy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{capacityFactor.duration_days.toFixed(1)} days</div>
              <div className="text-sm text-gray-600 mt-1">Analysis Period</div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Energy Chart */}
      {monthlyChartData && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="h-80">
            <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Monthly Data Table */}
      {monthlyEnergy && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy (MWh)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Daily (MWh)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyEnergy.monthly_data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.energy.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.days}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.avg_daily.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!monthlyEnergy && !capacityFactor && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-sm text-gray-700">No energy analysis data available</p>
        </div>
      )}
    </div>
  );
};

export default EnergyAnalysisTab;
