interface KPICardProps {
  label: string;
  value: string | number;
  unit: string;
  subtext: string;
  color: 'blue' | 'cyan' | 'teal' | 'indigo' | 'purple' | 'pink';
}

const KPICard = ({ label, value, unit, subtext, color }: KPICardProps) => {
  const colorMap = {
    blue: 'border-blue-200 text-blue-600',
    cyan: 'border-cyan-200 text-cyan-600',
    teal: 'border-teal-200 text-teal-600',
    indigo: 'border-indigo-200 text-indigo-600',
    purple: 'border-purple-200 text-purple-600',
    pink: 'border-pink-200 text-pink-600',
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:shadow-lg transition-all duration-200 transform hover:scale-105 animate-fadeIn">
      <div className={`text-xs font-semibold mb-2 uppercase tracking-wide ${colorMap[color]}`}>
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{unit}</div>
      {subtext && (
        <div className="text-xs text-gray-400 mt-2 italic">{subtext}</div>
      )}
    </div>
  );
};

export default KPICard;
