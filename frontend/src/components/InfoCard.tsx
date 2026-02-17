import { HiOutlineChartBar, HiOutlineBolt, HiOutlineClock } from 'react-icons/hi2';

interface InfoCardProps {
  icon: 'chart' | 'lightning' | 'clock';
  title: string;
  description: string;
}

const InfoCard = ({ icon, title, description }: InfoCardProps) => {
  const icons = {
    chart: HiOutlineChartBar,
    lightning: HiOutlineBolt,
    clock: HiOutlineClock,
  };

  const Icon = icons[icon];

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="text-teal mb-4 bg-teal/10 w-14 h-14 rounded-xl flex items-center justify-center">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-bold text-deep-blue mb-3 text-xl">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default InfoCard;
