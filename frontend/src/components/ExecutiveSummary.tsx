import { HiOutlineDocumentText } from 'react-icons/hi2';

interface ExecutiveSummaryProps {
  primary: string;
  secondary: string;
  tertiary: string;
}

const ExecutiveSummary = ({ primary, secondary, tertiary }: ExecutiveSummaryProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-6 shadow-md">
      <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
        <HiOutlineDocumentText className="w-5 h-5 mr-2 text-blue-600" />
        Executive Summary
      </h2>
      <div className="space-y-2">
        <p className="text-gray-800 font-semibold">{primary}</p>
        <p className="text-gray-700 text-sm">{secondary}</p>
        <p className="text-gray-600 text-sm italic">{tertiary}</p>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
