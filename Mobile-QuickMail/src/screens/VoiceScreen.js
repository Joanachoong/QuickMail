// Voice Screen
// Main screen for listening to emails and voice interactions

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VoiceService from '../services/VoiceService';
import GmailService from '../services/GmailService';
import { CONFIG } from '../config/constants';

export default function VoiceScreen({ route, navigation }) {
  const [summaries, setSummaries] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadSummaries();
    return () => {
      // Cleanup on unmount
      VoiceService.stopSpeaking();
      VoiceService.destroy();
    };
  }, []);

  const loadSummaries = async () => {
    try {
      // Try to get summaries from navigation params first
      const navSummaries = route.params?.summaries;

      if (navSummaries && navSummaries.length > 0) {
        setSummaries(navSummaries);
        // Auto-play when screen loads
        autoPlaySummaries(navSummaries);
      } else {
        // Load from storage
        const stored = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.SUMMARIES);
        const parsed = stored ? JSON.parse(stored) : [];
        setSummaries(parsed);

        if (parsed.length > 0) {
          autoPlaySummaries(parsed);
        } else {
          setStatus('No emails to read');
        }
      }
    } catch (error) {
      console.error('Failed to load summaries:', error);
      Alert.alert('Error', 'Failed to load email summaries');
    }
  };

  const autoPlaySummaries = async summariesArray => {
    try {
      console.log('🎬 Auto-play triggered');

      if (summariesArray.length === 0) {
        await VoiceService.speakText(
          'You have no new messages in the last 6 hours'
        );
        setStatus('No new messages');
        return;
      }

      setIsPlaying(true);
      setStatus(`Speaking ${summariesArray.length} email summaries...`);

      await VoiceService.speakSummaries(summariesArray);

      setIsPlaying(false);
      setStatus('Finished reading all emails');
    } catch (error) {
      console.error('Auto-play error:', error);
      setIsPlaying(false);
      setStatus('Could not auto-play summaries');
    }
  };

  const handlePlayPause = async () => {
    if (isPaused) {
      // Resume
      const success = await VoiceService.resumeSpeaking();
      if (success) {
        setIsPaused(false);
        setStatus('Resumed');
      }
    } else {
      // Pause
      const success = await VoiceService.pauseSpeaking();
      if (success) {
        setIsPaused(true);
        setStatus('Paused');
      }
    }
  };

  const handleStop = async () => {
    await VoiceService.stopSpeaking();
    setIsPlaying(false);
    setIsPaused(false);
    setStatus('Stopped');
  };

  const handleNext = async () => {
    const success = await VoiceService.nextEmail();
    if (success) {
      setCurrentIndex(prev => prev + 1);
      setStatus('Next email');
    }
  };

  const handlePrevious = async () => {
    const success = await VoiceService.previousEmail();
    if (success) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
      setStatus('Previous email');
    }
  };

  const handleVoiceCommand = async () => {
    try {
      setIsListening(true);
      setStatus('Listening for command...');

      await VoiceService.startListening(
        async transcript => {
          console.log('Voice command:', transcript);
          setStatus(`Command: "${transcript}"`);

          // Process the command
          const command = await VoiceService.processVoiceCommand(transcript);

          if (command === 'reply') {
            startReplyMode();
          }

          setIsListening(false);
        },
        error => {
          console.error('Voice command error:', error);
          setStatus('Voice command failed');
          setIsListening(false);
        }
      );

      // Auto-stop listening after 5 seconds
      setTimeout(async () => {
        if (isListening) {
          await VoiceService.stopListening();
          setIsListening(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to start voice command:', error);
      setIsListening(false);
    }
  };

  const startReplyMode = async () => {
    try {
      setReplyMode(true);
      setStatus('Reply mode: Speak your message...');

      // Stop current speech
      await VoiceService.stopSpeaking();

      // Start listening for reply
      await VoiceService.startListening(
        async transcript => {
          console.log('Reply message:', transcript);
          setReplyText(transcript);
          setStatus('Confirming reply...');

          // Read back confirmation
          await VoiceService.speakText(
            `You said: ${transcript}. Say "send" to send, or "cancel" to cancel.`
          );

          // Listen for confirmation
          await confirmReply(transcript);
        },
        error => {
          console.error('Reply recording error:', error);
          setStatus('Failed to record reply');
          setReplyMode(false);
        }
      );

      // Auto-stop listening after 10 seconds
      setTimeout(async () => {
        if (replyMode) {
          await VoiceService.stopListening();
        }
      }, 10000);
    } catch (error) {
      console.error('Failed to start reply mode:', error);
      setReplyMode(false);
    }
  };

  const confirmReply = async replyMessage => {
    try {
      await VoiceService.startListening(
        async transcript => {
          const response = transcript.toLowerCase();

          if (response.includes('send')) {
            await sendReply(replyMessage);
          } else if (response.includes('cancel')) {
            setStatus('Reply cancelled');
            setReplyMode(false);
            setReplyText('');
            await VoiceService.speakText('Reply cancelled');
          } else {
            setStatus('Say "send" or "cancel"');
            await VoiceService.speakText('Say "send" or "cancel"');
          }
        },
        error => {
          console.error('Confirmation error:', error);
          setReplyMode(false);
        }
      );

      setTimeout(async () => {
        await VoiceService.stopListening();
      }, 5000);
    } catch (error) {
      console.error('Failed to confirm reply:', error);
      setReplyMode(false);
    }
  };

  const sendReply = async message => {
    try {
      setStatus('Sending reply...');

      // Get current email to reply to
      const currentEmail = summaries[currentIndex];

      if (!currentEmail) {
        throw new Error('No email selected');
      }

      // Send reply
      const result = await GmailService.sendEmail(
        currentEmail.sender,
        `Re: ${currentEmail.subject}`,
        message,
        currentEmail.threadId
      );

      if (result.success) {
        setStatus('Reply sent!');
        await VoiceService.speakText('Your reply has been sent');
      } else {
        throw new Error(result.error);
      }

      setReplyMode(false);
      setReplyText('');
    } catch (error) {
      console.error('Failed to send reply:', error);
      setStatus('Failed to send reply');
      await VoiceService.speakText('Failed to send reply');
      setReplyMode(false);
    }
  };

  const handleRefresh = () => {
    navigation.replace('Loading');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>QuickMail Voice</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
        {summaries.length > 0 && (
          <Text style={styles.emailCount}>
            Email {currentIndex + 1} of {summaries.length}
          </Text>
        )}
      </View>

      {/* Current Email Display */}
      {summaries.length > 0 && summaries[currentIndex] && (
        <View style={styles.emailCard}>
          <Text style={styles.emailSender}>
            From: {summaries[currentIndex].sender}
          </Text>
          <Text style={styles.emailSubject}>
            {summaries[currentIndex].subject}
          </Text>
          <ScrollView style={styles.summaryScroll}>
            <Text style={styles.emailSummary}>
              {summaries[currentIndex].summary}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Playback Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.playbackControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Text style={styles.controlButtonText}>⏮️ Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={handlePlayPause}
          >
            <Text style={styles.controlButtonText}>
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleStop}>
            <Text style={styles.controlButtonText}>⏹️ Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleNext}
            disabled={currentIndex >= summaries.length - 1}
          >
            <Text style={styles.controlButtonText}>Next ⏭️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice Controls */}
      <View style={styles.voiceControls}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isListening && styles.voiceButtonActive,
          ]}
          onPress={handleVoiceCommand}
          disabled={isListening}
        >
          {isListening ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.voiceButtonText}>🎤 Voice Command</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.replyButton,
            replyMode && styles.replyButtonActive,
          ]}
          onPress={startReplyMode}
          disabled={replyMode || summaries.length === 0}
        >
          {replyMode ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.voiceButtonText}>💬 Voice Reply</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reply mode indicator */}
      {replyMode && (
        <View style={styles.replyModeContainer}>
          <Text style={styles.replyModeText}>🎤 Recording reply...</Text>
          {replyText && (
            <Text style={styles.replyPreview}>"{replyText}"</Text>
          )}
        </View>
      )}

      {/* Help text */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          Voice commands: "Next", "Previous", "Stop", "Pause", "Resume", "Reply"
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1a73e8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshText: {
    fontSize: 16,
    color: '#fff',
  },
  statusContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emailCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  emailCard: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 300,
  },
  emailSender: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  emailSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryScroll: {
    maxHeight: 200,
  },
  emailSummary: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  controlsContainer: {
    padding: 15,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  controlButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1a73e8',
  },
  controlButtonText: {
    fontSize: 14,
    color: '#333',
  },
  voiceControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  voiceButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#2e7d32',
  },
  replyButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  replyButtonActive: {
    backgroundColor: '#e65100',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  replyModeContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  replyModeText: {
    fontSize: 16,
    color: '#856404',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  replyPreview: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  helpContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
