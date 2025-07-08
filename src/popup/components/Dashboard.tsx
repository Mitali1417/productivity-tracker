import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Monitor, Clock } from 'lucide-react';

interface DashboardProps {
  data: any;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [categories, setCategories] = useState<any>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    chrome.storage.sync.get(['categories'], (result) => {
      setCategories(result.categories || {});
    });
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const getSortedSites = () => {
    return Object.entries(data.sites || {})
      .sort(([,a], [,b]) => (b as any).time - (a as any).time)
      .slice(0, 10);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'distracting':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productive':
        return TrendingUp;
      case 'distracting':
        return TrendingDown;
      default:
        return Monitor;
    }
  };

  const getProgressPercentage = (time: number) => {
    const maxTime = Math.max(...Object.values(data.sites || {}).map((site: any) => site.time));
    return maxTime > 0 ? (time / maxTime) * 100 : 0;
  };

  const sortedSites = getSortedSites();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Today's Activity
        </h3>
        
        {sortedSites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity tracked yet today.</p>
            <p className="text-sm">Start browsing to see your data!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSites.map(([domain, siteData]: [string, any]) => {
              const category = categories[domain] || 'neutral';
              const CategoryIcon = getCategoryIcon(category);
              const percentage = getProgressPercentage(siteData.time);
              
              return (
                <div key={domain} className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(category)}`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{domain}</p>
                        <p className="text-xs text-gray-600">{siteData.visits} visits</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatTime(siteData.time)}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
                        {category}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;