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
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalysisData {
  p50: number;
  p90: number;
  samples: number[];
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);

  useEffect(() => {
    // Get data from navigation state
    const stateData = location.state?.data;
    if (stateData) {
      setData(stateData);
    }
  }, [location]);

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

  return (
    <div className="space-y-10">
      {/* Results Header with Back Button */}
      <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-deep-blue to-teal mb-3">
              Analysis Results
            </h1>
            <p className="text-gray-700 text-lg">
              View your wind plant AEP analysis results and statistics
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>

      {data ? (
        <>
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-white to-teal/5 rounded-xl shadow-xl p-10 border-l-4 border-teal transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">P50 Estimate</h2>
                <div className="text-teal bg-teal/10 p-4 rounded-xl shadow-md">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-deep-blue to-teal mb-3">
                {data.p50.toLocaleString()}
              </div>
              <p className="text-gray-600 font-medium">MWh - Median annual energy production</p>
            </div>

            <div className="bg-gradient-to-br from-white to-deep-blue/5 rounded-xl shadow-xl p-10 border-l-4 border-deep-blue transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">P90 Estimate</h2>
                <div className="text-deep-blue bg-deep-blue/10 p-4 rounded-xl shadow-md">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-deep-blue to-teal mb-3">
                {data.p90.toLocaleString()}
              </div>
              <p className="text-gray-600 font-medium">MWh - 90% exceedance probability</p>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-deep-blue mb-8">
              AEP Distribution Histogram
            </h2>
            <div className="h-96">
              {histogramData ? (
                <Bar data={histogramData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <p className="text-gray-400 font-medium">No chart data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Table */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-deep-blue mb-8">
              Statistical Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gradient-to-r hover:from-teal/5 hover:to-transparent transition-all duration-200">
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">Mean</td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">MWh</td>
                  </tr>
                  <tr className="hover:bg-gradient-to-r hover:from-teal/5 hover:to-transparent transition-all duration-200">
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">Std Dev</td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">MWh</td>
                  </tr>
                  <tr className="hover:bg-gradient-to-r hover:from-teal/5 hover:to-transparent transition-all duration-200">
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">P50 (Median)</td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {data.p50.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">MWh</td>
                  </tr>
                  <tr className="hover:bg-gradient-to-r hover:from-teal/5 hover:to-transparent transition-all duration-200">
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">P90</td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {data.p90.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">MWh</td>
                  </tr>
                  <tr className="hover:bg-gradient-to-r hover:from-teal/5 hover:to-transparent transition-all duration-200">
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">Samples</td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {stats.count.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600">count</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-xl p-16 border border-gray-100">
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No Analysis Data</h2>
            <p className="text-gray-600 mb-8 text-lg">Please run an analysis from the home page to view results.</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gradient-to-r from-deep-blue to-teal hover:from-deep-blue/90 hover:to-teal/90 text-white font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 text-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
