import React, { useState, useEffect } from 'react';
import { Settings, Globe, Download, Upload, Trash2, Save } from 'lucide-react';

const OptionsApp: React.FC = () => {
  const [categories, setCategories] = useState<any>({});
  const [newCategory, setNewCategory] = useState({ domain: '', category: 'neutral' });
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    chrome.storage.sync.get(null, (result) => {
      setCategories(result.categories || {});
      setSettings(result);
      setIsLoading(false);
    });
  };

  const saveCategories = () => {
    chrome.storage.sync.set({ categories }, () => {
      alert('Categories saved successfully!');
    });
  };

  const addCategory = () => {
    if (newCategory.domain.trim()) {
      setCategories({
        ...categories,
        [newCategory.domain.trim()]: newCategory.category
      });
      setNewCategory({ domain: '', category: 'neutral' });
    }
  };

  const removeCategory = (domain: string) => {
    const updatedCategories = { ...categories };
    delete updatedCategories[domain];
    setCategories(updatedCategories);
  };

  const exportData = () => {
    const data = {
      categories,
      settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productivity-tracker-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.categories) {
            setCategories(data.categories);
          }
          if (data.settings) {
            setSettings(data.settings);
          }
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(() => {
          alert('All data cleared successfully!');
          loadData();
        });
      });
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ProductivityTracker Settings</h1>
          <p className="text-gray-600">Configure your productivity tracking preferences</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Website Categories */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Website Categories
            </h2>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCategory.domain}
                  onChange={(e) => setNewCategory({ ...newCategory, domain: e.target.value })}
                  placeholder="Enter domain (e.g., youtube.com)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newCategory.category}
                  onChange={(e) => setNewCategory({ ...newCategory, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="productive">Productive</option>
                  <option value="neutral">Neutral</option>
                  <option value="distracting">Distracting</option>
                </select>
                <button
                  onClick={addCategory}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(categories).map(([domain, category]) => (
                  <div key={domain} className="flex items-center justify-between bg-white/80 rounded-lg p-3 border border-gray-200/50">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-800">{domain}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category as string)}`}>
                        {category}
                      </span>
                    </div>
                    <button
                      onClick={() => removeCategory(domain)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={saveCategories}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Categories</span>
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Data Management
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Export Data</h3>
                <button
                  onClick={exportData}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export All Data</span>
                </button>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Import Data</h3>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Clear All Data</h3>
                <button
                  onClick={clearAllData}
                  className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsApp;