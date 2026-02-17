import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineBolt } from 'react-icons/hi2';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import FileUploadBox from '../components/FileUploadBox';
import MonteCarloConfig from '../components/MonteCarloConfig';
import InfoCard from '../components/InfoCard';
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

        {/* Success Display */}
        {success && (
          <AlertMessage 
            type="success" 
            message="Analysis complete! Redirecting to results..." 
          />
        )}

        {/* Error Display */}
        {error && (
          <AlertMessage 
            type="error" 
            message={error} 
          />
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* SCADA Upload Box */}
          <FileUploadBox
            file={scadaFile}
            onFileChange={handleScadaFileChange}
            label="SCADA Data"
            disabled={loading}
          />
          
          {/* Meter Upload Box */}
          <FileUploadBox
            file={meterFile}
            onFileChange={handleMeterFileChange}
            label="Meter Data"
            disabled={loading}
          />
        </div>
        
        {/* Monte Carlo Configuration */}
        <MonteCarloConfig
          numSimulations={numSimulations}
          ratedCapacity={ratedCapacity}
          confidenceLevel={confidenceLevel}
          onNumSimulationsChange={setNumSimulations}
          onRatedCapacityChange={setRatedCapacity}
          onConfidenceLevelChange={setConfidenceLevel}
          disabled={loading}
        />
        
        {/* Analyze Button */}
        <div className="mt-8">
          <button
            onClick={handleAnalyze}
            disabled={loading || !scadaFile || !meterFile}
            className="w-full bg-gradient-to-r from-deep-blue to-teal hover:from-deep-blue/90 hover:to-teal/90 text-white font-bold py-4 px-8 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:bg-gradient-to-r disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-lg"
          >
            {loading ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin -ml-1 mr-3 h-6 w-6" />
                Running Monte Carlo Simulation ({numSimulations} iterations)...
              </>
            ) : (
              <>
                <HiOutlineBolt className="w-6 h-6 mr-2" />
                Run Analysis
              </>
            )}
          </button>
          {!scadaFile || !meterFile ? (
            <p className="text-sm text-gray-500 text-center mt-3">
              Please upload both SCADA and meter files to continue
            </p>
          ) : null}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        <InfoCard
          icon="chart"
          title="Monte Carlo Analysis"
          description="Statistical simulation to quantify uncertainty in AEP estimates."
        />
        
        <InfoCard
          icon="lightning"
          title="Industry Standard"
          description="Built on OpenOA, the open-source standard for wind analysis."
        />
        
        <InfoCard
          icon="clock"
          title="Fast Results"
          description="Cloud-optimized processing for quick turnaround times."
        />
      </div>
    </div>
  );
};

export default Home;
