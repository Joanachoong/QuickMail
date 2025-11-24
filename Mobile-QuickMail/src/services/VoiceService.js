// Voice Service for Mobile
// Handles Text-to-Speech (TTS) and Speech-to-Text (STT)
// Ported from voice.js Chrome extension

import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { CONFIG } from '../config/constants';
import { formatEmailForSpeech } from '../utils/emailProcessor';
import { delay } from '../utils/helpers';

class VoiceService {
  constructor() {
    // TTS state
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentEmailIndex = 0;
    this.summaries = [];

    // STT state
    this.isListening = false;
    this.recognizedText = '';

    // Initialize Voice (STT)
    this.initializeSTT();
  }

  // ===================
  // TEXT-TO-SPEECH (TTS) METHODS
  // ===================

  /**
   * Speak a single text string
   */
  async speakText(text, options = {}) {
    try {
      console.log(`🔊 Speaking: ${text.substring(0, 50)}...`);

      this.isSpeaking = true;

      await Speech.speak(text, {
        language: options.language || CONFIG.VOICE_LANGUAGE,
        pitch: options.pitch || CONFIG.VOICE_PITCH,
        rate: options.rate || CONFIG.VOICE_RATE,
        onDone: () => {
          console.log('✅ Finished speaking');
          this.isSpeaking = false;
          if (options.onEnd) options.onEnd();
        },
        onStopped: () => {
          console.log('🛑 Speech stopped');
          this.isSpeaking = false;
          if (options.onStopped) options.onStopped();
        },
        onError: error => {
          console.error('❌ Speech error:', error);
          this.isSpeaking = false;
          if (options.onError) options.onError(error);
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to speak:', error);
      this.isSpeaking = false;
      return false;
    }
  }

  /**
   * Speak multiple email summaries
   * This is the main function for reading emails
   */
  async speakSummaries(summariesArray, startIndex = 0) {
    try {
      if (!summariesArray || summariesArray.length === 0) {
        console.warn('⚠️ No summaries to speak');
        await this.speakText('You have no new messages in the last 6 hours');
        return;
      }

      console.log(`📧 Speaking ${summariesArray.length} email summaries`);

      this.summaries = summariesArray;
      this.currentEmailIndex = startIndex;
      this.isSpeaking = true;

      // Speak each email one by one
      for (let i = startIndex; i < summariesArray.length; i++) {
        this.currentEmailIndex = i;
        const email = summariesArray[i];

        // Format email for speech
        const spokenText = formatEmailForSpeech(
          email,
          i + 1,
          summariesArray.length
        );

        // Speak this email
        await new Promise((resolve, reject) => {
          Speech.speak(spokenText, {
            language: CONFIG.VOICE_LANGUAGE,
            pitch: CONFIG.VOICE_PITCH,
            rate: CONFIG.VOICE_RATE,
            onDone: resolve,
            onStopped: resolve,
            onError: reject,
          });
        });

        // Add pause between emails
        if (i < summariesArray.length - 1) {
          await delay(CONFIG.PAUSE_BETWEEN_EMAILS_MS);
        }
      }

      console.log('✅ Finished speaking all summaries');
      this.isSpeaking = false;
      this.currentEmailIndex = 0;
    } catch (error) {
      console.error('Error speaking summaries:', error);
      this.isSpeaking = false;
    }
  }

  /**
   * Pause current speech
   */
  async pauseSpeaking() {
    try {
      await Speech.pause();
      this.isPaused = true;
      console.log('⏸️ Speech paused');
      return true;
    } catch (error) {
      console.error('Failed to pause:', error);
      return false;
    }
  }

  /**
   * Resume paused speech
   */
  async resumeSpeaking() {
    try {
      await Speech.resume();
      this.isPaused = false;
      console.log('▶️ Speech resumed');
      return true;
    } catch (error) {
      console.error('Failed to resume:', error);
      return false;
    }
  }

  /**
   * Stop all speech immediately
   */
  async stopSpeaking() {
    try {
      await Speech.stop();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentEmailIndex = 0;
      console.log('🛑 Speech stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop:', error);
      return false;
    }
  }

  /**
   * Navigate to next email
   */
  async nextEmail() {
    if (this.currentEmailIndex < this.summaries.length - 1) {
      await this.stopSpeaking();
      await this.speakSummaries(this.summaries, this.currentEmailIndex + 1);
      return true;
    } else {
      await this.speakText('No more emails');
      return false;
    }
  }

  /**
   * Navigate to previous email
   */
  async previousEmail() {
    if (this.currentEmailIndex > 0) {
      await this.stopSpeaking();
      await this.speakSummaries(this.summaries, this.currentEmailIndex - 1);
      return true;
    } else {
      await this.speakText('This is the first email');
      return false;
    }
  }

  // ===================
  // SPEECH-TO-TEXT (STT) METHODS
  // ===================

  /**
   * Initialize Speech Recognition
   */
  initializeSTT() {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  onSpeechStart(e) {
    console.log('🎤 Speech recognition started');
    this.isListening = true;
  }

  onSpeechEnd(e) {
    console.log('🎤 Speech recognition ended');
    this.isListening = false;
  }

  onSpeechResults(e) {
    console.log('🎤 Speech results:', e.value);
    this.recognizedText = e.value[0];
  }

  onSpeechError(e) {
    console.error('❌ Speech recognition error:', e.error);
    this.isListening = false;
  }

  /**
   * Start listening for voice input
   */
  async startListening(onResult, onError) {
    try {
      this.recognizedText = '';

      // Set up result callback
      Voice.onSpeechResults = e => {
        const transcript = e.value[0];
        console.log('🎤 Recognized:', transcript);
        this.recognizedText = transcript;
        if (onResult) onResult(transcript);
      };

      // Set up error callback
      Voice.onSpeechError = e => {
        console.error('❌ Recognition error:', e.error);
        if (onError) onError(e.error);
      };

      await Voice.start(CONFIG.VOICE_LANGUAGE);
      this.isListening = true;
      console.log('🎤 Started listening...');

      return true;
    } catch (error) {
      console.error('Failed to start listening:', error);
      if (onError) onError(error);
      return false;
    }
  }

  /**
   * Stop listening
   */
  async stopListening() {
    try {
      await Voice.stop();
      this.isListening = false;
      console.log('🛑 Stopped listening');
      return this.recognizedText;
    } catch (error) {
      console.error('Failed to stop listening:', error);
      return null;
    }
  }

  /**
   * Destroy voice recognition (cleanup)
   */
  async destroy() {
    try {
      await Voice.destroy();
      Voice.removeAllListeners();
      console.log('🗑️ Voice service destroyed');
    } catch (error) {
      console.error('Failed to destroy voice service:', error);
    }
  }

  // ===================
  // VOICE COMMANDS
  // ===================

  /**
   * Process voice command
   * Recognizes: "next", "previous", "stop", "pause", "resume", "reply"
   */
  async processVoiceCommand(command) {
    const cmd = command.toLowerCase().trim();

    console.log('🎤 Processing command:', cmd);

    if (cmd.includes('next')) {
      await this.nextEmail();
      return 'next';
    } else if (cmd.includes('previous') || cmd.includes('back')) {
      await this.previousEmail();
      return 'previous';
    } else if (cmd.includes('stop')) {
      await this.stopSpeaking();
      await this.speakText('Stopped');
      return 'stop';
    } else if (cmd.includes('pause')) {
      await this.pauseSpeaking();
      return 'pause';
    } else if (cmd.includes('resume') || cmd.includes('play')) {
      await this.resumeSpeaking();
      return 'resume';
    } else if (cmd.includes('reply')) {
      return 'reply';
    } else {
      await this.speakText('Command not recognized');
      return 'unknown';
    }
  }

  // ===================
  // STATE GETTERS
  // ===================

  getIsSpeaking() {
    return this.isSpeaking;
  }

  getIsPaused() {
    return this.isPaused;
  }

  getIsListening() {
    return this.isListening;
  }

  getCurrentEmailIndex() {
    return this.currentEmailIndex;
  }
}

export default new VoiceService();
