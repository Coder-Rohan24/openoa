import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

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
      icon: HiOutlineCheckCircle,
      animate: 'animate-pulse'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: HiOutlineXCircle,
      animate: ''
    }
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`mb-6 ${style.bg} border-l-4 ${style.border} ${style.text} px-6 py-4 rounded-lg flex items-start shadow-md ${style.animate}`}>
      <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default AlertMessage;
