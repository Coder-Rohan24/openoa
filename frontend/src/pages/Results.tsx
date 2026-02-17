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
import ExecutiveSummary from '../components/ExecutiveSummary';
import KPICard from '../components/KPICard';
import DashboardTab from '../components/tabs/DashboardTab';
import DataQualityTab from '../components/tabs/DataQualityTab';
import WindResourceTab from '../components/tabs/WindResourceTab';
import EnergyAnalysisTab from '../components/tabs/EnergyAnalysisTab';
import AEPAnalysisTab from '../components/tabs/AEPAnalysisTab';
import type {
  AnalysisData,
  DataQuality,
  WindStats,
  MonthlyEnergy,
  CapacityFactor,
  TabName
} from '../types/analysis.types';
import { 
  calculateStatistics, 
  prepareHistogramData, 
  generateExecutiveSummary, 
  downloadJSON as downloadJSONHelper,
  formatNumber 
} from '../utils/analysisHelpers';

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
    { id: 'energy' as TabName, name: 'Energy Analysis', icon: '📈' },
    { id: 'aep' as TabName, name: 'AEP Analysis', icon: '🎯' },
  ];

  // Use imported helper functions
  const stats = calculateStatistics(data);
  const histogramData = prepareHistogramData(data);
  const summary = generateExecutiveSummary(data, dataQuality?.overall_quality_score);

  // Download handler
  const handleDownload = () => {
    const allResults = {
      analysis_timestamp: new Date().toISOString(),
      aep_analysis: data,
      data_quality: dataQuality,
      wind_statistics: windStats,
      monthly_energy: monthlyEnergy,
      capacity_factor: capacityFactor,
      calculated_stats: stats,
      executive_summary: summary
    };
    
    downloadJSONHelper(allResults, 'wind-analysis');
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
          <div className="flex items-center gap-3">
            {data && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download JSON
              </button>
            )}
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
      </div>

      {data ? (
        <>
          {/* Executive Summary */}
          {summary && (
            <ExecutiveSummary
              primary={summary.primary}
              secondary={summary.secondary}
              tertiary={summary.tertiary}
            />
          )}

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              label="P50 AEP"
              value={formatNumber(data.p50)}
              unit="MWh/year"
              subtext=""
              color="blue"
            />
            
            <KPICard
              label="P90 AEP"
              value={formatNumber(data.p90)}
              unit="MWh/year"
              subtext=""
              color="cyan"
            />
            
            <KPICard
              label="P90/P50"
              value={data.p90 && data.p50 ? ((data.p90 / data.p50) * 100).toFixed(1) : 'N/A'}
              unit="% Ratio"
              subtext=""
              color="teal"
            />
            
            <KPICard
              label="Std Dev"
              value={formatNumber(stats.stdDev, 0)}
              unit="MWh"
              subtext="Uncertainty"
              color="indigo"
            />
            
            <KPICard
              label="Capacity Factor"
              value={capacityFactor?.capacity_factor 
                ? capacityFactor.capacity_factor.toFixed(1) 
                : 'N/A'}
              unit="%"
              subtext={capacityFactor ? 'Actual' : 'Run Energy tab'}
              color="purple"
            />
            
            <KPICard
              label="Data Quality"
              value={dataQuality?.overall_quality_score 
                ? dataQuality.overall_quality_score.toFixed(1) 
                : 'N/A'}
              unit="%"
              subtext={dataQuality ? 'Overall' : 'Run Quality tab'}
              color="pink"
            />
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden sticky top-4 z-10">
            <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-300 relative
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    border-r border-gray-200 last:border-r-0
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white"></div>
                  )}
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

export default Results;