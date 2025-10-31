//to coomunicate with background 
import { downloadSummaryAI ,createSummarizer,summarizeBatch} from "./chromeAI.js";
import { VoiceService } from './voice.js';
import { extractSender,
  extractSubject,
 // NEW: Import categorization functions
 filterJunkEmails,
 sortEmailsByPriority,
 groupEmailsByCategory,
 getEmailCountSummary } from "./emailProcessor.js";
import { showPage, updateProgress, cleanSummaryText } from './utils.js';

//-------------get DOM element ---------------------

const loginBtn = document.getElementById('loginBtn');
const statusDiv = document.getElementById('status');
let playPauseBtn = document.getElementById('playPauseBtn') || document.querySelector('.play-pause');


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

    const relevantEmails = filterJunkEmails(emails);
    const junkCount = emails.length - relevantEmails.length;

    console.log(`📊 Categorization results:`);
    console.log(`   - Total emails: ${emails.length}`);
   console.log(`   - Relevant: ${relevantEmails.length}`);
   console.log(`   - Junk filtered: ${junkCount}`);


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

    const sortedEmails = sortEmailsByPriority(relevantEmails);
   const highPriorityCount = sortedEmails.filter(e => e.priority === 'high').length;

   if (highPriorityCount > 0) {
     console.log(`🔥 ${highPriorityCount} high priority emails detected`);
   }

    updateProgress(60);
    showStatus(`Creating AI summarizer for ${emails.length} emails...`, true);
    
    const summarizer = await createSummarizer();
    
    if (!summarizer) {
      showStatus("Failed to create summarizer", false);
      return;
    }

    //START SUMMARIZER 
    updateProgress(70);
    const summarizedEmails = await summarizeBatch(summarizer, sortedEmails);
      
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
        summary: cleanSummaryText(email.summary),          // Clean summary (remove HTML & emojis)
         category: email.category || 'other',
    priority: email.priority || 'normal',
    shouldSkip: email.shouldSkip || false
      }));

      console.log('🧹 Cleaned summaries:', cleanSummaries.length, 'emails processed');

      //CATEGORY SUMMARY
      const categorySummary = getEmailCountSummary(cleanSummaries);
    console.log('📊 Category breakdown:', categorySummary);

      // STORE: Summary , sender ad subject 
      await chrome.storage.local.set({ 
        summaries: cleanSummaries,
        count: cleanSummaries.length,      // Optional: store count
        junkCount: junkCount,              // NEW: Store how many junk filtered
      categorySummary: categorySummary, 
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
    
    // Re-select playPauseBtn to ensure it's available when voice page is shown
    playPauseBtn = document.getElementById('playPauseBtn') || document.querySelector('.play-pause');
    
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
    }
      else{
      const stats = await chrome.storage.local.get(['count', 'junkCount', 'categorySummary']);
      const totalEmails = (stats.count || 0) + (stats.junkCount || 0);
      const junkFiltered = stats.junkCount || 0;
      const categorySummary = stats.categorySummary || {};

      console.log('📊 Email stats:', {
      relevant: stats.count,
      junk: junkFiltered,
        categories: categorySummary
      });

      // NEW: Build opening announcement with category breakdown
      let openingMessage = `You have ${summaries.length} relevant email${summaries.length > 1 ? 's' : ''}`;
      
      if (junkFiltered > 0) {
        openingMessage += `. ${junkFiltered} promotional email${junkFiltered > 1 ? 's were' : ' was'} filtered out`;
        }
      
      if (categorySummary.highPriority > 0) {
        openingMessage += `. ${categorySummary.highPriority} ${categorySummary.highPriority > 1 ? 'are' : 'is'} high priority`;
      }
      
      // Add category breakdown (only non-zero categories)
      const categoryParts = [];
      if (categorySummary.work > 0) categoryParts.push(`${categorySummary.work} work`);
      if (categorySummary.school > 0) categoryParts.push(`${categorySummary.school} school`);
      if (categorySummary.events > 0) categoryParts.push(`${categorySummary.events} event${categorySummary.events > 1 ? 's' : ''}`);
      if (categorySummary.other > 0) categoryParts.push(`${categorySummary.other} other`);
        
      if (categoryParts.length > 0) {
        openingMessage += `. You have ${categoryParts.join(', ')}`;
      }
      
          console.log('📢 Opening message:', openingMessage);
          await voice.speakText(openingMessage);
          await new Promise(resolve => setTimeout(resolve, 800));

          const grouped = groupEmailsByCategory(summaries);
    
      console.log('📂 Grouped emails:', {
          work: grouped.work.length,
          school: grouped.school.length,
          events: grouped.events.length,
          other: grouped.other.length
        });
      
        // NEW: Read emails in category order (Work → School → Events → Other)
      await readCategoryEmails('Work', grouped.work);
      await readCategoryEmails('School', grouped.school);
      await readCategoryEmails('Events', grouped.events);
      await readCategoryEmails('Other', grouped.other);
      
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

  async function readCategoryEmails(categoryName, emails) {
    if (!emails || emails.length === 0) {
    console.log(`⏭️ Skipping ${categoryName} - no emails`);
    return;
    }
  
    console.log(`📖 Reading ${categoryName} emails (${emails.length} total)`);
  
    // Announce category
    await voice.speakText(`${categoryName} emails`);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Separate high priority and normal priority
    const highPriority = emails.filter(e => e.priority === 'high');
    const normalPriority = emails.filter(e => e.priority === 'normal');
    
    // Read high priority first
    for (const email of highPriority) {
      // Check if paused before continuing
      if (voice.userPaused) {
        console.log('⏸️ Paused - waiting for resume...');
        // Wait until resumed
        while (voice.userPaused) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      const message = `Urgent. From ${email.sender}. ${email.summary}`;
    console.log(`🔥 HIGH PRIORITY: ${message}`);
      try {
        await voice.speakText(message);
      } catch (err) {
        if (err.message === 'Speech is paused by user') {
          console.log('⏸️ Speech was paused during speakText');
          // Wait until resumed
          while (voice.userPaused) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          // Retry after resume
          await voice.speakText(message);
        } else {
          throw err;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  // Then read normal priority
    for (const email of normalPriority) {
      // Check if paused before continuing
      if (voice.userPaused) {
        console.log('⏸️ Paused - waiting for resume...');
        // Wait until resumed
        while (voice.userPaused) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      const message = `From ${email.sender}. ${email.summary}`;
    console.log(`📧 ${message}`);
      try {
        await voice.speakText(message);
      } catch (err) {
        if (err.message === 'Speech is paused by user') {
          console.log('⏸️ Speech was paused during speakText');
          // Wait until resumed
          while (voice.userPaused) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          // Retry after resume
          await voice.speakText(message);
        } else {
          throw err;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  console.log(`✅ Finished reading ${categoryName} emails`);
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