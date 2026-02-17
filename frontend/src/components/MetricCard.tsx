import type { MetricCardProps } from '../types/component.types';

const MetricCard = ({ title, value, subtitle, color }: MetricCardProps) => {
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

export default MetricCard;
