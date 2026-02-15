import { useMemo } from 'react';
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

interface HistogramChartProps {
  samples: number[];
}

const HistogramChart = ({ samples }: HistogramChartProps) => {
  // Prepare histogram data from samples
  const histogramData = useMemo(() => {
    if (!samples || samples.length === 0) {
      return null;
    }

    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const binCount = 20;
    const binWidth = (max - min) / binCount;

    // Create bins
    const bins = Array(binCount).fill(0);
    const labels: string[] = [];

    // Generate labels (convert MWh to GWh)
    for (let i = 0; i < binCount; i++) {
      const binStart = (min + i * binWidth) / 1000; // Convert to GWh
      labels.push(binStart.toFixed(2));
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
          borderRadius: 4,
        },
      ],
    };
  }, [samples]);

  // Chart configuration options
  const chartOptions = useMemo(() => ({
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
        backgroundColor: 'rgba(11, 60, 93, 0.95)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: 'rgba(28, 167, 166, 1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            if (!samples || samples.length === 0) return '';
            const min = Math.min(...samples);
            const max = Math.max(...samples);
            const binWidth = (max - min) / 20;
            const binStart = (min + index * binWidth) / 1000; // Convert to GWh
            const binEnd = (min + (index + 1) * binWidth) / 1000; // Convert to GWh
            return `Range: ${binStart.toFixed(2)} - ${binEnd.toFixed(2)} GWh`;
          },
          label: (context: any) => {
            return `Frequency: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Annual Energy Production (GWh)',
          color: '#4B5563',
          font: {
            size: 13,
            weight: 'bold' as const,
            family: 'system-ui, -apple-system, sans-serif',
          },
        },
        ticks: {
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Frequency',
          color: '#4B5563',
          font: {
            size: 13,
            weight: 'bold' as const,
            family: 'system-ui, -apple-system, sans-serif',
          },
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          precision: 0,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        beginAtZero: true,
      },
    },
  }), [samples]);

  // Handle empty data
  if (!histogramData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm mt-2">Upload files to generate histogram</p>
        </div>
      </div>
    );
  }

  return <Bar data={histogramData} options={chartOptions} />;
};

export default HistogramChart;
