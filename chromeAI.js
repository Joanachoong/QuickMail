// chromeAI.js - Chrome Built-in AI Integration

 async function checkSummarizerAvailability() {
    try {
        const availability = await Summarizer.availability();
        
        if (availability === 'unavailable') {
            return {
                status: 'unavailable',
                message: "The Summarizer API isn't usable on this device"
            };
        } else if (availability === 'downloadable') {
            return {
                status: 'downloadable',
                message: "Model needs to be downloaded first"
            };
        } else {  // availability === 'available'
            return {
                status: 'available',
                message: "Summarizer is ready to use"
            };
        }
    } catch (error) {
        console.error('Availability check error:', error);
        return {
            status: 'error',
            message: `Error checking availability: ${error.message}`
        };
    }
}

 export async function createSummarizer(options = {}, onProgress) {
    try {
        // ✅ CORRECT parameters for Chrome Summarizer API
        const config = {
            type: options.type || 'tldr',           
            format: options.format || 'plain-text', 
            length: options.length || 'short',      
            sharedContext: options.sharedContext || 'These are emails from the past 6 hours',
            language: 'en'  // ← THIS IS THE KEY! Must be 'language', not 'outputLanguage'
        };
        
        // Add download progress monitoring if callback provided
        if (onProgress) {
            config.monitor = (m) => {
                m.addEventListener('downloadprogress', (e) => {
                    const progress = Math.round(e.loaded * 100);
                    console.log(`Download progress: ${progress}%`);
                    onProgress(progress);
                });
            };
        }
        
        console.log('Creating summarizer with config:', config);
        const summarizer = await Summarizer.create(config);
        console.log('✅ Summarizer created successfully');
        return summarizer;
        
    } catch (error) {
        console.error('❌ Failed to create summarizer:', error);
        return null;
    }
}

export async function summarizeEmail(summarizer, email) {
    try {
        // Combine subject and snippet/body
        const emailText = `Subject: ${email.subject}\n\n${email.snippet || email.body || ''}`;
        
        // Skip if too short
        if (emailText.length < 50) {
            console.log(`Skipping short email: ${email.subject}`);
            return {
                success: true,
                summary: emailText,
                usedAI: false
            };
        }
        
        // Summarize with AI
        console.log(`Summarizing: ${email.subject}`);
        const summary = await summarizer.summarize(emailText, {
            context: 'This is an email from user inbox'
        });
        
        return {
            success: true,
            summary: summary,
            usedAI: true
        };
        
    } catch (error) {
        console.error('Summarization failed for email:', error);
        
        // Fallback: return sender + subject
        const fallback = `Email from ${email.from || 'unknown sender'}, regarding ${email.subject}`;
        return {
            success: true,
            summary: fallback,
            usedAI: false,
            error: error.message
        };
    }
}

export async function summarizeBatch(summarizer, emails) {
    console.log(`📧 Starting batch summarization for ${emails.length} emails`);
    
    // Process all emails in parallel
    const summaryPromises = emails.map(email => 
        summarizeEmail(summarizer, email)
    );
    
    // Wait for all to complete
    const results = await Promise.all(summaryPromises);
    
    // Attach summaries to original email objects
    emails.forEach((email, index) => {
        email.summary = results[index].summary;
        email.summarizedWithAI = results[index].usedAI;
    });
    
    const aiCount = results.filter(r => r.usedAI).length;
    console.log(`✅ Summarized ${aiCount} emails with AI, ${emails.length - aiCount} without AI`);
    
    return emails;
}

export async function downloadSummaryAI(onProgress) {
    try {
        console.log('🔍 Checking Summarizer availability...');
        
        // TODO #1: Call your checkSummarizerAvailability() function
        const availability = await checkSummarizerAvailability();// ← FILL THIS IN
        
        console.log('Status:', availability.status);
        
        // STEP 2: If already available - great! Just return success
        if (availability.status === 'available') {
            console.log('✅ Model already available!');
            return {
                success: true,
                status: 'available',
                message: 'Summarizer is ready to use'
            };
        }
        
        // STEP 3: If unavailable - can't use AI, return failure
        if (availability.status === 'unavailable') {
            console.log('❌ Summarizer unavailable on this device');
            return {
                success: false,
                status: 'unavailable',
                message: availability.message
            };
        }
        
        // STEP 4: If downloadable - trigger download
        if (availability.status === 'downloadable') {
            console.log('📥 Model needs download. Starting now...');
            
            // TODO #2: Call your createSummarizer() function with onProgress
            const summarizer = await createSummarizer({},onProgress);// ← FILL THIS IN
            
            // TODO #3: Check if summarizer is null (download failed)
            if (summarizer===null){// ← FILL THIS IN) {
                return {
                    success: false,
                    status: 'download-failed',
                    message: 'Failed to download model'
                };
            }
            
            console.log('✅ Model downloaded successfully!');
            return {
                success: true,
                status: 'downloaded',
                message: 'Model downloaded and ready'
            };
        }
        
    } catch (error) {
        console.error('❌ Error in downloadSummaryAI:', error);
        return {
            success: false,
            status: 'error',
            message: error.message
        };
    }
}