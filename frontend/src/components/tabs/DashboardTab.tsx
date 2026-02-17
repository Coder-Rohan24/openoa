import { Bar } from 'react-chartjs-2';
import type { DashboardTabProps } from '../../types/component.types';
import MetricCard from '../MetricCard.tsx';

const DashboardTab = ({ data, stats, histogramData, chartOptions }: DashboardTabProps) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Overview Dashboard</h2>
    
    {/* Key Metrics Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard title="P50" value={`${data.p50.toLocaleString()} MWh`} subtitle="Median AEP" color="blue" />
      <MetricCard title="P90" value={`${data.p90.toLocaleString()} MWh`} subtitle="90% Exceedance" color="cyan" />
      <MetricCard title="Mean" value={`${stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })} MWh`} subtitle="Average AEP" color="indigo" />
      <MetricCard title="Samples" value={stats.count.toLocaleString()} subtitle="Monte Carlo" color="purple" />
    </div>

    {/* Chart */}
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">AEP Distribution</h3>
      <div className="h-80">
        {histogramData && <Bar data={histogramData} options={chartOptions} />}
      </div>
    </div>
  </div>
);

export default DashboardTab;
