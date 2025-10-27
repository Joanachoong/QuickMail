// background.js
// Purpose: Chrome extension background logic

import { fetchAllEmails } from './callEmailAPI.js';

// Store emails in memory
let cachedEmails = null;
let lastFetchTime = null;

// ==========================================
// FUNCTION: Refresh Emails
// ==========================================
async function refreshEmails() {
  try {
    console.log("🔄 Refreshing emails...");
    cachedEmails = await fetchAllEmails();
    lastFetchTime = new Date();
    console.log(`✓ Fetched ${cachedEmails.length} emails`);
    return cachedEmails;
  } catch (error) {
    console.error("❌ Failed to refresh emails:", error);
    cachedEmails = null;
    throw error;
  }
}

// ==========================================
// MESSAGE LISTENER: Handle popup requests
// ==========================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 Background received message:", message);
  
  // Request 1: Check if authenticated
  if (message.type === "CHECK_AUTH") {
    sendResponse({ 
      authenticated: cachedEmails !== null,
      emailCount: cachedEmails ? cachedEmails.length : 0
    });
    return false; // Synchronous response
  }
  
  // Request 2: Get emails
  if (message.type === "GET_EMAILS") {
    // If cached, return immediately
    if (cachedEmails) {
      sendResponse({ 
        success: true, 
        emails: cachedEmails,
        fetchTime: lastFetchTime
      });
      return false;
    }
    
    // If not cached, fetch now
    refreshEmails()
      .then(() => {
        sendResponse({ 
          success: true, 
          emails: cachedEmails || []
        });
      })
      .catch(error => {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      });
    
    return true; // Async response
  }
  
  // Request 3: Force refresh
  // if (message.type === "REFRESH_EMAILS") {
  //   refreshEmails()
  //     .then(() => {
  //       sendResponse({ 
  //         success: true, 
  //         emails: cachedEmails || []
  //       });
  //     })
  //     .catch(error => {
  //       sendResponse({ 
  //         success: false, 
  //         error: error.message 
  //       });
  //     });
    
  //   return true; // Async response
  // }

  // Request 3: Force refresh
  if (message.type === "START_AUTH") {
    refreshEmails()
      .then(() => {
        sendResponse({ 
          success: true, 
          emails: cachedEmails || []
        });
      })
      .catch(error => {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      });
    
    return true; // Async response
  }
});

// ==========================================
// INITIALIZATION
// ==========================================
console.log("✓ Background script loaded");

// Fetch emails on startup
refreshEmails().catch(err => {
  console.error("Failed to fetch on startup:", err);
});

// Auto-refresh every 10 minutes
setInterval(() => {
  console.log("⏰ Auto-refreshing emails...");
  refreshEmails();
}, 10 * 60 * 1000);

