import { HiOutlineCog } from 'react-icons/hi2';

interface MonteCarloConfigProps {
  numSimulations: number;
  ratedCapacity: number;
  confidenceLevel: number;
  onNumSimulationsChange: (value: number) => void;
  onRatedCapacityChange: (value: number) => void;
  onConfidenceLevelChange: (value: number) => void;
  disabled?: boolean;
}

const MonteCarloConfig = ({
  numSimulations,
  ratedCapacity,
  confidenceLevel,
  onNumSimulationsChange,
  onRatedCapacityChange,
  onConfidenceLevelChange,
  disabled = false
}: MonteCarloConfigProps) => {
  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
      <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
        <HiOutlineCog className="w-5 h-5 mr-2 text-teal" />
        Monte Carlo Configuration
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Customize the Monte Carlo simulation parameters for your analysis
      </p>
      
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Simulations
          </label>
          <input
            type="number"
            value={numSimulations}
            onChange={(e) => onNumSimulationsChange(parseInt(e.target.value) || 1000)}
            min="100"
            max="10000"
            step="100"
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="1000"
          />
          <p className="text-xs text-gray-500 mt-1">Range: 100 - 10,000</p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rated Capacity (kW)
          </label>
          <input
            type="number"
            value={ratedCapacity}
            onChange={(e) => onRatedCapacityChange(parseFloat(e.target.value) || 2000)}
            min="1"
            max="100000"
            step="100"
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="2000"
          />
          <p className="text-xs text-gray-500 mt-1">Turbine rated capacity</p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Confidence Level (%)
          </label>
          <input
            type="number"
            value={confidenceLevel}
            onChange={(e) => onConfidenceLevelChange(parseInt(e.target.value) || 90)}
            min="50"
            max="99"
            step="1"
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="90"
          />
          <p className="text-xs text-gray-500 mt-1">Range: 50% - 99%</p>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloConfig;
