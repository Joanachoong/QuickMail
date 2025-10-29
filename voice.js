// voice.js
// Voice Service using Composition Pattern (Option 2)
// Handles both Text-to-Speech (TTS) and Speech-to-Text (STT) in one service

export class VoiceService {
  constructor() {
    
    // INITIALIZE TTS
    // WHY: We check support at initialization to fail fast
    // If browser doesn't support it, we know immediately
    this.ttsSupported = 'speechSynthesis' in window;
    this.tts = this.ttsSupported ? window.speechSynthesis : null;
    
    // Track current utterance for control (pause/resume/stop)
    this.currentUtterance = null;
    this.isSpeaking = false;
    
    // INITIALIZE STT
    // WHY: Chrome uses webkit prefix, so we check for it
    this.sttSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.recognition = null;
    this.isListening = false;
    
    // Initialize STT if supported
    if (this.sttSupported) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition settings
      this.recognition.continuous = false;  // Stop after one result
      this.recognition.interimResults = false;  // Only final results
      this.recognition.lang = 'en-US';  // Language
    }
    
    // Log support status for debugging
    console.log('🎤 VoiceService initialized:', {
      tts: this.ttsSupported,
      stt: this.sttSupported
    });
    
    if (!this.ttsSupported) {
      console.warn('⚠️ Text-to-Speech not supported in this browser');
    }
    
    if (!this.sttSupported) {
      console.warn('⚠️ Speech-to-Text not supported in this browser');
    }
  }


  // TEXT-TO-SPEECH (TTS) METHODS

  /**
   * Speak a single text string
   * @param {string} text - The text to speak
   * @param {Object} options - Optional voice settings
   * @returns {Promise} - Resolves when speech ends, rejects on error
   */
   speakText(text, options = {}) {
    return new Promise((resolve, reject) => {
      // Check if TTS is supported
      if (!this.ttsSupported || !this.tts) {
        console.error('❌ TTS not supported');
        reject(new Error('Text-to-Speech not supported'));
        return;
      }
      // Cancel any ongoing speech before starting new one
      // WHY: Prevents overlap and ensures clean start
      this.stopSpeaking();

      // Create the utterance (the thing that will be spoken)
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings with defaults
      // WHY: These control how the voice sounds
      utterance.rate = options.rate || 1.0;      // Speed (0.1 to 10)
      utterance.pitch = options.pitch || 1.0;    // Pitch (0 to 2)
      utterance.volume = options.volume || 1.0;  // Volume (0 to 1)
      utterance.lang = options.lang || 'en-US';  // Language
      
      // Optional: Set specific voice if provided
      if (options.voice) {
        utterance.voice = options.voice;
      }

      // Store current utterance for control
      this.currentUtterance = utterance;
      this.isSpeaking = true;

      // Event: When speech starts
      utterance.onstart = (event) => {
  console.log(`🔊 Started speaking: ${event.utterance.text}`);
  if (options.onStart) options.onStart(event);
};

      // Event: When speech ends successfully
      utterance.onend = (event) => {
        console.log('✅ Finished speaking');
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (options.onEnd) options.onEnd(event);
        resolve();
      };

      // Event: If speech encounters an error
      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (options.onError) options.onError(event.error);
        reject(event.error);
      };

      // Start speaking!
      this.tts.speak(utterance);
    });
  }

  /**
   * Speak multiple email summaries with pauses between them
   * @param {Array} summariesArray - Array of email objects
   * @param {Object} options - Optional settings
   */
  async speakSummaries(summariesArray, options = {}) {
    if (!this.ttsSupported || !summariesArray || summariesArray.length === 0) {
      console.warn('⚠️ Cannot speak summaries: TTS not supported or no summaries');
      return;
    }

    console.log(`📧 Speaking ${summariesArray.length} email summaries`);

    // Format and speak each email one by one
    for (let i = 0; i < summariesArray.length; i++) {
      const email = summariesArray[i];
      
      // Format the email for speaking
      // WHY: Natural language format makes it easier to understand
      const spokenText = this.formatEmailForSpeech(email, i + 1, summariesArray.length);
      
      try {
        // Speak this email (awaits completion before next)
        await this.speakText(spokenText, options);
        
        // Add a pause between emails
        // WHY: Gives listener time to process before next email
        if (i < summariesArray.length - 1) {
          await this.pause(200); // 500ms pause
        }
      } catch (error) {
        console.error(`Error speaking email ${i + 1}:`, error);
        // Continue to next email even if one fails
      }
    }

    console.log('✅ Finished speaking all summaries');
  }

  /**
   * Format an email object into speakable text
   * @param {Object} email - Email object with sender, subject, summary
   * @param {number} index - Current email number
   * @param {number} total - Total number of emails
   * @returns {string} - Formatted text for speaking
   */
  formatEmailForSpeech(email, index, total) {
    // Handle case where summary is unavailable
    // WHY: From voice.txt - if summary unavailable, read sender & subject only
    if (!email.summary || email.summary === 'Summary unavailable') {
      return `Email ${index} of ${total}. From ${email.sender}. Subject: ${email.subject}.`;
    }

    // Full format with summary
    return `Email ${index} of ${total}. From ${email.sender}. Subject: ${email.subject}. ${email.summary}`;
  }

  /**
   * Stop current speech immediately
   */
  stopSpeaking() {
    if (this.tts && this.isSpeaking) {
      this.tts.cancel();  // Stops all queued utterances
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('🛑 Speech stopped');
    }
  }

  pauseSpeaking() {
  // QUESTION: Why check both conditions?
  if (this.tts && this.tts.speaking && !this.tts.paused) {
    this.tts.pause();
    console.log('⏸️ Speech paused');
    return true;  // Successfully paused
  }
  console.warn('⚠️ Cannot pause: not speaking or already paused');
  return false;  // Couldn't pause
}

/**
 * Resume the paused speech
 */
resumeSpeaking() {
  // QUESTION: Why check both conditions?
  if (this.tts && this.tts.paused) {
    this.tts.resume();
    console.log('▶️ Speech resumed');
    return true;  // Successfully resumed
  }
  console.warn('⚠️ Cannot resume: not paused');
  return false;  // Couldn't resume
}

  /**
   * Pause execution for specified milliseconds
   * WHY: Creates natural pauses between emails
   * @param {number} ms - Milliseconds to pause
   * @returns {Promise}
   */
  pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available voices in the browser
   * WHY: User might want to select different voice (male/female, accent)
   * @returns {Array} - Array of available SpeechSynthesisVoice objects
   */
  getAvailableVoices() {
    if (!this.ttsSupported) return [];
    return this.tts.getVoices();
  }

  // ===================
  // SPEECH-TO-TEXT (STT) METHODS
  // ===================

  /**
   * Start listening for voice input
   * @param {Function} onResultCallback - Called with recognized text
   * @param {Function} onErrorCallback - Called on error
   */
  startListening(onResultCallback, onErrorCallback) {
    if (!this.sttSupported || !this.recognition) {
      console.error('❌ STT not supported');
      if (onErrorCallback) onErrorCallback(new Error('Speech recognition not supported'));
      return;
    }

    if (this.isListening) {
      console.warn('⚠️ Already listening');
      return;
    }

    // Event: When speech is recognized
    this.recognition.onresult = (event) => {
      // Get the transcript from the result
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      console.log('🎤 Recognized:', transcript, `(confidence: ${confidence})`);
      
      if (onResultCallback) {
        onResultCallback(transcript, confidence);
      }
    };

    // Event: When recognition ends
    this.recognition.onend = () => {
      console.log('🎤 Listening stopped');
      this.isListening = false;
    };

    // Event: On error
    this.recognition.onerror = (event) => {
      console.error('❌ Recognition error:', event.error);
      this.isListening = false;
      if (onErrorCallback) onErrorCallback(event.error);
    };

    // Start listening
    try {
      this.recognition.start();
      this.isListening = true;
      console.log('🎤 Started listening...');
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      if (onErrorCallback) onErrorCallback(error);
    }
  }

  /**
   * Stop listening for voice input
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('🛑 Stopped listening');
    }
  }

  /**
   * Check if service is currently speaking
   * @returns {boolean}
   */
  getIsSpeaking() {
    return this.isSpeaking;
  }

  /**
   * Check if service is currently listening
   * @returns {boolean}
   */
  getIsListening() {
    return this.isListening;
  }
}

// Export for use in popup.js
// WHY: Create single instance to be shared across extension
export default VoiceService;