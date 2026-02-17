import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineBolt, HiOutlineChartBar, HiOutlineClock, HiOutlineBeaker } from 'react-icons/hi2';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import FileUploadBox from '../components/FileUploadBox';
import AlertMessage from '../components/AlertMessage';
import { useFormValidation } from '../hooks/useFormValidation';

const Home = () => {
  const navigate = useNavigate();
  const [scadaFile, setScadaFile] = useState<File | null>(null);
  const [meterFile, setMeterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Monte Carlo Configuration
  const [numSimulations, setNumSimulations] = useState(50);
  const [ratedCapacity, setRatedCapacity] = useState(2000);
  const [confidenceLevel, setConfidenceLevel] = useState(90);
  
  const { validateForm } = useFormValidation();

  // Handle analysis submission
  const handleAnalyze = async () => {
    // Validate form
    const validationError = validateForm({
      scadaFile,
      meterFile,
      numSimulations,
      ratedCapacity,
      confidenceLevel
    });
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('scada_file', scadaFile!);
      formData.append('meter_file', meterFile!);
      formData.append('num_simulations', numSimulations.toString());

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Show success message
      setSuccess(true);
      
      // Wait a moment for user to see success, then navigate
      setTimeout(() => {
        navigate('/results', { 
          state: { 
            data: response.data,
            scadaFile: scadaFile,
            meterFile: meterFile,
            config: {
              numSimulations,
              ratedCapacity,
              confidenceLevel
            }
          } 
        });
      }, 800);
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

  const handleScadaFileChange = (file: File | null) => {
    setScadaFile(file);
    setError(null);
  };

  const handleMeterFileChange = (file: File | null) => {
    setMeterFile(file);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white page-transition">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16 animate-slideInFromTop">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4 animate-fadeIn">
            Wind Plant Performance Analysis
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto animate-fadeIn delay-100">
            Upload your SCADA and meter data to perform comprehensive Annual Energy Production analysis using OpenOA
          </p>
          <button
            onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg animate-fadeIn delay-200"
          >
            <HiOutlineBolt className="w-5 h-5" />
            Start Analysis
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 animate-fadeIn delay-100">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-8">
            <AlertMessage 
              type="success" 
              message="Analysis complete! Redirecting to results..." 
            />
          </div>
        )}

        {error && (
          <div className="mb-8">
            <AlertMessage 
              type="error" 
              message={error} 
            />
          </div>
        )}

        {/* Upload Section */}
        <div id="upload-section" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Data Files</h2>
          <p className="text-gray-600 mb-8">Upload SCADA and meter data files in CSV format</p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <FileUploadBox
              file={scadaFile}
              onFileChange={handleScadaFileChange}
              label="SCADA Data"
              disabled={loading}
            />
            
            <FileUploadBox
              file={meterFile}
              onFileChange={handleMeterFileChange}
              label="Meter Data"
              disabled={loading}
            />
          </div>
        </div>

        {/* Configuration Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Configuration</h2>
          <p className="text-gray-600 mb-8">Customize Monte Carlo simulation parameters</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Simulations
              </label>
              <input
                type="number"
                value={numSimulations}
                onChange={(e) => setNumSimulations(parseInt(e.target.value) || 50)}
                min="50"
                max="10000"
                step="50"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 50 - 10,000</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rated Capacity (kW)
              </label>
              <input
                type="number"
                value={ratedCapacity}
                onChange={(e) => setRatedCapacity(parseInt(e.target.value) || 2000)}
                min="500"
                max="10000"
                step="100"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value) || 90)}
                min="80"
                max="99"
                step="1"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Typically 90% or 95%</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-16">
          <button
            onClick={handleAnalyze}
            disabled={loading || !scadaFile || !meterFile}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center text-lg"
          >
            {loading ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin mr-3 h-6 w-6" />
                Running Monte Carlo Simulation ({numSimulations} iterations)...
              </>
            ) : (
              <>
                <HiOutlineBolt className="w-6 h-6 mr-2" />
                Run Analysis
              </>
            )}
          </button>
          {!scadaFile || !meterFile && (
            <p className="text-sm text-gray-500 text-center mt-3">
              Please upload both SCADA and meter files to continue
            </p>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 hover-lift rounded-lg hover:bg-white cursor-default">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-blue-100 flex items-center justify-center transition-transform hover:scale-110">
              <HiOutlineChartBar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Monte Carlo Analysis</h3>
            <p className="text-gray-600 text-sm">Statistical simulation to quantify uncertainty in AEP estimates</p>
          </div>

          <div className="text-center p-6 hover-lift rounded-lg hover:bg-white cursor-default">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-cyan-100 flex items-center justify-center transition-transform hover:scale-110">
              <HiOutlineBeaker className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Industry Standard</h3>
            <p className="text-gray-600 text-sm">Built on OpenOA, the open-source standard for wind analysis</p>
          </div>

          <div className="text-center p-6 hover-lift rounded-lg hover:bg-white cursor-default">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-purple-100 flex items-center justify-center transition-transform hover:scale-110">
              <HiOutlineClock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Results</h3>
            <p className="text-gray-600 text-sm">Cloud-optimized processing for quick turnaround times</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
