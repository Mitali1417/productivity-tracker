import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit, Check, X } from 'lucide-react';

interface GoalsProps {
  onUpdate: () => void;
}

const Goals: React.FC<GoalsProps> = ({ onUpdate }) => {
  const [goals, setGoals] = useState<any>({});
  const [newGoal, setNewGoal] = useState({ domain: '', time: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    chrome.storage.sync.get(['goals'], (result) => {
      setGoals(result.goals || {});
    });
  };

  const saveGoals = (newGoals: any) => {
    chrome.storage.sync.set({ goals: newGoals }, () => {
      setGoals(newGoals);
      onUpdate();
    });
  };

  const addGoal = () => {
    if (newGoal.domain && newGoal.time) {
      const updatedGoals = {
        ...goals,
        [newGoal.domain]: parseInt(newGoal.time)
      };
      saveGoals(updatedGoals);
      setNewGoal({ domain: '', time: '' });
      setIsAdding(false);
    }
  };

  const deleteGoal = (domain: string) => {
    const updatedGoals = { ...goals };
    delete updatedGoals[domain];
    saveGoals(updatedGoals);
  };

  const editGoal = (domain: string, newTime: number) => {
    const updatedGoals = {
      ...goals,
      [domain]: newTime
    };
    saveGoals(updatedGoals);
    setEditingGoal(null);
  };

  const getGoalProgress = (domain: string) => {
    return new Promise((resolve) => {
      const today = new Date().toDateString();
      chrome.storage.local.get([today], (result) => {
        const todayData = result[today] || { sites: {} };
        const siteData = todayData.sites[domain];
        const timeSpent = siteData ? siteData.time : 0;
        const goalTime = goals[domain] * 60 * 1000; // Convert to milliseconds
        resolve({
          timeSpent,
          goalTime,
          percentage: Math.min((timeSpent / goalTime) * 100, 100)
        });
      });
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

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Daily Goals
          </h3>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>

        {/* Add new goal form */}
        {isAdding && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website Domain
                </label>
                <input
                  type="text"
                  value={newGoal.domain}
                  onChange={(e) => setNewGoal({ ...newGoal, domain: e.target.value })}
                  placeholder="e.g., youtube.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={newGoal.time}
                  onChange={(e) => setNewGoal({ ...newGoal, time: e.target.value })}
                  placeholder="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={addGoal}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Goals list */}
        {Object.keys(goals).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No goals set yet.</p>
            <p className="text-sm">Add your first goal to start tracking!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(goals).map(([domain, timeLimit]: [string, any]) => (
              <GoalItem
                key={domain}
                domain={domain}
                timeLimit={timeLimit}
                onEdit={editGoal}
                onDelete={deleteGoal}
                editingGoal={editingGoal}
                setEditingGoal={setEditingGoal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GoalItem: React.FC<{
  domain: string;
  timeLimit: number;
  onEdit: (domain: string, time: number) => void;
  onDelete: (domain: string) => void;
  editingGoal: string | null;
  setEditingGoal: (domain: string | null) => void;
}> = ({ domain, timeLimit, onEdit, onDelete, editingGoal, setEditingGoal }) => {
  const [progress, setProgress] = useState<any>({});
  const [editTime, setEditTime] = useState(timeLimit.toString());

  useEffect(() => {
    loadProgress();
  }, [domain]);

  const loadProgress = async () => {
    const today = new Date().toDateString();
    chrome.storage.local.get([today], (result) => {
      const todayData = result[today] || { sites: {} };
      const siteData = todayData.sites[domain];
      const timeSpent = siteData ? siteData.time : 0;
      const goalTime = timeLimit * 60 * 1000;
      
      setProgress({
        timeSpent,
        goalTime,
        percentage: Math.min((timeSpent / goalTime) * 100, 100)
      });
    });
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    return `${minutes}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleEdit = () => {
    const newTime = parseInt(editTime);
    if (newTime > 0) {
      onEdit(domain, newTime);
    }
  };

  return (
    <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="font-medium text-gray-800 text-sm">{domain}</p>
          <p className="text-xs text-gray-600">
            {formatTime(progress.timeSpent || 0)} / {timeLimit}m
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {editingGoal === domain ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleEdit}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingGoal(null)}
                className="text-gray-600 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setEditingGoal(domain)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(domain)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.percentage || 0)}`}
          style={{ width: `${progress.percentage || 0}%` }}
        ></div>
      </div>
      {progress.percentage >= 100 && (
        <p className="text-xs text-red-600 mt-1 font-medium">Goal exceeded!</p>
      )}
    </div>
  );
};

export default Goals;