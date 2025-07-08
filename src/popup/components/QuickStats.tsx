import React from 'react';
import { Clock, Globe, Target } from 'lucide-react';

interface QuickStatsProps {
  data: any;
}

const QuickStats: React.FC<QuickStatsProps> = ({ data }) => {
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const getTotalSites = () => {
    return Object.keys(data.sites || {}).length;
  };

  const getProductiveTime = () => {
    let productiveTime = 0;
    Object.entries(data.sites || {}).forEach(([domain, siteData]: [string, any]) => {
      if (siteData.category === 'productive') {
        productiveTime += siteData.time;
      }
    });
    return productiveTime;
  };

  const stats = [
    {
      icon: Clock,
      label: 'Total Time',
      value: formatTime(data.totalTime || 0),
      color: 'blue'
    },
    {
      icon: Globe,
      label: 'Sites Visited',
      value: getTotalSites().toString(),
      color: 'green'
    },
    {
      icon: Target,
      label: 'Productive',
      value: formatTime(getProductiveTime()),
      color: 'purple'
    }
  ];

  return (
    <div className="p-4 bg-white/30 backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center border border-white/50">
            <stat.icon className={`w-5 h-5 mx-auto mb-1 text-${stat.color}-600`} />
            <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
            <p className="text-sm font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStats;