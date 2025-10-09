// Content script for Reddit bias detection

// Check if we're on Reddit
if (!window.location.hostname.includes('reddit.com')) {
    console.log('Not a Reddit page - extension inactive');
    // Stop execution
    throw new Error('This extension only works on Reddit pages');
  }
  
  // Global state
  let isEnabled = true;
  
  // Create toggle button
  function createToggleButton() {
    if (document.getElementById('bias-detector-toggle')) return;                            // Check if button already exists
  
    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'bias-detector-toggle';
    toggleContainer.innerHTML = `
      <div class="toggle-wrapper">
        <span class="toggle-label">
            <span style="color: #4CAF50;">Vibes</span> / <span style="color: #dc3545;">Skeptical</span> Mode
        </span>    
        <label class="toggle-switch">
          <input type="checkbox" id="biasToggleCheckbox" checked>
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  
    // Add to page
    document.body.appendChild(toggleContainer);
  
    // Add event listener
    const checkbox = document.getElementById('biasToggleCheckbox');
    checkbox.addEventListener('change', (e) => {
      isEnabled = e.target.checked;
      chrome.storage.sync.set({ biasDetectionEnabled: isEnabled });
      
      if (isEnabled) {
        scanPosts();
      } else {
        removeAllIndicators();
      }
    });
  }

  function createDashboardButton() {
    if (document.getElementById('dashboard-btn')) return;

    const btnCon = document.createElement('div');
    btnCon.id = 'dashboard-btn';
    btnCon.style.position = "fixed";
    btnCon.style.bottom = '20px';
    btnCon.style.right = '20px';
    btnCon.style.zIndex = '9999';

    btnCon.innerHTML = '<button style="padding: 10px 16px 10px 16 px; background-color: #ff4500; color: white; border-radius:6px; cursor:pointer;"> EchoBreak </button>'

    document.body.appendChild(btnCon)

    const button = btnCon.querySelector('button')
    button.addEventListener('click',() => {
      window.open('http://192.168.28.19:8501', "_blank");
    })
  }
  
  // Get initial state from storage
  chrome.storage.sync.get(['biasDetectionEnabled'], (result) => {
    isEnabled = result.biasDetectionEnabled !== false; // Default to true
    
    // Wait for body to exist, then create toggle button
  const waitForBody = setInterval(() => {
    if (document.body) {
      clearInterval(waitForBody);
      
      createToggleButton();
      createDashboardButton();
      
      // Update checkbox state
      const checkbox = document.getElementById('biasToggleCheckbox');
      if (checkbox) {
        checkbox.checked = isEnabled;
      }
      
      if (isEnabled) {
        scanPosts();
      }
    }
  }, 100);
});
 
  //NEED BACKEND
  // Bias indicators - you can expand this
  const biasKeywords = {
    emotional: ['always', 'never', 'everyone', 'nobody', 'obviously', 'clearly'],
    loaded: ['radical', 'extreme', 'insane', 'crazy', 'absurd'],
    absolute: ['all', 'every', 'none', 'completely', 'totally']
  };
  
  //NEED BACKEND: replace this
  function analyzeBias(text) {
    const lowerText = text.toLowerCase();
    let biasScore = 0;
    let detectedTypes = [];
  
    for (const [type, keywords] of Object.entries(biasKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          biasScore++;
          if (!detectedTypes.includes(type)) {
            detectedTypes.push(type);
          }
        }
      }
    }
  
    return { score: biasScore, types: detectedTypes };
  }
  
  function addBiasIndicator(element, biasData) {
    // Check if indicator already exists
    if (element.querySelector('.bias-indicator')) return;
  
    const indicator = document.createElement('div');
    indicator.className = 'bias-indicator';
    
    let level = 'low';
    if (biasData.score > 5) level = 'high';
    else if (biasData.score > 2) level = 'medium';
  
    indicator.classList.add(`bias-${level}`);
    indicator.innerHTML = `
      <span class="bias-badge">⚠️ Bias Level: ${level.toUpperCase()}</span>
      <span class="bias-details">${biasData.types.join(', ')}</span>
    `;
  
    element.style.position = 'relative';
    element.insertBefore(indicator, element.firstChild);
  }
  
  function scanPosts() {
    if (!isEnabled) return; // Don't scan if disabled
    
    // Reddit post selectors (works for both old and new Reddit)
    const posts = document.querySelectorAll('[data-testid="post-content"], .entry .usertext-body, shreddit-post');
    
    posts.forEach(post => {
      const textContent = post.textContent || post.innerText;
      if (textContent && textContent.length > 50) {
        const biasData = analyzeBias(textContent);
        if (biasData.score > 0) {
          addBiasIndicator(post, biasData);
        }
      }
    });
  }
  
  // Function to remove all bias indicators
  function removeAllIndicators() {
    const indicators = document.querySelectorAll('.bias-indicator');
    indicators.forEach(indicator => indicator.remove());
  }
  
  // Initial scan
  setTimeout(scanPosts, 1000);
  
  // Observe for dynamically loaded content
  const observer = new MutationObserver(() => {
    if (isEnabled) {
      scanPosts();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Listen for toggle messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleBiasDetection') {
      isEnabled = request.enabled;
      
      if (isEnabled) {
        scanPosts();
      } else {
        removeAllIndicators();
      }
      
      sendResponse({ status: 'success' });
    }
    
    if (request.action === 'rescan') {
      if (isEnabled) {
        scanPosts();
      }
      sendResponse({ status: 'complete' });
    }
  });
  
  console.log('Reddit Bias Detector loaded');
























  // === RELATED POSTS FEATURE ===

// Function to inject "Find Related Posts" button and hover panel
function addRelatedPostsButton() {
  const nav = document.querySelector("header"); // Reddit’s top nav bar
  if (!nav || document.getElementById("find-related-btn")) return;

  // Create button
  const btn = document.createElement("button");
  btn.id = "find-related-btn";
  btn.textContent = "Find Related Posts";
  btn.className = "related-btn";

  // Create dropdown panel container
  const panel = document.createElement("div");
  panel.id = "related-posts-panel";
  panel.className = "related-panel";
  panel.innerHTML = `<p class="loading">Loading related posts...</p>`;

  // Append both elements
  nav.appendChild(btn);
  document.body.appendChild(panel);

  // --- Placeholder: fetch top 5 related posts ---
  async function fetchRelatedPosts() {
    // Later replace this with your backend call, e.g.:
    // const res = await fetch(`https://your-backend.com/related?post_id=${postId}`);
    // const posts = await res.json();
    return [
      { title: "Neutral take: Policy implications overview", url: "https://www.reddit.com/r/example1", bias: "neutral" },
      { title: "Opposite view: Debate on policy", url: "https://www.reddit.com/r/example2", bias: "opposite" },
      { title: "Neutral: Historical background context", url: "https://www.reddit.com/r/example3", bias: "neutral" },
      { title: "Opposite stance: Alternative interpretation", url: "https://www.reddit.com/r/example4", bias: "opposite" },
      { title: "Neutral perspective: Fact-check summary", url: "https://www.reddit.com/r/example5", bias: "neutral" },
    ];
  }

  // --- Populate panel content ---
  async function populatePanel() {
    const posts = await fetchRelatedPosts();
    panel.innerHTML = `
      <h4>Related Posts</h4>
      ${posts
        .map(
          (p) => `
        <a href="${p.url}" target="_blank" class="related-item ${p.bias}">
          <span class="related-title">${p.title}</span>
          <span class="related-bias">${p.bias.toUpperCase()}</span>
        </a>`
        )
        .join("")}
    `;
  }

  // --- Hover behavior with animation ---
  btn.addEventListener("mouseenter", async () => {
    await populatePanel();
    const rect = btn.getBoundingClientRect();
    panel.style.top = `${rect.bottom + 8}px`;
    panel.style.left = `${rect.left}px`;
    panel.classList.add("show");
  });

  // Hide when leaving button (with delay to allow moving to panel)
  btn.addEventListener("mouseleave", () => {
    setTimeout(() => {
      if (!panel.matches(":hover")) {
        panel.classList.remove("show");
      }
    }, 150);
  });

  // Hide when leaving the panel itself
  panel.addEventListener("mouseleave", () => {
    panel.classList.remove("show");
  });
}

// Wait for Reddit header to load, then inject
setTimeout(addRelatedPostsButton, 3000);
