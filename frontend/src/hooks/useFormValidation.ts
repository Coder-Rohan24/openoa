interface ValidationRules {
  scadaFile: File | null;
  meterFile: File | null;
  numSimulations: number;
  ratedCapacity: number;
  confidenceLevel: number;
}

export const useFormValidation = () => {
  const validateForm = (values: ValidationRules): string | null => {
    if (!values.scadaFile || !values.meterFile) {
      return 'Please upload both SCADA and Meter CSV files';
    }
    
    if (values.numSimulations < 50 || values.numSimulations > 10000) {
      return 'Number of simulations must be between 50 and 10,000';
    }
    
    if (values.ratedCapacity <= 0 || values.ratedCapacity > 100000) {
      return 'Rated capacity must be between 1 and 100,000 kW';
    }
    
    if (values.confidenceLevel < 50 || values.confidenceLevel > 99) {
      return 'Confidence level must be between 50% and 99%';
    }
    
    return null;
  };

  return { validateForm };
};
