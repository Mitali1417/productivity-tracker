// Chrome Extension Background Script - Productivity Tracker
let activeTab = null;
let startTime = null;
let isTracking = false;
let focusMode = false;
let dailyData = {};

// Initialize the extension
chrome.runtime.onInstalled.addListener(() => {
  initializeData();
  setupAlarms();
  loadSettings();
});

// Setup event listeners
setupEventListeners();
loadSettings();

function setupEventListeners() {
  // Tab activation
  chrome.tabs.onActivated.addListener((activeInfo) => {
    handleTabChange(activeInfo.tabId);
  });

  // Tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      handleTabChange(tabId);
    }
  });

  // Window focus changes
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      stopTracking();
    } else {
      chrome.tabs.query({active: true, windowId: windowId}, (tabs) => {
        if (tabs[0]) {
          handleTabChange(tabs[0].id);
        }
      });
    }
  });

  // Idle state detection
  chrome.idle.onStateChanged.addListener((state) => {
    if (state === 'idle' || state === 'locked') {
      stopTracking();
    } else if (state === 'active') {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          handleTabChange(tabs[0].id);
        }
      });
    }
  });

  // Alarms for notifications
  chrome.alarms.onAlarm.addListener((alarm) => {
    handleAlarm(alarm);
  });

  // Message handling
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
  });
}

function loadSettings() {
  chrome.storage.sync.get(['focusMode'], (result) => {
    focusMode = result.focusMode || false;
  });
}

async function handleTabChange(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      stopTracking();
      startTracking(tab);
    }
  } catch (error) {
    console.error('Error handling tab change:', error);
  }
}

function startTracking(tab) {
  activeTab = tab;
  startTime = Date.now();
  isTracking = true;
  
  // Check if in focus mode and site is blocked
  if (focusMode) {
    checkFocusMode(tab);
  }
}

function stopTracking() {
  if (isTracking && activeTab && startTime) {
    const duration = Date.now() - startTime;
    recordTime(activeTab.url, duration);
  }
  
  isTracking = false;
  activeTab = null;
  startTime = null;
}

function recordTime(url, duration) {
  if (duration < 1000) return; // Ignore very short visits
  
  const domain = extractDomain(url);
  const today = new Date().toDateString();
  
  chrome.storage.local.get([today], (result) => {
    const dayData = result[today] || {
      sites: {},
      totalTime: 0,
      goals: {}
    };
    
    if (!dayData.sites[domain]) {
      dayData.sites[domain] = {
        time: 0,
        visits: 0,
        category: 'neutral'
      };
    }
    
    dayData.sites[domain].time += duration;
    dayData.sites[domain].visits += 1;
    dayData.totalTime += duration;
    
    chrome.storage.local.set({[today]: dayData}, () => {
      // Check goals after saving data
      checkGoals(domain, dayData);
    });
  });
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function checkGoals(domain, dayData) {
  chrome.storage.sync.get(['goals'], (result) => {
    const goals = result.goals || {};
    
    // Check domain-specific limits
    if (goals[domain] && dayData.sites[domain]) {
      const timeSpent = dayData.sites[domain].time;
      const limit = goals[domain] * 60 * 1000; // Convert minutes to milliseconds
      
      if (timeSpent > limit) {
        sendNotification(
          'Goal Exceeded',
          `You've spent ${Math.round(timeSpent / (60 * 1000))} minutes on ${domain}. Your goal was ${goals[domain]} minutes.`
        );
      }
    }
  });
}

function checkFocusMode(tab) {
  chrome.storage.sync.get(['blockedSites'], (result) => {
    const blockedSites = result.blockedSites || [];
    const domain = extractDomain(tab.url);
    
    if (blockedSites.includes(domain)) {
      sendNotification(
        'Focus Mode Active',
        `Access to ${domain} is blocked during focus mode.`
      );
      
      // Redirect to focus page
      chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL('focus-blocked.html')
      });
    }
  });
}

function sendNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMzMzIi8+Cjwvc3ZnPgo=',
    title: title,
    message: message
  });
}

function setupAlarms() {
  chrome.alarms.create('dailyReset', {
    when: getMidnightTime(),
    periodInMinutes: 24 * 60
  });
}

function getMidnightTime() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

function handleAlarm(alarm) {
  if (alarm.name === 'dailyReset') {
    resetDailyData();
  }
}

function resetDailyData() {
  // Archive yesterday's data and reset for new day
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();
  
  chrome.storage.local.get([yesterdayKey], (result) => {
    if (result[yesterdayKey]) {
      // Move to history
      chrome.storage.local.set({
        [`history_${yesterdayKey}`]: result[yesterdayKey]
      });
    }
  });
}

function initializeData() {
  chrome.storage.sync.get(null, (result) => {
    if (Object.keys(result).length === 0) {
      // Set default settings
      chrome.storage.sync.set({
        goals: {},
        categories: {
          'github.com': 'productive',
          'stackoverflow.com': 'productive',
          'youtube.com': 'distracting',
          'facebook.com': 'distracting',
          'twitter.com': 'distracting',
          'instagram.com': 'distracting'
        },
        blockedSites: [],
        focusMode: false,
        notifications: true,
        theme: 'light'
      });
    }
  });
}

function handleMessage(message, sender, sendResponse) {
  switch (message.type) {
    case 'TOGGLE_FOCUS_MODE':
      focusMode = message.focusMode;
      chrome.storage.sync.set({ focusMode: message.focusMode });
      sendResponse({ success: true });
      break;
    case 'FOCUS_TIMER_COMPLETE':
      sendNotification(
        'Focus Session Complete!',
        'Great job! You completed a focus session. Take a short break.'
      );
      sendResponse({ success: true });
      break;
    case 'PAGE_HIDDEN':
      // Handle page visibility changes from content script
      if (isTracking && message.timeSpent > 1000) {
        recordTime(message.url, message.timeSpent);
      }
      sendResponse({ success: true });
      break;
    case 'USER_INACTIVE':
      // Handle user inactivity
      stopTracking();
      sendResponse({ success: true });
      break;
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      break;
  }
  
  // Return true to indicate we will send a response asynchronously
  return true;
}