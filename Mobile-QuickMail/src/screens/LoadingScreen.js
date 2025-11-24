// Loading Screen
// Fetches emails, summarizes them with AI, and navigates to voice screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GmailService from '../services/GmailService';
import GeminiService from '../services/GeminiService';
import { transformEmailForStorage } from '../utils/emailProcessor';
import { CONFIG } from '../config/constants';

export default function LoadingScreen({ navigation }) {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    processEmails();
  }, []);

  const processEmails = async () => {
    try {
      // Step 1: Check authentication
      setStatus('Checking authentication...');
      setProgress(10);

      // Step 2: Fetch emails from Gmail
      setStatus('Fetching emails from Gmail...');
      setProgress(30);

      const emails = await GmailService.fetchAllEmails();

      console.log('Fetched emails:', emails.length);

      // Handle no emails
      if (emails.length === 0) {
        setProgress(100);
        setStatus('No emails in the last 6 hours');

        // Store empty summaries
        await AsyncStorage.setItem(
          CONFIG.STORAGE_KEYS.SUMMARIES,
          JSON.stringify([])
        );

        // Navigate to voice screen after delay
        setTimeout(() => {
          navigation.replace('Voice');
        }, 1500);
        return;
      }

      // Step 3: Summarize emails with Gemini AI
      setStatus(`Summarizing ${emails.length} emails with AI...`);
      setProgress(50);

      const summarizedEmails = await GeminiService.summarizeBatch(
        emails,
        progress => {
          // Update progress (50-90%)
          const adjustedProgress = 50 + Math.floor(progress * 0.4);
          setProgress(adjustedProgress);
          setStatus(
            `Summarizing ${emails.length} emails... ${progress}%`
          );
        }
      );

      // Step 4: Transform and store summaries
      setStatus('Saving summaries...');
      setProgress(95);

      const transformedSummaries = summarizedEmails.map(email =>
        transformEmailForStorage(email, email.summary)
      );

      await AsyncStorage.setItem(
        CONFIG.STORAGE_KEYS.SUMMARIES,
        JSON.stringify(transformedSummaries)
      );

      await AsyncStorage.setItem(
        CONFIG.STORAGE_KEYS.LAST_UPDATED,
        new Date().toISOString()
      );

      setProgress(100);
      setStatus(`✅ Successfully processed ${transformedSummaries.length} emails!`);

      // Wait 1 second then navigate to voice screen
      setTimeout(() => {
        navigation.replace('Voice', { summaries: transformedSummaries });
      }, 1000);
    } catch (error) {
      console.error('Error processing emails:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to process emails. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => processEmails(),
          },
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1a73e8" />
      <Text style={styles.status}>{status}</Text>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[styles.progressBar, { width: `${progress}%` }]}
        />
      </View>
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  status: {
    fontSize: 16,
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1a73e8',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
});
