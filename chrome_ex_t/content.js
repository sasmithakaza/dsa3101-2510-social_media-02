// Content script for Reddit bias detection

// check if we're on Reddit
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

        btnCon.innerHTML = '<button style="padding: 10px 16px 10px 16px; background-color: #ff4500; color: white; border-radius:6px; cursor:pointer;"> View Dashboard </button>'
        
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
    absolute: ['all', 'every', 'none', 'completely', 'totally', 'most']
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

  // const API_URL = "ADD URL HERE"

  // async function analyzeBias(textContent) {
  //   try {                                                                     //want to see if we can even call the backend
  //     const response = await fetch(API_URL, {
  //     method: "POST",
  //     headers: {"Content-Type": "application/json"}, 
  //     body: JSON.stringify({textContent})
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch bias labelling from the backend but can call backend")
  //       }

  //     const biasLabel = await response.json()
  //     return biasLabel
  //     console.log("Sending data to the back end was a success")
  //     } catch (err){
  //       console.error("Cannot call back end at all: ", err)
  //       return null
  //     } 
  // }
  
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

  // function addBiasIndicator(element, biasData) {
  //   if (element.querySelector('.bias-indicator')) return;

  //   const biasIndicator = document.createElement('div');
  //   biasIndicator.className = 'bias-indicator';

  //   let label = biasData.label.toLowerCase();
  //   let labelClass = "bias-neutral"; 

  //   if (label === "left wing") {
  //     labelClass = "bias-left";
  //   } else if (
  //     label === "right wing") {
  //     labelClass = "bias-right";
  //   }

  //   biasIndicator.classList.add(`labelClass`);
  //   biasIndicator.innerHTML = `<span class="bias-badge"> ${label.toUpperCase()}</span>`;

  //   element.style.position = 'relative';
  //   element.insertBefore(biasIndicator, element.firstChild);
  // }

  // === Full-content helper fucntions ===

  // Keep track of posts we already processed to avoid duplicate work
  const processedT3 = new Set();

  // Derive a "t3_xxx" id from a post element
  function getPostId(post) {
    // New Reddit web component (best case)
    if (post.matches('shreddit-post')) {
      const idAttr = post.getAttribute('id'); // often "t3_abc123"
      if (idAttr) return idAttr;
      const permalink = post.getAttribute('permalink') || '';
      const m = permalink.match(/\/comments\/([a-z0-9]+)\//i);
      if (m) return `t3_${m[1]}`;
    }

    // Fallback: look for a link to /comments/<id>/
    const a = post.querySelector('a[href*="/comments/"]');
    if (a) {
      const m = a.getAttribute('href')?.match(/\/comments\/([a-z0-9]+)\//i);
      if (m) return `t3_${m[1]}`;
    }

    return null;
  }

  // Fetch full title/selftext via Reddit JSON (public)
  async function fetchFullPost(t3id) {
    if (!t3id) return null;
    const shortId = t3id.replace(/^t3_/, '');
    const url = `https://www.reddit.com/comments/${shortId}.json?raw_json=1`;

    const res = await fetch(url, { method: 'GET', credentials: 'omit' });
    if (!res.ok) return null;

    const arr = await res.json();
    const d = arr?.[0]?.data?.children?.[0]?.data;
    if (!d) return null;

    return {
      title: d.title || '',
      selftext: d.selftext || '',   // full body for self-posts; empty for link/image/video posts
    };
  }

  
  async function scanPosts() {
    if (!isEnabled) return;

    const isOpenedPostPage = location.pathname.includes('/comments/');

    // ✅ OPENED POST PAGE — Version 1 logic
    if (isOpenedPostPage) {
      const openedPost = document.querySelector('[data-testid="post-container"], shreddit-post, .Post');
      if (!openedPost) {
        console.log('No opened post found yet, retrying soon...');
        return;
      }

      // Extract title and full body text from DOM (no API call)
      const title =
        openedPost.querySelector('h1[data-testid="post-title"], h1, h2, [data-click-id="title"]')
          ?.innerText || '';
      const body =
        openedPost.querySelector('[data-click-id="text"], .usertext-body, [data-testid="post-content"]')
          ?.innerText || '';

      const fullText = `${title}\n${body}`.trim();
      console.log('Opened post detected — text length:', fullText.length);

      if (fullText.length > 20) {
        // ✅ DEBUG: Show full text used for analysis (opened post)
        console.log("=== OPENED POST Bias Analysis Text START ===");
        console.log(fullText);
        console.log("=== OPENED POST Bias Analysis Text END ===");

        const biasData = analyzeBias(fullText);
        if (biasData.score > 0) {
          addBiasIndicator(openedPost, biasData);
        }
      }
      return; // Stop here, don’t scan feed
    }

    // ✅ FEED PAGE — Version 2 logic (fetch full text via Reddit JSON API)
    const posts = document.querySelectorAll(
      'shreddit-post, [data-testid="post-content"], [data-testid="search-post"], [role="article"], .entry .usertext-body'
    );

    for (const post of posts) {
      const t3id = getPostId(post);
      if (!t3id || processedT3.has(t3id)) continue;
      processedT3.add(t3id);

      const full = await fetchFullPost(t3id);
      if (!full) continue;

      const textContent = `${full.title}\n${full.selftext}`.trim();

      if (textContent.length > 20) {
       
        const biasData = analyzeBias(textContent);
        if (biasData.score > 0) {
          addBiasIndicator(post, biasData);
        }
      }
    }
  }


  // async function scanPosts() {
  //   if (!isEnabled) return;

  //   const posts = document.querySelectorAll('[data-testid="post-content"], .entry .usertext-body, shreddit-post');

  //   for (const post of posts) {
  //     const textContent = post.textContent || post.innerText;
  //     if (!textContent) {
  //       continue
  //     }

  //     try {
  //       const biasData = await analyzeBias(textContent);

  //       addBiasIndicator(post, BiasData)
  //     } catch (err) {
  //       console.error("Error analysing post but could retrieve text content: ", err)
  //     }
  //   }
  // }
  
  // Function to remove all bias indicators
  function removeAllIndicators() {
    const indicators = document.querySelectorAll('.bias-indicator');
    indicators.forEach(indicator => indicator.remove());
  }
  
  // Initial scan
  setTimeout(scanPosts, 1000);
  
  // !!!!! everytime the page changes (e.g. new posts loaded), run scanPosts() again to analyze new content
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
  
  // === Detect URL navigation (Reddit is an SPA) ===
  let lastUrl = location.href;

  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('URL changed, rescanning posts...');

      const isOpenedPostPage = location.pathname.includes('/comments/');

      if (isOpenedPostPage) {
        console.log('Opened post detected - scanning after load');
        setTimeout(scanPosts, 1500); // Delay gives Reddit time to render title + body
      } else {
        // Feed or other pages
        setTimeout(scanPosts, 800);
      }
    }
  }, 500);

  console.log('Reddit Bias Detector loaded');