interface AlertMessageProps {
  type: 'success' | 'error';
  message: string;
}

const AlertMessage = ({ type, message }: AlertMessageProps) => {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      ),
      animate: 'animate-pulse'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      ),
      animate: ''
    }
  };

  const style = styles[type];

  return (
    <div className={`mb-6 ${style.bg} border-l-4 ${style.border} ${style.text} px-6 py-4 rounded-lg flex items-start shadow-md ${style.animate}`}>
      <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        {style.icon}
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default AlertMessage;
