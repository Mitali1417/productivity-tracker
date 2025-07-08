import React, { useState, useEffect } from 'react';
import { Timer, Target, BarChart3, Settings, Play, Pause, Focus } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Goals from './components/Goals';
import FocusMode from './components/FocusMode';
import QuickStats from './components/QuickStats';

const PopupApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [todayData, setTodayData] = useState<any>({});
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayData();
    loadSettings();
  }, []);

  const loadTodayData = async () => {
    const today = new Date().toDateString();
    chrome.storage.local.get([today], (result) => {
      setTodayData(result[today] || { sites: {}, totalTime: 0, goals: {} });
      setLoading(false);
    });
  };

  const loadSettings = async () => {
    chrome.storage.sync.get(['focusMode'], (result) => {
      setFocusMode(result.focusMode || false);
    });
  };

  const toggleFocusMode = async () => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    chrome.storage.sync.set({ focusMode: newFocusMode });
    
    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'TOGGLE_FOCUS_MODE',
      focusMode: newFocusMode
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'focus', label: 'Focus', icon: Focus },
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">ProductivityTracker</h1>
              <p className="text-xs text-gray-600">Track your digital habits</p>
            </div>
          </div>
          <button
            onClick={toggleFocusMode}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              focusMode
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}
          >
            {focusMode ? (
              <span className="flex items-center space-x-1">
                <Pause className="w-4 h-4" />
                <span>Focus ON</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1">
                <Play className="w-4 h-4" />
                <span>Focus OFF</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats data={todayData} />

      {/* Navigation */}
      <div className="flex border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard data={todayData} />}
        {activeTab === 'goals' && <Goals onUpdate={loadTodayData} />}
        {activeTab === 'focus' && <FocusMode />}
      </div>
    </div>
  );
};

export default PopupApp;