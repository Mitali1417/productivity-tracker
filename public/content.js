// Content script for additional tracking
(function() {
  'use strict';
  
  // Check if we're in a valid context for the extension
  if (!chrome || !chrome.runtime) {
    return;
  }
  
  let isActive = true;
  let startTime = Date.now();
  let lastActivity = Date.now();
  let inactivityTimer = null;
  
  // Function to safely send messages to background script
  function safeSendMessage(message) {
    try {
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(message, (response) => {
          // Handle potential errors in response
          if (chrome.runtime.lastError) {
            console.log('Extension context invalidated:', chrome.runtime.lastError.message);
          }
        });
      }
    } catch (error) {
      console.log('Could not send message to background script:', error);
    }
  }
  
  // Track page visibility changes
  function handleVisibilityChange() {
    if (document.hidden) {
      isActive = false;
      const timeSpent = Date.now() - startTime;
      if (timeSpent > 1000) { // Only track if more than 1 second
        safeSendMessage({
          type: 'PAGE_HIDDEN',
          timeSpent: timeSpent,
          url: window.location.href
        });
      }
    } else {
      isActive = true;
      startTime = Date.now();
      lastActivity = Date.now();
    }
  }
  
  // Track user activity
  function updateActivity() {
    lastActivity = Date.now();
  }
  
  // Check for user inactivity
  function checkInactivity() {
    const now = Date.now();
    if (now - lastActivity > 30000) { // 30 seconds of inactivity
      safeSendMessage({
        type: 'USER_INACTIVE',
        url: window.location.href
      });
    }
  }
  
  // Set up event listeners only if document is available
  if (document) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keydown', updateActivity);
    document.addEventListener('scroll', updateActivity);
    document.addEventListener('click', updateActivity);
  }
  
  // Set up inactivity checking
  inactivityTimer = setInterval(checkInactivity, 30000);
  
  // Clean up when the page is unloaded
  window.addEventListener('beforeunload', () => {
    if (inactivityTimer) {
      clearInterval(inactivityTimer);
    }
    
    if (isActive && startTime) {
      const timeSpent = Date.now() - startTime;
      if (timeSpent > 1000) {
        safeSendMessage({
          type: 'PAGE_HIDDEN',
          timeSpent: timeSpent,
          url: window.location.href
        });
      }
    }
  });
  
  // Handle extension context invalidation
  if (chrome && chrome.runtime) {
    chrome.runtime.onConnect.addListener(() => {
      // Extension context is still valid
    });
  }
})();