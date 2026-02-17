import { Bar } from 'react-chartjs-2';
import type { AEPAnalysisTabProps } from '../../types/component.types';

const AEPAnalysisTab = ({ data, stats, histogramData, chartOptions }: AEPAnalysisTabProps) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Detailed AEP Analysis</h2>
    
    {/* Statistics Table */}
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-sm">
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">P50</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{data.p50.toLocaleString()} MWh</td>
            <td className="px-6 py-4 text-gray-500">Median annual energy production (50% exceedance probability)</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">P90</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{data.p90.toLocaleString()} MWh</td>
            <td className="px-6 py-4 text-gray-500">Conservative estimate (90% exceedance probability)</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Mean</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })} MWh</td>
            <td className="px-6 py-4 text-gray-500">Average of all Monte Carlo simulations</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Std Deviation</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 })} MWh</td>
            <td className="px-6 py-4 text-gray-500">Production uncertainty measure</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Simulations</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stats.count.toLocaleString()}</td>
            <td className="px-6 py-4 text-gray-500">Number of Monte Carlo iterations</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Chart */}
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribution Histogram</h3>
      <div className="h-96">
        {histogramData && <Bar data={histogramData} options={chartOptions} />}
      </div>
    </div>
  </div>
);

export default AEPAnalysisTab;
