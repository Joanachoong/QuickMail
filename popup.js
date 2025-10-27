//to coomunicate with background 
import { downloadSummaryAI ,createSummarizer,summarizeBatch} from "./chromeAI.js";

//get DOM element 

const loginBtn = document.getElementById('loginBtn');
const checkAuthBtn = document.getElementById('checkAuthBtn');
const statusDiv = document.getElementById('status');

const myDate = new Date(); // Example Date object
const unixTimestampFromDate = Math.floor(myDate.getTime() / 1000);
console.log("the current time iis",unixTimestampFromDate);
// a function to show the message status 
function showStatus(message, isSucess){
    statusDiv.textContent=message;
    statusDiv.className=isSucess?'success':'error';
}

//LOGIN BUTTON
loginBtn.addEventListener('click',async()=>{
    console.log("Login button clicked");
    showStatus("Starting authentication....",true);
// Send message to background.js
  chrome.runtime.sendMessage(
    { type: "START_AUTH" },
    (response) => {
      console.log("Response from background:", response);
      
      if (response.success) {
        showStatus( response.message, true);


      } else {
        showStatus(response.message, false);
      }
    }
  );
});

//CHECK AUTH BUTTON

checkAuthBtn.addEventListener('click',async()=>{
    //message show button was clicked 
    console.log("Button clicked");
    console.log(window.ai);

    chrome.runtime.sendMessage(
  { type: "GET_EMAILS" },  
  
);

    // ✅ Check summarizer availability
    showStatus("Checking AI availability...", true);
    // ✅ Check and download AI if needed
showStatus("Checking AI availability...", true);

const aiResult = await downloadSummaryAI((progress) => {
    // This callback runs during download to show progress
    showStatus(`Downloading AI model... ${progress}%`, true);
});

console.log("AI Result:", aiResult);

// Check if AI is ready
if (!aiResult.success) {
    showStatus(`AI Error: ${aiResult.message}`, false);
    // TODO: What should happen here? Show emails without summaries?
    return;
}

showStatus("AI ready! Fetching emails...", true);
// Send message to background.js( confirm if the use ris autenticated)
  chrome.runtime.sendMessage(
    { type: "CHECK_AUTH" },
    (response) => {
      if (response.authenticated) {
        showStatus("Login successful",true);
      } else {
        showStatus(" Not logged in" , false);
      }
    }
  );

  chrome.runtime.sendMessage(
  { type: "GET_EMAILS" },  
  async(response) => {
    if (response.success) {
      const emails = response.emails;  
      console.log("Got emails:", emails);
      
      if (emails.length === 0) {
        showStatus("No emails in the last 6 hours", true);
        return;
      }
      
      showStatus(`Summarizing ${emails.length} emails...`, true);
      
      // ✅ NEW: Create summarizer instance
      const summarizer = await createSummarizer();
      
      if (!summarizer) {
        showStatus("Failed to create summarizer", false);
        return;
      }
      // ✅ NEW: Summarize all emails with AI
      const summarizedEmails = await summarizeBatch(summarizer, emails);
      
      // Display results
      showStatus(`✅ Summarized ${summarizedEmails.length} emails!`, true);
      
      summarizedEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.summary}`);
      });
    } else {
      showStatus("Failed to fetch emails", false);
    }
  }
      
);
});

