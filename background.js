//This page will handle all the authentication for Gmaiil API


// 1. Listen for messages from popup.js
//    Message: "Hey, user wants to login!"

// to listen for message from other parts of your extension 
//message = The data sent (usually an object)
// sender = Who sent it (popup, content script, etc.)
// sendResponse = Function to send data back
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
if (message.type === "CHECK_AUTH") {
  chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (chrome.runtime.lastError) {
      console.error("Auth error:", chrome.runtime.lastError);
      sendResponse({ authenticated: false });
      return;
    }

    console.log("OAuth Token:", token);
    sendResponse({ authenticated: true, token });
  });

  return true; // Important: keeps message channel open for async sendResponse
}
s
});
console.log("Background script loaded");



// 2. Start OAuth flow

//    Use chrome.identity.launchWebAuthFlow() - before doing this i need to 
let urls="https://accounts.google.com/o/oauth2/auth?";
//make constant for Client_id , redirect_url and scopes 

const client_id="674352347323-c9rokvr0lv0icdi6gl4v6jmhehjgpdue.apps.googleusercontent.com"
const redirect_url= chrome.identity.getRedirectURL();
const scopes="https://www.googleapis.com/auth/gmail.readonly";

// OAUTH flow 

//1. set the URL first - authURL is used to accesses the URL's query parameters, 
const authURL=new URL(urls);
authURL.searchParams.set("client_id",client_id);
authURL.searchParams.set("response_type","token");
authURL.searchParams.set("redirect_uri",redirect_url);
authURL.searchParams.set("scope",scopes);

//display the output
console.log("URL",redirect_url);
console.log("Auh URL:",authURL.toString());


// func tion to start the work flow
async function startOAuthFlow() {
  console.log("🔐 Starting OAuth flow...");
  
  try {
    // STEP 1: Launch OAuth flow
    const connectUrl = await chrome.identity.launchWebAuthFlow({
      url: authURL.toString(),
      interactive: true
    });
    
    console.log(" OAuth flow completed!");
    console.log(" Redirect URL:", connectUrl);
    
    // STEP 2: Extract token
    const token = extractTokenFromUrl(connectUrl);
    
    if (!token) {
      throw new Error("TOKEN_EXTRACTION_FAILED");
    }
    
    console.log("🎫 Token received! (length:", token.length, ")");
    
    // STEP 3: Store token
    await chrome.storage.local.set({
      gmail_token: token,
      token_time: Date.now()
    });
    
    console.log(" Token saved successfully!");
    
    return { 
      success: true, 
      message: "Authentication successful!" 
    };
    
  } catch (err) {
    console.error(" OAuth flow error:", err);
    
    // Handle different error types
    let userMessage;
    
    if (err.message === "TOKEN_EXTRACTION_FAILED") {
      userMessage = "Failed to extract authentication token. Please try again.";
    } else if (err.message.includes("Authorization page could not be loaded")) {
      userMessage = "Failed to connect with Google. Check your internet connection.";
    } else if (err.message.includes("The user did not approve access")) {
      userMessage = "You denied access. Please allow Gmail access to use this extension.";
    } else {
      userMessage = "Authentication failed. Please try again.";
    }
    
    return { 
      success: false, 
      message: userMessage 
    };
  }
}


// function to extract the token from url 
function extractTokenFromUrl(url){
    const urlParam= new URLSearchParams(url.split('#')[1]);
    return urlParam.get('access_token');

}


// 5. Send response back to popup.js
//    Message: "Success! User is logged in"
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(" Background received message:", message);
  
  if (message.type === "START_AUTH") {
    // Start OAuth flow (async)
    startOAuthFlow().then((result) => {
      sendResponse(result);
    });
    
    // Keep message channel open for async response
    return true;
  }
  if (message.type === "CHECK_AUTH") {
    // Check if user is already authenticated
    chrome.storage.local.get(["gmail_token"], (result) => {
      if (result.gmail_token) {
        sendResponse({ authenticated: true });
      } else {
        sendResponse({ authenticated: false });
      }
    });
    
    return true;
  }
});

console.log("Sucesfully loaded ");


// 6. (Later) Handle token expiration
//    If token expired, refresh it or re-authenticate