import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
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

interface DataQuality {
  scada: any;
  meter: any;
  overall_quality_score: number;
}

interface WindStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  histogram_bins: number[];
  histogram_counts: number[];
}

interface PowerCurve {
  wind_speed_bins: number[];
  avg_power_per_bin: number[];
  count_per_bin: number[];
  std_per_bin: number[];
}

interface MonthlyEnergy {
  monthly_data: Array<{
    month: string;
    energy: number;
    days: number;
    avg_daily: number;
  }>;
}

interface CapacityFactor {
  capacity_factor: number;
  actual_energy_kwh: number;
  actual_energy_mwh: number;
  theoretical_energy_kwh: number;
  theoretical_energy_mwh: number;
  duration_hours: number;
  duration_days: number;
}

type TabName = 'dashboard' | 'quality' | 'wind' | 'power' | 'energy' | 'aep';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  
  // Store uploaded files for additional analysis
  const [scadaFile, setScadaFile] = useState<File | null>(null);
  const [meterFile, setMeterFile] = useState<File | null>(null);
  
  // Analysis results
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [windStats, setWindStats] = useState<WindStats | null>(null);
  const [powerCurve, setPowerCurve] = useState<PowerCurve | null>(null);
  const [monthlyEnergy, setMonthlyEnergy] = useState<MonthlyEnergy | null>(null);
  const [capacityFactor, setCapacityFactor] = useState<CapacityFactor | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Get data from navigation state
    const stateData = location.state?.data;
    const stateScadaFile = location.state?.scadaFile;
    const stateMeterFile = location.state?.meterFile;
    
    if (stateData) {
      setData(stateData);
    }
    
    if (stateScadaFile && stateMeterFile) {
      setScadaFile(stateScadaFile);
      setMeterFile(stateMeterFile);
    }
  }, [location]);

  // API call functions
  const fetchDataQuality = async () => {
    if (!scadaFile || !meterFile || dataQuality) return;
    
    setLoading(prev => ({ ...prev, quality: true }));
    try {
      const formData = new FormData();
      formData.append('scada_file', scadaFile);
      formData.append('meter_file', meterFile);
      
      const response = await axios.post(`${API_URL}/analyze/data-quality`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDataQuality(response.data);
    } catch (error) {
      console.error('Data quality fetch error:', error);
    } finally {
      setLoading(prev => ({ ...prev, quality: false }));
    }
  };

  const fetchWindStats = async () => {
    if (!scadaFile || windStats) return;
    
    setLoading(prev => ({ ...prev, wind: true }));
    try {
      const formData = new FormData();
      formData.append('scada_file', scadaFile);
      
      const response = await axios.post(`${API_URL}/analyze/wind-statistics`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setWindStats(response.data);
    } catch (error) {
      console.error('Wind stats fetch error:', error);
    } finally {
      setLoading(prev => ({ ...prev, wind: false }));
    }
  };

  const fetchPowerCurve = async () => {
    if (!scadaFile || powerCurve) return;
    
    setLoading(prev => ({ ...prev, power: true }));
    try {
      const formData = new FormData();
      formData.append('scada_file', scadaFile);
      
      const response = await axios.post(`${API_URL}/analyze/power-curve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPowerCurve(response.data);
    } catch (error) {
      console.error('Power curve fetch error:', error);
    } finally {
      setLoading(prev => ({ ...prev, power: false }));
    }
  };

  const fetchMonthlyEnergy = async () => {
    if (!meterFile || monthlyEnergy) return;
    
    setLoading(prev => ({ ...prev, energy: true }));
    try {
      const formData = new FormData();
      formData.append('meter_file', meterFile);
      
      const response = await axios.post(`${API_URL}/analyze/monthly-energy`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMonthlyEnergy(response.data);
    } catch (error) {
      console.error('Monthly energy fetch error:', error);
    } finally {
      setLoading(prev => ({ ...prev, energy: false }));
    }
  };

  const fetchCapacityFactor = async () => {
    if (!meterFile || capacityFactor) return;
    
    setLoading(prev => ({ ...prev, energy: true }));
    try {
      const formData = new FormData();
      formData.append('meter_file', meterFile);
      formData.append('rated_capacity', '2000'); // Default 2MW turbine
      
      const response = await axios.post(`${API_URL}/analyze/capacity-factor`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCapacityFactor(response.data);
    } catch (error) {
      console.error('Capacity factor fetch error:', error);
    } finally {
      setLoading(prev => ({ ...prev, energy: false }));
    }
  };

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
        return <DataQualityTab dataQuality={dataQuality} loading={loading.quality} onLoad={fetchDataQuality} />;
      case 'wind':
        return <WindResourceTab windStats={windStats} loading={loading.wind} onLoad={fetchWindStats} />;
      case 'power':
        return <PowerCurveTab powerCurve={powerCurve} loading={loading.power} onLoad={fetchPowerCurve} />;
      case 'energy':
        return <EnergyAnalysisTab monthlyEnergy={monthlyEnergy} capacityFactor={capacityFactor} loading={loading.energy} onLoadMonthly={fetchMonthlyEnergy} onLoadCapacity={fetchCapacityFactor} />;
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
const DataQualityTab = ({ dataQuality, loading, onLoad }: any) => {
  useEffect(() => {
    if (!dataQuality && !loading) {
      onLoad();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing data quality...</p>
        </div>
      </div>
    );
  }

  if (!dataQuality) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm text-gray-700">No data quality information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Data Quality Assessment</h2>
      
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {dataQuality.overall_quality_score.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Overall Quality Score</div>
        </div>
      </div>

      {/* SCADA Data Quality */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">SCADA Data Quality</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.scada.total_rows.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Rows</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.scada.time_coverage_days}</div>
            <div className="text-xs text-gray-600">Days Coverage</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.scada.duplicate_timestamps}</div>
            <div className="text-xs text-gray-600">Duplicates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.scada.completeness_score.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Completeness</div>
          </div>
        </div>
      </div>

      {/* Meter Data Quality */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Meter Data Quality</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.meter.total_rows.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Rows</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.meter.time_coverage_days}</div>
            <div className="text-xs text-gray-600">Days Coverage</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.meter.duplicate_timestamps}</div>
            <div className="text-xs text-gray-600">Duplicates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.meter.completeness_score.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Completeness</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wind Resource Tab Component
const WindResourceTab = ({ windStats, loading, onLoad }: any) => {
  useEffect(() => {
    if (!windStats && !loading) {
      onLoad();
    }
  }, []);

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

// Power Curve Tab Component
const PowerCurveTab = ({ powerCurve, loading, onLoad }: any) => {
  useEffect(() => {
    if (!powerCurve && !loading) {
      onLoad();
    }
  }, []);

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

// Energy Analysis Tab Component
const EnergyAnalysisTab = ({ monthlyEnergy, capacityFactor, loading, onLoadMonthly, onLoadCapacity }: any) => {
  useEffect(() => {
    if (!monthlyEnergy && !loading) {
      onLoadMonthly();
    }
    if (!capacityFactor && !loading) {
      onLoadCapacity();
    }
  }, []);

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
    labels: monthlyEnergy.monthly_data.map((d: any) => d.month),
    datasets: [
      {
        label: 'Monthly Energy (MWh)',
        data: monthlyEnergy.monthly_data.map((d: any) => d.energy),
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
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {capacityFactor.capacity_factor.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Capacity Factor</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-1">
                {capacityFactor.actual_energy_mwh.toFixed(1)} MWh
              </div>
              <div className="text-sm text-gray-600">Actual Energy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {capacityFactor.theoretical_energy_mwh.toFixed(1)} MWh
              </div>
              <div className="text-sm text-gray-600">Theoretical Energy</div>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Energy (MWh)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Avg Daily (MWh)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {monthlyEnergy.monthly_data.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.month}</td>
                    <td className="px-6 py-4 text-gray-700">{row.energy.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-700">{row.days}</td>
                    <td className="px-6 py-4 text-gray-700">{row.avg_daily.toFixed(2)}</td>
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