import { useEffect } from 'react';
import type { DataQualityTabProps } from '../../types/component.types';

const DataQualityTab = ({ dataQuality, loading, onLoad }: DataQualityTabProps) => {
  useEffect(() => {
    if (!dataQuality && !loading) {
      onLoad();
    }
  }, [dataQuality, loading, onLoad]);

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
            {(dataQuality.overall_quality_score * 100).toFixed(1)}%
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
            <div className="text-2xl font-bold text-gray-900">{dataQuality.scada.days_coverage.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Days Coverage</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.scada.duplicate_rows.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Duplicates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{(dataQuality.scada.completeness * 100).toFixed(1)}%</div>
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
            <div className="text-2xl font-bold text-gray-900">{dataQuality.meter.days_coverage.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Days Coverage</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{dataQuality.meter.duplicate_rows.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Duplicates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{(dataQuality.meter.completeness * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Completeness</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataQualityTab;
