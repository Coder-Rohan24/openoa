interface ExecutiveSummaryProps {
  primary: string;
  secondary: string;
  tertiary: string;
}

const ExecutiveSummary = ({ primary, secondary, tertiary }: ExecutiveSummaryProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-6 shadow-md">
      <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
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
