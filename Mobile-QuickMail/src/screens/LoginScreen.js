// Login Screen
// OAuth 2.0 authentication with Google

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AuthService from '../services/AuthService';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setStatus('Starting authentication...');

      const result = await AuthService.authenticate();

      if (result.success) {
        setStatus('Authentication successful!');
        // Navigate to loading screen to fetch emails
        navigation.replace('Loading');
      } else {
        Alert.alert('Authentication Failed', result.error || 'Please try again');
        setStatus('');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>QuickMail</Text>
        <Text style={styles.subtitle}>Voice-powered email assistant</Text>

        <View style={styles.featuresContainer}>
          <Text style={styles.featureText}>✅ Listen to email summaries</Text>
          <Text style={styles.featureText}>🎤 Reply with your voice</Text>
          <Text style={styles.featureText}>🗣️ Navigate hands-free</Text>
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          We'll access your Gmail to read and send emails on your behalf
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  featuresContainer: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: '#1a73e8',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 250,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    maxWidth: 300,
  },
});
