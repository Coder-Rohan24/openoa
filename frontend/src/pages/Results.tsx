import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface AnalysisData {
  p50: number;
  p90: number;
  samples: number[];
}

type TabName = 'dashboard' | 'quality' | 'wind' | 'power' | 'energy' | 'aep';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');

  useEffect(() => {
    // Get data from navigation state
    const stateData = location.state?.data;
    if (stateData) {
      setData(stateData);
    }
  }, [location]);

  // Tab configurations
  const tabs = [
    { id: 'dashboard' as TabName, name: 'Dashboard', icon: '📊' },
    { id: 'quality' as TabName, name: 'Data Quality', icon: '✓' },
    { id: 'wind' as TabName, name: 'Wind Resource', icon: '🌬️' },
    { id: 'power' as TabName, name: 'Power Curve', icon: '⚡' },
    { id: 'energy' as TabName, name: 'Energy Analysis', icon: '📈' },
    { id: 'aep' as TabName, name: 'AEP Analysis', icon: '🎯' },
  ];

  // Calculate statistics
  const calculateStats = () => {
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

  // Prepare histogram data
  const prepareHistogramData = () => {
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

    // Count samples in each bin
    samples.forEach(sample => {
      const binIndex = Math.min(Math.floor((sample - min) / binWidth), binCount - 1);
      bins[binIndex]++;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Frequency',
          data: bins,
          backgroundColor: 'rgba(28, 167, 166, 0.7)',
          borderColor: 'rgba(28, 167, 166, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            if (!data || !data.samples) return '';
            const samples = data.samples;
            const min = Math.min(...samples);
            const max = Math.max(...samples);
            const binWidth = (max - min) / 20;
            const binStart = min + index * binWidth;
            const binEnd = min + (index + 1) * binWidth;
            return `${binStart.toFixed(0)} - ${binEnd.toFixed(0)} MWh`;
          },
          label: (context: any) => {
            return `Count: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Annual Energy Production (MWh)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Frequency',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        beginAtZero: true,
      },
    },
  };

  const stats = calculateStats();
  const histogramData = prepareHistogramData();

  // Render tab content
  const renderTabContent = () => {
    if (!data) return null;

    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab data={data} stats={stats} histogramData={histogramData} chartOptions={chartOptions} />;
      case 'quality':
        return <DataQualityTab />;
      case 'wind':
        return <WindResourceTab />;
      case 'power':
        return <PowerCurveTab />;
      case 'energy':
        return <EnergyAnalysisTab />;
      case 'aep':
        return <AEPAnalysisTab data={data} stats={stats} histogramData={histogramData} chartOptions={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wind Plant Analysis</h1>
            <p className="text-sm text-gray-600 mt-1">Comprehensive performance assessment</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {data ? (
        <>
          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    border-r border-gray-200 last:border-r-0
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            {renderTabContent()}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Analysis Data</h2>
          <p className="text-sm text-gray-600 mb-6">Run an analysis from the home page to view results.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-medium rounded-lg shadow-md transition-all duration-200"
          >
            Go to Home
          </button>
        </div>
      )}
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ data, stats, histogramData, chartOptions }: any) => (
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

// Data Quality Tab Component
const DataQualityTab = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Data Quality Assessment</h2>
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <p className="text-sm text-gray-700">🚧 Coming soon: Detailed data quality metrics</p>
    </div>
  </div>
);

// Wind Resource Tab Component
const WindResourceTab = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Wind Resource Characteristics</h2>
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <p className="text-sm text-gray-700">🚧 Coming soon: Wind statistics and Weibull analysis</p>
    </div>
  </div>
);

// Power Curve Tab Component
const PowerCurveTab = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Turbine Power Curve</h2>
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <p className="text-sm text-gray-700">🚧 Coming soon: Power curve analysis</p>
    </div>
  </div>
);

// Energy Analysis Tab Component
const EnergyAnalysisTab = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Energy Production Analysis</h2>
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <p className="text-sm text-gray-700">🚧 Coming soon: Monthly energy and capacity factor</p>
    </div>
  </div>
);

// AEP Analysis Tab Component (detailed version of dashboard)
const AEPAnalysisTab = ({ data, stats, histogramData, chartOptions }: any) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900">Detailed AEP Analysis</h2>
    
    {/* Statistics Table */}
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Metric</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Value</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unit</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-sm">
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900">Mean</td>
            <td className="px-6 py-4 text-gray-700">{stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            <td className="px-6 py-4 text-gray-500">MWh</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900">Std Dev</td>
            <td className="px-6 py-4 text-gray-700">{stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            <td className="px-6 py-4 text-gray-500">MWh</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900">P50 (Median)</td>
            <td className="px-6 py-4 text-gray-700">{data.p50.toLocaleString()}</td>
            <td className="px-6 py-4 text-gray-500">MWh</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900">P90</td>
            <td className="px-6 py-4 text-gray-700">{data.p90.toLocaleString()}</td>
            <td className="px-6 py-4 text-gray-500">MWh</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium text-gray-900">Samples</td>
            <td className="px-6 py-4 text-gray-700">{stats.count.toLocaleString()}</td>
            <td className="px-6 py-4 text-gray-500">count</td>
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

// Reusable Metric Card Component
const MetricCard = ({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    cyan: 'from-cyan-500 to-cyan-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
  }[color] || 'from-gray-500 to-gray-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className={`inline-block px-2 py-1 bg-gradient-to-r ${colorClasses} text-white text-xs font-semibold rounded mb-2`}>
        {title}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-600">{subtitle}</div>
    </div>
  );
};

export default Results;