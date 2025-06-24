console.log('Background script loading...');

let tabActivity = {};
let settings = {
  timeoutHours: 24,
  timeoutUnit: 'hours',
  enableAutoClose: true,
  whitelist: []
};

// Use chrome API for better compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

browserAPI.storage.local.get(['settings']).then((result) => {
  console.log('Settings loaded:', result);
  if (result.settings) {
    settings = { ...settings, ...result.settings };
  }
}).catch(error => {
  console.error('Failed to load settings:', error);
});

function getTimeoutInMilliseconds() {
  let multiplier;
  switch (settings.timeoutUnit) {
    case 'minutes':
      multiplier = 1000 * 60;
      break;
    case 'hours':
      multiplier = 1000 * 60 * 60;
      break;
    case 'days':
      multiplier = 1000 * 60 * 60 * 24;
      break;
    default:
      multiplier = 1000 * 60 * 60; // default to hours
  }
  return settings.timeoutHours * multiplier;
}

function updateTabActivity(tabId) {
  tabActivity[tabId] = Date.now();
}

function isTabWhitelisted(url) {
  return settings.whitelist.some(pattern => {
    try {
      return new RegExp(pattern).test(url);
    } catch (e) {
      return url.includes(pattern);
    }
  });
}

function checkAndCloseInactiveTabs() {
  if (!settings.enableAutoClose) return;

  const timeoutMs = getTimeoutInMilliseconds();
  const now = Date.now();

  console.log(`Checking tabs - timeout: ${timeoutMs}ms (${timeoutMs/1000/60} minutes)`);

  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      if (tab.pinned || isTabWhitelisted(tab.url)) return;

      const lastActivity = tabActivity[tab.id] || tab.lastAccessed;
      if (!lastActivity) return; // Skip if no activity data

      const inactiveTime = now - lastActivity;
      
      console.log(`Tab "${tab.title}": inactive for ${inactiveTime}ms (${Math.floor(inactiveTime/1000/60)} minutes)`);

      if (inactiveTime > timeoutMs) {
        console.log(`Closing tab: ${tab.title}`);
        browser.tabs.remove(tab.id).catch(() => {});
        delete tabActivity[tab.id];
      }
    });
  });
}

browser.tabs.onActivated.addListener((activeInfo) => {
  updateTabActivity(activeInfo.tabId);
});

// Remove this listener - tab updates don't indicate user activity

browser.tabs.onRemoved.addListener((tabId) => {
  delete tabActivity[tabId];
});

// Remove this listener - navigation completion doesn't indicate user activity

browser.alarms.create('checkInactiveTabs', { 
  delayInMinutes: 5,
  periodInMinutes: 5 
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkInactiveTabs') {
    checkAndCloseInactiveTabs();
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    sendResponse({ settings });
  } else if (request.action === 'updateSettings') {
    try {
      if (!request.settings) {
        sendResponse({ success: false, error: 'No settings provided' });
        return;
      }
      
      if (request.settings.timeoutHours) {
        const unit = request.settings.timeoutUnit || settings.timeoutUnit;
        let min = 1, max = 720;
        let unitLabel = 'hours';
        
        if (unit === 'minutes') {
          max = 1440; // 24 hours in minutes
          unitLabel = 'minutes';
        } else if (unit === 'days') {
          max = 30; // 30 days
          unitLabel = 'days';
        }
        
        if (request.settings.timeoutHours < min || request.settings.timeoutHours > max) {
          sendResponse({ success: false, error: `Timeout must be between ${min} and ${max} ${unitLabel}` });
          return;
        }
      }
      
      settings = { ...settings, ...request.settings };
      console.log('Settings updated:', settings);
      browser.storage.local.set({ settings }).then(() => {
        console.log('Settings saved to storage successfully');
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Failed to save settings to storage:', error);
        sendResponse({ success: false, error: `Storage error: ${error.message}` });
      });
      return true;
    } catch (error) {
      sendResponse({ success: false, error: `Settings update failed: ${error.message}` });
    }
  } else if (request.action === 'getTabActivity') {
    browser.tabs.query({}).then((tabs) => {
      const tabsWithActivity = tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        lastActivity: tabActivity[tab.id] || tab.lastAccessed,
        pinned: tab.pinned
      }));
      sendResponse({ tabs: tabsWithActivity });
    });
    return true;
  }
});

// Initialize existing tabs with their browser lastAccessed time or a past timestamp
browser.tabs.query({}).then((tabs) => {
  tabs.forEach((tab) => {
    if (!tabActivity[tab.id]) {
      // Use browser's lastAccessed if available, otherwise set to 1 hour ago
      tabActivity[tab.id] = tab.lastAccessed || (Date.now() - (1000 * 60 * 60));
    }
  });
});