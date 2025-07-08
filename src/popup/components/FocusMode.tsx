import React, { useState, useEffect } from 'react';
import { Focus, Timer, Plus, Trash2, Play, Pause, RotateCcw } from 'lucide-react';

const FocusMode: React.FC = () => {
  const [focusMode, setFocusMode] = useState(false);
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [newSite, setNewSite] = useState('');
  const [focusTimer, setFocusTimer] = useState(25 * 60); // 25 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSettings();
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);

  const loadSettings = () => {
    chrome.storage.sync.get(['focusMode', 'blockedSites', 'focusTimer'], (result) => {
      setFocusMode(result.focusMode || false);
      setBlockedSites(result.blockedSites || []);
      setFocusTimer(result.focusTimer || 25 * 60);
    });
  };

  const toggleFocusMode = () => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    chrome.storage.sync.set({ focusMode: newFocusMode });
    
    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'TOGGLE_FOCUS_MODE',
      focusMode: newFocusMode
    });
  };

  const addBlockedSite = () => {
    if (newSite.trim() && !blockedSites.includes(newSite.trim())) {
      const updatedSites = [...blockedSites, newSite.trim()];
      setBlockedSites(updatedSites);
      chrome.storage.sync.set({ blockedSites: updatedSites });
      setNewSite('');
    }
  };

  const removeBlockedSite = (site: string) => {
    const updatedSites = blockedSites.filter(s => s !== site);
    setBlockedSites(updatedSites);
    chrome.storage.sync.set({ blockedSites: updatedSites });
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    const interval = setInterval(() => {
      setFocusTimer(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          clearInterval(interval);
          // Send notification when timer completes
          chrome.runtime.sendMessage({
            type: 'FOCUS_TIMER_COMPLETE'
          });
          return 25 * 60; // Reset to 25 minutes
        }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setFocusTimer(25 * 60);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Focus Mode Toggle */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Focus className="w-5 h-5 mr-2" />
            Focus Mode
          </h3>
          <button
            onClick={toggleFocusMode}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              focusMode
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}
          >
            {focusMode ? 'Disable' : 'Enable'}
          </button>
        </div>
        
        {focusMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Focus mode is active. Blocked websites will be restricted.
            </p>
          </div>
        )}
      </div>

      {/* Pomodoro Timer */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Timer className="w-5 h-5 mr-2" />
          Pomodoro Timer
        </h3>
        
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-800 mb-4">
            {formatTime(focusTimer)}
          </div>
          
          <div className="flex justify-center space-x-3">
            {!isTimerRunning ? (
              <button
                onClick={startTimer}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}
            
            <button
              onClick={resetTimer}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blocked Sites */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Blocked Sites</h3>
        
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="Enter domain (e.g., youtube.com)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addBlockedSite()}
            />
            <button
              onClick={addBlockedSite}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {blockedSites.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No blocked sites yet. Add some to get started!
            </p>
          ) : (
            <div className="space-y-2">
              {blockedSites.map((site) => (
                <div key={site} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-sm font-medium text-red-800">{site}</span>
                  <button
                    onClick={() => removeBlockedSite(site)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusMode;