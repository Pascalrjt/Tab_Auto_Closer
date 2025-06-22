document.addEventListener('DOMContentLoaded', function() {
  const enableAutoCloseCheckbox = document.getElementById('enableAutoClose');
  const timeoutValueInput = document.getElementById('timeoutValue');
  const timeoutUnitSelect = document.getElementById('timeoutUnit');
  const whitelistTextarea = document.getElementById('whitelist');
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');
  const tabListDiv = document.getElementById('tabList');

  function loadSettings() {
    browser.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response && response.settings) {
        const settings = response.settings;
        enableAutoCloseCheckbox.checked = settings.enableAutoClose;
        timeoutValueInput.value = settings.timeoutHours;
        timeoutUnitSelect.value = settings.timeoutUnit;
        whitelistTextarea.value = settings.whitelist.join('\n');
      }
    });
  }

  function loadTabActivity() {
    browser.runtime.sendMessage({ action: 'getTabActivity' }, (response) => {
      if (response && response.tabs) {
        displayTabs(response.tabs);
      }
    });
  }

  function displayTabs(tabs) {
    tabListDiv.innerHTML = '';
    const now = Date.now();
    const timeoutMs = getTimeoutInMilliseconds();

    tabs.forEach(tab => {
      const tabDiv = document.createElement('div');
      tabDiv.className = 'tab-item';
      
      const inactiveTime = now - tab.lastActivity;
      const isInactive = inactiveTime > timeoutMs;
      const timeString = formatTime(inactiveTime);
      
      if (isInactive && !tab.pinned) {
        tabDiv.classList.add('tab-inactive');
      }

      const statusText = tab.pinned ? ' (pinned)' : 
                        isInactive ? ' (will be closed)' : '';
      
      tabDiv.innerHTML = `
        <strong>${tab.title.substring(0, 40)}${tab.title.length > 40 ? '...' : ''}</strong><br>
        <small>Inactive for: ${timeString}${statusText}</small>
      `;
      
      tabListDiv.appendChild(tabDiv);
    });
  }

  function getTimeoutInMilliseconds() {
    const value = parseInt(timeoutValueInput.value) || 24;
    const unit = timeoutUnitSelect.value;
    const multiplier = unit === 'hours' ? 1000 * 60 * 60 : 1000 * 60 * 60 * 24;
    return value * multiplier;
  }

  function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } else {
      const minutes = Math.floor(milliseconds / (1000 * 60));
      return `${minutes}m`;
    }
  }

  function saveSettings() {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    const settings = {
      enableAutoClose: enableAutoCloseCheckbox.checked,
      timeoutHours: parseInt(timeoutValueInput.value) || 24,
      timeoutUnit: timeoutUnitSelect.value,
      whitelist: whitelistTextarea.value.split('\n').filter(line => line.trim() !== '')
    };

    browser.runtime.sendMessage({ 
      action: 'updateSettings', 
      settings: settings 
    }, (response) => {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings';
      
      if (response && response.success) {
        showStatus('Settings saved successfully!', 'success');
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 3000);
      } else {
        const errorMessage = response && response.error 
          ? `Failed to save settings: ${response.error}`
          : 'Failed to save settings. Please try again.';
        showStatus(errorMessage, 'error');
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 5000);
      }
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
  }

  saveButton.addEventListener('click', saveSettings);

  loadSettings();
  loadTabActivity();
  
  setInterval(loadTabActivity, 5000);
});