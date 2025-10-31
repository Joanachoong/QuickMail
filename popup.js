//to coomunicate with background 
import { downloadSummaryAI ,createSummarizer,summarizeBatch} from "./chromeAI.js";
import { VoiceService } from './voice.js';
import { extractSender,extractSubject } from "./emailProcessor.js";
import { hideAllPages, showPage, updateProgress, cleanSummaryText } from './utils.js';

//-------------get DOM element ---------------------

const loginBtn = document.getElementById('loginBtn');
const checkAuthBtn = document.getElementById('checkAuthBtn');
const statusDiv = document.getElementById('status');
const testBtn= document.getElementById('testBtn');
let playPauseBtn = document.getElementById('playPauseBtn') || document.querySelector('.play-pause');
const stopBtn = document.getElementById('stopBtn');


const myDate = new Date(); // Example Date object
const unixTimestampFromDate = Math.floor(myDate.getTime() / 1000);
console.log("the current time is",unixTimestampFromDate);



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
  
  // CLEAN ALL SUMMARIES before returning
  const cleanedSummaries = result.summaries.map(email => ({
    ...email,
    summary: cleanSummaryText(email.summary),
    subject: cleanSummaryText(email.subject)
  }));
  
  return cleanedSummaries;
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
        subject: cleanSummaryText(extractSubject(email)),    // Clean subject
        summary: cleanSummaryText(email.summary)             // Clean summary (remove HTML & emojis)
      }));

      console.log('🧹 Cleaned summaries:', cleanSummaries.length, 'emails processed');

      // STORE: Summary , sender ad subject 
      await chrome.storage.local.set({ 
        summaries: cleanSummaries,
        count: cleanSummaries.length,      // Optional: store count
        lastUpdated: new Date().toISOString()  // Optional: timestamp
      });

      updateProgress(100);
      showStatus(`✅ Successfully processed ${cleanSummaries.length} emails!`, true);
    
    // Wait 1 second to show 100%, then transition to voice page
    setTimeout(async () => {
      showPage('page-voice');
      
      // 🎤 AUTO-PLAY FEATURE: Automatically start reading summaries
      console.log('🎤 Voice page loaded - starting auto-play');
      await autoPlaySummaries();
    }, 1000);

    }catch(error){
    console.error("Failed to fetch emails", false);
    showStatus("Something went wrong , please try again later ");
  }


}

// 🎤 AUTO-PLAY FUNCTION
// This function runs automatically when the voice page loads
async function autoPlaySummaries() {
  try {
    console.log('🎬 Auto-play triggered');
    
    // Get summaries from storage
    const summaries = await getSummariesFromStorage();
    console.log('📊 Retrieved summaries count:', summaries.length);

    if (summaries.length === 0) {
      // No emails to read
      const popupMsg = "You have no new messages in the last 6 hours";
      await voice.speakText(popupMsg);
      showStatus(popupMsg, true);
      
      // Keep play button disabled since there's nothing to play
      if (playPauseBtn) {
        playPauseBtn.disabled = true;
      }
    } else {
      // Start reading summaries automatically
      console.log('🔊 Starting to speak', summaries.length, 'summaries');
      voice.speakSummaries(summaries);
      
      // Enable play/pause button once speaking starts
      if (playPauseBtn) {
        playPauseBtn.disabled = false;
        playPauseBtn.classList.remove('paused'); // Show as "playing"
        playPauseBtn.setAttribute('aria-pressed', 'false');
        console.log('✅ Play/Pause button enabled');
      } else {
        console.warn('⚠️ playPauseBtn not found - cannot enable controls');
      }
      
      showStatus(`Speaking ${summaries.length} email summaries...`, true);
    }
  } catch (error) {
    console.error('❌ Auto-play error:', error);
    showStatus('Could not auto-play summaries', false);
    
    // Disable button on error
    if (playPauseBtn) {
      playPauseBtn.disabled = true;
    }
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

// TEST BUTTON (Manual testing - AUTO-PLAY handles normal flow)
// This button is now optional since auto-play triggers on voice page load
if (testBtn) {
  testBtn.addEventListener('click', async () => {
    try {
      const summaries = await getSummariesFromStorage(); // Now returns cleaned summaries
      console.log('🧪 Manual test - Retrieved summaries count:', summaries.length);

      if (summaries.length === 0) {
        const popupMsg = "There is no message";
        await voice.speakText(popupMsg);
        showStatus(popupMsg);
      } else {
        voice.speakSummaries(summaries);
        // enable play/pause once speaking started
        if (playPauseBtn) {
          playPauseBtn.disabled = false;
          playPauseBtn.classList.remove('paused');
          playPauseBtn.setAttribute('aria-pressed', 'false');
        } else {
          console.warn('playPauseBtn not found at time of enabling');
        }
      }
    } catch (error) {
      console.error("Something went wrong:", error);
      showStatus("Something went wrong, please try again later", false);
    }
  });
} else {
  console.log('ℹ️ testBtn not found - using auto-play only');
}

// Ensure button default state (if exists)
if (playPauseBtn) {
  playPauseBtn.disabled = true; // disabled until speaking begins
  playPauseBtn.classList.remove('paused');
  playPauseBtn.setAttribute('aria-pressed', 'false');
}

// Single Play/Pause Toggle
if (playPauseBtn) {
  playPauseBtn.addEventListener('click', async (ev) => {
    // prevent clicks when disabled (defensive)
    if (playPauseBtn.disabled) {
      console.log('playPauseBtn clicked while disabled - ignoring');
      return;
    }

    const isNowPaused = playPauseBtn.classList.toggle('paused');
    playPauseBtn.setAttribute('aria-pressed', String(isNowPaused));
    console.log('playPause clicked, new paused state =', isNowPaused);

    if (isNowPaused) {
      // Pause action
      try {
        const success = voice.pauseSpeaking();
        console.log('voice.pauseSpeaking() returned:', success);
        if (success) {
          showStatus('Speech paused', true);
        } else {
          showStatus('Cannot pause - not speaking', false);
          // revert UI if pause failed
          playPauseBtn.classList.remove('paused');
          playPauseBtn.setAttribute('aria-pressed', 'false');
        }
      } catch (err) {
        console.error('Error while pausing:', err);
        showStatus('Error while pausing', false);
      }
    } else {
      // Resume action
      try {
        const success = voice.resumeSpeaking();
        console.log('voice.resumeSpeaking() returned:', success);
        if (success) {
          showStatus('Speech resumed', true);
        } else {
          showStatus('Cannot resume - not paused', false);
          // revert UI if resume failed
          playPauseBtn.classList.add('paused');
          playPauseBtn.setAttribute('aria-pressed', 'true');
        }
      } catch (err) {
        console.error('Error while resuming:', err);
        showStatus('Error while resuming', false);
      }
    }
  });
} else {
  console.warn('playPauseBtn not present - play/pause feature disabled');
}