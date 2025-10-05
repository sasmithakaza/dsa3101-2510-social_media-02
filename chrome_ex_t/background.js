// Background service worker for Reddit Bias Detector

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('Reddit Bias Detector installed');
      
      // Set default settings
      chrome.storage.sync.set({
        enabled: true,
        sensitivity: 'medium',
        showNotifications: true
      });
      
      // Open welcome page (optional)
      // chrome.tabs.create({ url: 'welcome.html' });
    } else if (details.reason === 'update') {
      console.log('Reddit Bias Detector updated');
    }
  });
  
  // Listen for messages from content script or popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeBias') {
      // Perform more complex bias analysis if needed
      const result = performAdvancedAnalysis(request.text);
      sendResponse({ result });
      return true;
    }
    
    if (request.action === 'getSettings') {
      chrome.storage.sync.get(['enabled', 'sensitivity', 'showNotifications'], (data) => {
        sendResponse(data);
      });
      return true;
    }
    
    if (request.action === 'updateSettings') {
      chrome.storage.sync.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  
    if (request.action === 'biasDetected') {
      // Track statistics
      updateStatistics(request.data);
      sendResponse({ received: true });
      return true;
    }
  });
  
  // Advanced analysis function (can be expanded with ML or API calls)
  function performAdvancedAnalysis(text) {
    const patterns = {
      strawman: /(?:nobody is saying|who said|no one thinks)/gi,
      appeal_to_emotion: /(?:think of the|imagine if|how would you feel)/gi,
      false_dichotomy: /(?:either.*or|only two|must choose)/gi,
      ad_hominem: /(?:idiot|stupid|moron|ignorant)/gi,
      slippery_slope: /(?:next thing|leads to|where does it end)/gi
    };
  
    const detected = [];
    
    for (const [type, regex] of Object.entries(patterns)) {
      if (regex.test(text)) {
        detected.push(type);
      }
    }
  
    return {
      fallacies: detected,
      timestamp: Date.now()
    };
  }
  
  // Update statistics
  function updateStatistics(data) {
    chrome.storage.local.get(['stats'], (result) => {
      const stats = result.stats || {
        totalScanned: 0,
        biasDetected: 0,
        lastUpdate: Date.now()
      };
  
      stats.totalScanned++;
      if (data.biasScore > 0) {
        stats.biasDetected++;
      }
      stats.lastUpdate = Date.now();
  
      chrome.storage.local.set({ stats });
    });
  }
  
  // Update badge with bias count (optional)
  function updateBadge(count) {
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
  
  // Listen for tab updates to reset badge
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('reddit.com')) {
      // Reset badge when navigating to new Reddit page
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  });
  
  // Context menu for quick actions (optional)
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'analyzeBias',
      title: 'Analyze for bias',
      contexts: ['selection']
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'analyzeBias' && info.selectionText) {
      const result = performAdvancedAnalysis(info.selectionText);
      
      // Send result back to content script to display
      chrome.tabs.sendMessage(tab.id, {
        action: 'showAnalysis',
        result: result,
        text: info.selectionText
      });
    }
  });
  
  console.log('Reddit Bias Detector background service worker loaded');