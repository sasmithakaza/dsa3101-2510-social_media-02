
// Check if current tab is Reddit
async function checkIfReddit() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('reddit.com')) {
      // Not on Reddit - show warning
      document.getElementById('statusMessage').innerHTML = 
        '<strong style="color: #dc3545;">⚠️ This is not a Reddit page</strong><br><br>This extension only works on <a href="https://www.reddit.com" target="_blank">Reddit.com</a>';
      document.getElementById('legendSection').style.display = 'none';
      document.getElementById('rescanBtn').style.display = 'none';
      document.getElementById('toggleDetection').disabled = true;
      return false;
    }
    return true;
  }
  
// Run check on popup load
checkIfReddit();

document.getElementById('rescanBtn').addEventListener('click', async () => {
const isReddit = await checkIfReddit();
if (!isReddit) return;

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

chrome.tabs.sendMessage(tab.id, { action: 'rescan' }, (response) => {
    if (chrome.runtime.lastError) {
    console.error('Error:', chrome.runtime.lastError);
    } else {
    // Visual feedback
    const btn = document.getElementById('rescanBtn');
    btn.textContent = '✓ Rescanned!';
    setTimeout(() => {
        btn.textContent = 'Rescan Page';
    }, 1500);
    }
});
});