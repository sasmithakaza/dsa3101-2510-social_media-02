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


  function findAvailPort(start, total=10) {
    let current = start;

    function checkPort() {
      if (current >= start + total) {
        return Promise.resolve(null);
      }

      return fetch(`http://127.0.0.1:${current}`, {
        method: 'GET',
        mode: 'no-cors'
      })
      .then(() => {
        return current
      })
      .catch(() => {
        current++;
        return checkPort();
      });
    }
    return checkPort();
  }



  function createDashboardButton() {
    if (document.getElementById('dashboard-btn')) return;


    findAvailPort(8501).then(availPort => {
        if (!availPort) {
          console.error('No free ports between port 8501-8510 for dashboard');
          return;
          }

        const btnCon = document.createElement('div');
        btnCon.id = 'dashboard-btn';
        btnCon.style.position = "fixed";
        btnCon.style.bottom = '20px';
        btnCon.style.right = '20px';
        btnCon.style.zIndex = '9999';

        btnCon.innerHTML = '<button style="padding: 10px 16px 10px 16 px; background-color: #ff4500; color: white; border-radius:6px; cursor:pointer;"> View Dashboard </button>'
        
        document.body.appendChild(btnCon)
        const button = btnCon.querySelector('button')
        button.addEventListener('click',() => {
          window.open(`http://127.0.0.1:${availPort}`, "_blank");
        });
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
    // neutral: ['reportedly', 'allegedly','suggests', 'according', 'research', 'evidence', 'data', 'study', 'research', 'seems', 'claims'],
    // rightWing: ['freedom', 'patriot', 'traditional', 'tax cuts', 'free market', 'border', 'immigrants', 'woke', 'liberal'],
    // leftWing: ['progressive', 'inclusive', 'equality', 'diversity', 'equal', 'climate', 'rights', 'public', 'renewable']
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

// ============================================================
// MODAL POPUP CODE (Added Section)
// ============================================================

// Listen for Reddit post clicks
document.addEventListener('click', (event) => {
  const post = event.target.closest('[data-testid="post-container"], shreddit-post, [data-testid="post-content"]');
  if (post) {
    console.log('Reddit post clicked:', post);
    createOverlayPopup();
  }
});

// Function to create and display modal overlay
function createOverlayPopup() {
  if (document.getElementById('overlay-popup')) return;

  // Play sound
  const audio = new Audio(chrome.runtime.getURL('sounds/sound1.mp3'));
  audio.play().catch((error) => {
    console.log("Error playing sound: ", error, audio);
  });

  // Overlay (dimmed background)
  const overlay = document.createElement('div');
  overlay.classList.add('overlay-popup');

  // Modal box
  const popupContent = document.createElement('div');
  popupContent.classList.add('popup-content');

  popupContent.innerHTML = `
    <div class="popup-header">
      <h2>
        You're at a risk of falling into an Echo Chamber! <br>
        Try reading some alternative perspectives:
      </h2>
    </div>

    <div class="popup-posts">
      <div class="post-row">
        <a href="https://www.reddit.com/r/example1" target="_blank" class="post-link">
          Noem Approves Spending $200 Million to Buy Jets During Shutdown
        </a>
        <span class="label left">Left Wing</span>
      </div>

      <div class="post-row">
        <a href="https://www.reddit.com/r/example2" target="_blank" class="post-link">
          Stacey Abrams' Group Closes After Campaign Finance Crimes
        </a>
        <span class="label neutral">Neutral</span>
      </div>

      <div class="post-row">
        <a href="https://www.reddit.com/r/example3" target="_blank" class="post-link">
          Dem Thug Who Yelled "Grab a Gun and Shoot ICE" at Chicago Rally Gets FAFO Lesson Hard!
        </a>
        <span class="label right">Right Wing</span>
      </div>

      <div class="post-row">
        <a href="https://www.reddit.com/r/example4" target="_blank" class="post-link">
          Donald Trump Is Going Down—and He Knows It
        </a>
        <span class="label neutral">Neutral</span>
      </div>
    </div>

    <div class="popup-footer">
      <button id="ok-button" class="ok-button">No thanks!</button>
    </div>
  `;

  overlay.appendChild(popupContent);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    popupContent.style.transform = 'scale(1)';
  });

  // Close logic
  const close = () => {
    overlay.style.opacity = '0';
    popupContent.style.transform = 'scale(0.95)';
    setTimeout(() => overlay.remove(), 250);
  };

  // Close button
  document.getElementById('ok-button').addEventListener('click', close);

  // Close when clicking any post link
  const modalLinks = popupContent.querySelectorAll('.post-link');
  modalLinks.forEach(link => {
    link.addEventListener('click', () => {
      close();
    });
  });
}
// ============================================================

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
