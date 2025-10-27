// callAPI.js
// Purpose: All Gmail API interactions
import { getTime } from "./utils.js";
// ==========================================
// FUNCTION 1: Get Auth Token
// Use chrome.identity API, NOT storage
// ==========================================
export async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error("Auth error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log("✓ Token obtained");
        resolve(token);
      }
    });
  });
}


// FUNCTION 3: Fetch Email IDs

export async function getEmailIDs(token) {
  const time = getTime();
  
  console.log(`Fetching emails after timestamp: ${time}`);
  
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=after:${time}&maxResults=50`,
    { 
      headers: { 
        Authorization: `Bearer ${token}` 
      } 
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  console.log(`✓ Found ${data.messages ? data.messages.length : 0} email IDs`);
  
  return data.messages || [];
}

// ==========================================
// FUNCTION 4: Fetch ONE Email Detail
// ==========================================
export async function fetchEmailDetail(token, messageId) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch email ${messageId}: ${response.status}`);
  }
  
  return response.json();
}

// ==========================================
// FUNCTION 5: Fetch ALL Emails (Main Function)
// This orchestrates everything
// ==========================================
export async function fetchAllEmails() {
  try {
    console.log("📧 Step 1: Getting auth token...");
    const token = await getAuthToken();
    
    console.log("📧 Step 2: Fetching email IDs...");
    const messageIds = await getEmailIDs(token);
    
    if (messageIds.length === 0) {
      console.log("📧 No emails in last 6 hours");
      return [];
    }
    
    console.log(`📧 Step 3: Fetching details for ${messageIds.length} emails...`);
    
    // Use Promise.all to fetch all emails in parallel
    const emailPromises = messageIds.map(msg => 
      fetchEmailDetail(token, msg.id)
    );
    
    const emails = await Promise.all(emailPromises);
    
    console.log(`✓ Successfully fetched ${emails.length} full emails`);
    return emails;
    
  } catch (error) {
    console.error("❌ Error in fetchAllEmails:", error);
    throw error;
  }
}
