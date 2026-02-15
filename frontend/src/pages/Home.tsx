import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [scadaFile, setScadaFile] = useState<File | null>(null);
  const [meterFile, setMeterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scadaInputRef = useRef<HTMLInputElement>(null);
  const meterInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleScadaFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScadaFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleMeterFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMeterFile(e.target.files[0]);
      setError(null);
    }
  };

  // Handle drag and drop for SCADA
  const handleScadaDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleScadaDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setScadaFile(file);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  // Handle drag and drop for Meter
  const handleMeterDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleMeterDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setMeterFile(file);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  // Handle analysis submission
  const handleAnalyze = async () => {
    if (!scadaFile || !meterFile) {
      setError('Please upload both SCADA and Meter CSV files');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('scada_file', scadaFile);
      formData.append('meter_file', meterFile);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Navigate to results page with data
      navigate('/results', { state: { data: response.data } });
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError('Failed to analyze data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="bg-white rounded-xl shadow-xl p-10 text-center border border-gray-100">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-deep-blue to-teal mb-5">
          Wind Plant Performance Analysis
        </h1>
        <p className="text-gray-700 text-lg max-w-3xl mx-auto leading-relaxed">
          Upload your SCADA and meter data to perform comprehensive Annual Energy 
          Production (AEP) analysis using industry-standard OpenOA methodology.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl mx-auto border border-gray-100">
        <h2 className="text-3xl font-bold text-deep-blue mb-8">
          Upload Data Files
        </h2>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg flex items-start shadow-md">
            <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* SCADA Upload Box */}
          <div
            onClick={() => scadaInputRef.current?.click()}
            onDragOver={handleScadaDragOver}
            onDrop={handleScadaDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
              scadaFile 
                ? 'border-teal bg-gradient-to-br from-teal/5 to-teal/10 shadow-lg' 
                : 'border-gray-300 hover:border-teal hover:shadow-lg'
            }`}
          >
            <input
              ref={scadaInputRef}
              type="file"
              accept=".csv"
              onChange={handleScadaFileChange}
              className="hidden"
            />
            <div className="text-teal mb-3">
              <svg className="w-14 h-14 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">SCADA Data</h3>
            {scadaFile ? (
              <div className="text-sm text-teal font-semibold mt-3 px-3 py-2 bg-white rounded-lg shadow-sm">
                ✓ {scadaFile.name}
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium">Drag & drop or click to upload CSV</p>
            )}
          </div>
          
          {/* Meter Upload Box */}
          <div
            onClick={() => meterInputRef.current?.click()}
            onDragOver={handleMeterDragOver}
            onDrop={handleMeterDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
              meterFile 
                ? 'border-teal bg-gradient-to-br from-teal/5 to-teal/10 shadow-lg' 
                : 'border-gray-300 hover:border-teal hover:shadow-lg'
            }`}
          >
            <input
              ref={meterInputRef}
              type="file"
              accept=".csv"
              onChange={handleMeterFileChange}
              className="hidden"
            />
            <div className="text-teal mb-3">
              <svg className="w-14 h-14 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">Meter Data</h3>
            {meterFile ? (
              <div className="text-sm text-teal font-semibold mt-3 px-3 py-2 bg-white rounded-lg shadow-sm">
                ✓ {meterFile.name}
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium">Drag & drop or click to upload CSV</p>
            )}
          </div>
        </div>
        
        {/* Analyze Button */}
        <div className="mt-8">
          <button
            onClick={handleAnalyze}
            disabled={loading || !scadaFile || !meterFile}
            className="w-full bg-gradient-to-r from-deep-blue to-teal hover:from-deep-blue/90 hover:to-teal/90 text-white font-bold py-4 px-8 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:bg-gradient-to-r disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Data...
              </>
            ) : (
              'Run Analysis'
            )}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <div className="text-teal mb-4 bg-teal/10 w-14 h-14 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-bold text-deep-blue mb-3 text-xl">Monte Carlo Analysis</h3>
          <p className="text-gray-600 leading-relaxed">
            Statistical simulation to quantify uncertainty in AEP estimates.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <div className="text-teal mb-4 bg-teal/10 w-14 h-14 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-deep-blue mb-3 text-xl">Industry Standard</h3>
          <p className="text-gray-600 leading-relaxed">
            Built on OpenOA, the open-source standard for wind analysis.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <div className="text-teal mb-4 bg-teal/10 w-14 h-14 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-deep-blue mb-3 text-xl">Fast Results</h3>
          <p className="text-gray-600 leading-relaxed">
            Cloud-optimized processing for quick turnaround times.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
