//to coomunicate with background 
import { downloadSummaryAI ,createSummarizer,summarizeBatch} from "./chromeAI.js";
import { VoiceService } from './voice.js';
import { extractSender,extractSubject } from "./emailProcessor.js";
import { hideAllPages, showPage, updateProgress } from './utils.js';

//-------------get DOM element ---------------------

const loginBtn = document.getElementById('loginBtn');
const checkAuthBtn = document.getElementById('checkAuthBtn');
const statusDiv = document.getElementById('status');
const testBtn= document.getElementById('testBtn');
const pauseBtn= document.getElementById('pauseBtn');
const resumeBtn=document.getElementById('resumeBtn');

const myDate = new Date(); // Example Date object
const unixTimestampFromDate = Math.floor(myDate.getTime() / 1000);
console.log("the current time iis",unixTimestampFromDate);



//----------------------------------FUNCTION-----------------------------------


// a function to show the message status 
function showStatus(message, isSucess){
    statusDiv.textContent=message;
    statusDiv.className=isSucess?'success':'error';
}


// get summary 
async function getSummariesFromStorage() {
  const result = await chrome.storage.local.get('summaries');
  
  if (!result.summaries) {
    console.warn('⚠️ No summaries in storage');
    return [];
  }
  
  console.log('📦 Retrieved', result.summaries.length, 'summaries from storage');
  return result.summaries;
}

async function processEmails() {
  try {
    // STEP 1: Check & Download AI Model (0-40%)
    updateProgress(5);
    showStatus("Checking AI availability...", true);
    
    const aiResult = await downloadSummaryAI((progress) => {
      // During download, map progress from 0-100% to 5-40%
      const adjustedProgress = 5 + (progress * 0.35);
      updateProgress(Math.floor(adjustedProgress));
      showStatus(`Downloading AI model... ${Math.floor(progress)}%`, true);
    });
    
    console.log("AI Result:", aiResult);

    if (!aiResult.success){
      console.error("Ai is not loaded , please try back again later ");
      return;
    }
  

   updateProgress(40);
    showStatus("Checking authentication...", true);
    const authResponse = await new Promise((resolve) => {
  chrome.runtime.sendMessage({ type: "CHECK_AUTH" }, resolve);
});

if (!authResponse.authenticated) {
  showStatus("Not logged in", false);
  return;
}

showStatus("Authentication successful!", true);

    //FETCH EMAILS 
    updateProgress(50);
    showStatus("Fetching emails from Gmail...", true);
    
    const emailResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_EMAILS" }, resolve);
    });
    
    if (!emailResponse.success) {
      showStatus("Failed to fetch emails", false);
      return;
    }
    
    const emails = emailResponse.emails;
    console.log("Got emails:", emails);

    // Handle case: No emails found
    if (emails.length === 0) {
      updateProgress(100);
      showStatus("No emails in the last 6 hours", true);
      
      // Still transition to voice page, but it will say "no messages"
      setTimeout(() => {
        showPage('page-voice');
      }, 1500);
      return;
    }

    //CREATE SUMMARIZER INSTANCE

    updateProgress(60);
    showStatus(`Creating AI summarizer for ${emails.length} emails...`, true);
    
    const summarizer = await createSummarizer();
    
    if (!summarizer) {
      showStatus("Failed to create summarizer", false);
      return;
    }

    //START SUMMARIZER 
    updateProgress(70);
    const summarizedEmails = await summarizeBatch(summarizer, emails);
      
      // Display results
      showStatus(`✅ Summarized ${summarizedEmails.length} emails!`, true);
      
      summarizedEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.summary}`);
      });

    //CLEAN AND STORE SUMMARIES 
    updateProgress(90);

     const cleanSummaries = summarizedEmails.map(email => ({
        sender: extractSender(email),      // Extract from headers
        subject: extractSubject(email),    // Extract from headers
        summary: email.summary             // Already at top level
      }));

      // STORE: Summary , sender ad subject 
      await chrome.storage.local.set({ 
        summaries: cleanSummaries,
        count: cleanSummaries.length,      // Optional: store count
        lastUpdated: new Date().toISOString()  // Optional: timestamp
      });

      updateProgress(100);
      showStatus(`✅ Successfully processed ${cleanSummaries.length} emails!`, true);
    
    // Wait 1 second to show 100%, then transition to voice page
    setTimeout(() => {
      showPage('page-voice');
      // The voice page will automatically start reading the summaries
    }, 1000);

    }catch(error){
    console.error("Failed to fetch emails", false);
    showStatus("Something went wrong , please try again later ");
  }


}
//----------------------------------BUTTON-----------------------------------

//LOGIN BUTTON
loginBtn.addEventListener('click',async()=>{
    console.log("Login button clicked");
    showStatus("Starting authentication....",true);
// Send message to background.js
  chrome.runtime.sendMessage(
    { type: "START_AUTH" },
    async(response) => {
      console.log("Response from background:", response);
      
      if (response.success) {
        showStatus( response.message, true);
        showPage('page-loading');
        await processEmails();


      } else {
        showStatus(response.message, false);
      }
    }
  );
});

const voice = new VoiceService();
//TEST SUMMARY BUTTON and VOICE
testBtn.addEventListener('click', async () => {

  try{
    
  //get sumaries 
  const summaries = await getSummariesFromStorage();
  console.log('Retrieved:', summaries);

  // Step 2: Validate summaries exist
  if(summaries.length===0){
    const popupMsg="There is no message";
    await voice.speakText(popupMsg);
    showStatus(popupMsg);
  }else{
    // Step 5: Speak summaries
    voice.speakSummaries(summaries);
  }

  }catch(error){
    console.error("Something goes wrong , please try again later ",error.message);
    showStatus("Something goes wrong , please try again later ",false);
  }
  
});
pauseBtn.disabled = true;   // Can't pause when nothing is speaking
resumeBtn.disabled = true;

//PAYSE THE OVICE WHEN USER CLICK IT 
pauseBtn.addEventListener('click',async() =>{
  console.log("pause button clicked");
  // Try to pause the speech
  const success = voice.pauseSpeaking();
  
  if (success) {
    // Successfully paused
    showStatus("Speech paused", true);
    
    pauseBtn.disabled = true;   // Disable pause (already paused)
    resumeBtn.disabled = false; // Enable resume (can now resume)
  } else {
    // Failed to pause (nothing was speaking or already paused)
    showStatus("Cannot pause - not speaking", false);
  }


});

resumeBtn.addEventListener('click',async()=>{
  console.log('Resume button clicked');
  
  // Try to resume the speech
  const success = voice.resumeSpeaking();
  
  if (success) {
    // Successfully resumed
    showStatus("Speech resumed", true);
    
    // Update button states
    // WHY: Now that we're speaking again, user should be able to pause but not resume
    pauseBtn.disabled = false;  // Enable pause (can pause again)
    resumeBtn.disabled = true;  // Disable resume (already resumed)
  } else {
    // Failed to resume (nothing was paused)
    showStatus("Cannot resume - not paused", false);
  }

});

