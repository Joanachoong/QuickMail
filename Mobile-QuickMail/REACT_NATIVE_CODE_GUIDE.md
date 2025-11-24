# React Native Code Guide - QuickMail Mobile

This document shows all the React Native patterns and mobile-ready code used in the QuickMail mobile app.

## 📱 React Native Architecture

### Component Structure

All screens follow React functional component pattern with hooks:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ScreenName({ route, navigation }) {
  // State management with useState
  const [state, setState] = useState(initialValue);

  // Side effects with useEffect
  useEffect(() => {
    // Component mount logic
    loadData();

    return () => {
      // Cleanup on unmount
      cleanup();
    };
  }, []); // Empty dependency array = run once on mount

  // Event handlers
  const handleAction = async () => {
    // Async operations
  };

  // Render
  return (
    <View>
      <Text>Content</Text>
      <TouchableOpacity onPress={handleAction}>
        <Text>Button</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## 🎨 Screen Components

### 1. LoginScreen.js - React Hooks Pattern

```javascript
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
  // State hooks
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Event handler
  const handleLogin = async () => {
    try {
      setLoading(true);
      setStatus('Starting authentication...');

      const result = await AuthService.authenticate();

      if (result.success) {
        setStatus('Authentication successful!');
        navigation.replace('Loading'); // Navigate to next screen
      } else {
        Alert.alert('Authentication Failed', result.error);
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
      <Text style={styles.title}>QuickMail</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  // ... more styles
});
```

**Key React Native Features:**
- ✅ Functional component with hooks
- ✅ `useState` for state management
- ✅ Async/await for API calls
- ✅ Conditional rendering (`{condition ? <A /> : <B />}`)
- ✅ Event handlers (`onPress`)
- ✅ StyleSheet for styling

### 2. LoadingScreen.js - useEffect Pattern

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import GmailService from '../services/GmailService';
import GeminiService from '../services/GeminiService';

export default function LoadingScreen({ navigation }) {
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  // Run on component mount
  useEffect(() => {
    processEmails();
  }, []); // Empty array = run once on mount

  const processEmails = async () => {
    try {
      setStatus('Fetching emails from Gmail...');
      setProgress(30);

      const emails = await GmailService.fetchAllEmails();

      setStatus(`Summarizing ${emails.length} emails with AI...`);
      setProgress(50);

      const summarizedEmails = await GeminiService.summarizeBatch(
        emails,
        progress => {
          // Progress callback
          const adjustedProgress = 50 + Math.floor(progress * 0.4);
          setProgress(adjustedProgress);
          setStatus(`Summarizing... ${progress}%`);
        }
      );

      setProgress(100);
      setStatus('✅ Complete!');

      // Navigate to next screen
      setTimeout(() => {
        navigation.replace('Voice', { summaries: summarizedEmails });
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      // Error handling
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1a73e8" />
      <Text>{status}</Text>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text>{progress}%</Text>
    </View>
  );
}
```

**Key React Native Features:**
- ✅ `useEffect` for lifecycle methods
- ✅ Progress tracking with state
- ✅ Dynamic styles (width based on progress)
- ✅ Navigation with params
- ✅ Error handling with try/catch

### 3. VoiceScreen.js - Complex State Management

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VoiceService from '../services/VoiceService';

export default function VoiceScreen({ route, navigation }) {
  // Multiple state hooks
  const [summaries, setSummaries] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');

  // Load data on mount + cleanup on unmount
  useEffect(() => {
    loadSummaries();

    return () => {
      // Cleanup function
      VoiceService.stopSpeaking();
      VoiceService.destroy();
    };
  }, []);

  const loadSummaries = async () => {
    try {
      // Get from navigation params
      const navSummaries = route.params?.summaries;

      if (navSummaries && navSummaries.length > 0) {
        setSummaries(navSummaries);
        autoPlaySummaries(navSummaries);
      } else {
        // Load from AsyncStorage
        const stored = await AsyncStorage.getItem('summaries');
        const parsed = stored ? JSON.parse(stored) : [];
        setSummaries(parsed);

        if (parsed.length > 0) {
          autoPlaySummaries(parsed);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load summaries');
    }
  };

  const handlePlayPause = async () => {
    if (isPaused) {
      const success = await VoiceService.resumeSpeaking();
      if (success) {
        setIsPaused(false);
        setStatus('Resumed');
      }
    } else {
      const success = await VoiceService.pauseSpeaking();
      if (success) {
        setIsPaused(true);
        setStatus('Paused');
      }
    }
  };

  const handleVoiceCommand = async () => {
    try {
      setIsListening(true);
      setStatus('Listening...');

      await VoiceService.startListening(
        async transcript => {
          setStatus(`Command: "${transcript}"`);
          await VoiceService.processVoiceCommand(transcript);
          setIsListening(false);
        },
        error => {
          setStatus('Voice command failed');
          setIsListening(false);
        }
      );
    } catch (error) {
      setIsListening(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Email display */}
      {summaries.length > 0 && summaries[currentIndex] && (
        <View style={styles.emailCard}>
          <Text style={styles.sender}>
            From: {summaries[currentIndex].sender}
          </Text>
          <Text style={styles.subject}>
            {summaries[currentIndex].subject}
          </Text>
          <ScrollView>
            <Text>{summaries[currentIndex].summary}</Text>
          </ScrollView>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePlayPause}
        >
          <Text>{isPaused ? '▶️ Resume' : '⏸️ Pause'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.active]}
          onPress={handleVoiceCommand}
          disabled={isListening}
        >
          <Text>🎤 Voice Command</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

**Key React Native Features:**
- ✅ Multiple `useState` hooks
- ✅ `useEffect` with cleanup function
- ✅ Conditional rendering with `&&`
- ✅ Array state management
- ✅ AsyncStorage for persistence
- ✅ ScrollView for long content
- ✅ Disabled state for buttons

## 🔧 Service Classes (JavaScript)

### Pattern: Singleton Services

```javascript
// VoiceService.js
class VoiceService {
  constructor() {
    this.isSpeaking = false;
    this.isPaused = false;
  }

  async speakText(text) {
    try {
      this.isSpeaking = true;
      await Speech.speak(text);
      return true;
    } catch (error) {
      console.error('Speech failed:', error);
      return false;
    }
  }

  async startListening(onResult, onError) {
    try {
      Voice.onSpeechResults = e => {
        const transcript = e.value[0];
        if (onResult) onResult(transcript);
      };

      await Voice.start('en-US');
      this.isListening = true;
      return true;
    } catch (error) {
      if (onError) onError(error);
      return false;
    }
  }
}

// Export singleton instance
export default new VoiceService();
```

**Usage in Components:**

```javascript
import VoiceService from '../services/VoiceService';

// In component
const handleSpeak = async () => {
  await VoiceService.speakText('Hello world');
};
```

## 📦 Mobile API Replacements

### 1. Base64 Encoding

```javascript
// ❌ Browser (won't work)
const decoded = atob(base64);
const encoded = btoa(text);

// ✅ React Native
import Base64 from 'react-native-base64';

const decoded = Base64.decode(base64);
const encoded = Base64.encode(text);
```

**Implementation:**

```javascript
// src/utils/emailProcessor.js
import Base64 from 'react-native-base64';

export function decodeBase64(base64String) {
  try {
    const base64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Base64.decode(base64); // Mobile-friendly
    return decoded;
  } catch (error) {
    console.error('Failed to decode:', error);
    return '';
  }
}
```

### 2. OAuth 2.0 Authentication

```javascript
// ❌ Chrome Extension
chrome.identity.getAuthToken({ interactive: true }, callback);

// ✅ React Native with Expo
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const request = new AuthSession.AuthRequest({
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: AuthSession.makeRedirectUri(),
  scopes: ['gmail.readonly', 'gmail.send'],
  responseType: AuthSession.ResponseType.Token,
});

const result = await request.promptAsync(discovery);

if (result.type === 'success') {
  const { access_token } = result.params;
  // Use token
}
```

### 3. Text-to-Speech

```javascript
// ❌ Browser
const utterance = new SpeechSynthesisUtterance(text);
window.speechSynthesis.speak(utterance);

// ✅ React Native with Expo
import * as Speech from 'expo-speech';

await Speech.speak(text, {
  language: 'en-US',
  pitch: 1.0,
  rate: 1.0,
  onDone: () => console.log('Finished'),
  onError: error => console.error(error),
});

// Pause/Resume/Stop
await Speech.pause();
await Speech.resume();
await Speech.stop();
```

### 4. Speech-to-Text

```javascript
// ❌ Browser
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.start();

recognition.onresult = event => {
  const transcript = event.results[0][0].transcript;
  console.log(transcript);
};

// ✅ React Native
import Voice from '@react-native-voice/voice';

// Setup
Voice.onSpeechResults = e => {
  const transcript = e.value[0];
  console.log(transcript);
};

// Start listening
await Voice.start('en-US');

// Stop listening
await Voice.stop();

// Cleanup
await Voice.destroy();
```

### 5. Local Storage

```javascript
// ❌ Chrome Extension
chrome.storage.local.set({ key: value });
chrome.storage.local.get('key', result => {
  console.log(result.key);
});

// ✅ React Native
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store
await AsyncStorage.setItem('key', JSON.stringify(value));

// Retrieve
const value = await AsyncStorage.getItem('key');
const parsed = JSON.parse(value);

// Remove
await AsyncStorage.removeItem('key');
```

## 🎯 React Native Best Practices Used

### 1. Functional Components
✅ All components use functions, not classes

```javascript
// ✅ Good
export default function MyComponent() {
  return <View />;
}

// ❌ Avoid
export default class MyComponent extends React.Component {
  render() {
    return <View />;
  }
}
```

### 2. Hooks for State
✅ Use useState, useEffect

```javascript
const [value, setValue] = useState(initial);

useEffect(() => {
  // Side effect
  return () => cleanup();
}, [dependencies]);
```

### 3. StyleSheet
✅ Define styles with StyleSheet.create()

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
```

### 4. Async/Await
✅ Use async/await for asynchronous operations

```javascript
const handleAction = async () => {
  try {
    const result = await asyncFunction();
    setData(result);
  } catch (error) {
    console.error(error);
  }
};
```

### 5. Conditional Rendering
✅ Use ternary or &&

```javascript
{loading ? <ActivityIndicator /> : <Content />}
{hasData && <DataDisplay data={data} />}
```

## 📱 Component Tree

```
App.js (NavigationContainer)
├── LoginScreen
│   └── AuthService.authenticate()
├── LoadingScreen
│   ├── GmailService.fetchAllEmails()
│   └── GeminiService.summarizeBatch()
└── VoiceScreen
    ├── VoiceService (TTS/STT)
    └── GmailService.sendEmail()
```

## 🔄 Data Flow

```
User Action (Button Press)
    ↓
Event Handler (handleAction)
    ↓
Service Call (await Service.method())
    ↓
State Update (setState())
    ↓
Re-render (React automatically)
    ↓
UI Update (new UI displayed)
```

## 🎨 Styling Patterns

```javascript
// Inline styles (avoid for complex styles)
<View style={{ flex: 1, padding: 20 }} />

// StyleSheet (recommended)
<View style={styles.container} />

// Conditional styles
<View style={[styles.button, isActive && styles.active]} />

// Dynamic styles
<View style={[styles.bar, { width: `${progress}%` }]} />
```

## 📝 Summary

This QuickMail mobile app uses:

✅ **React Patterns**
- Functional components
- React Hooks (useState, useEffect)
- Props and navigation params
- Conditional rendering

✅ **React Native APIs**
- Core components (View, Text, TouchableOpacity, etc.)
- StyleSheet for styling
- AsyncStorage for persistence
- Navigation between screens

✅ **Mobile Libraries**
- Expo Speech (TTS)
- React Native Voice (STT)
- Expo Auth Session (OAuth)
- React Native Base64 (encoding)

✅ **Modern JavaScript**
- ES6+ syntax
- Async/await
- Arrow functions
- Destructuring
- Template literals

All code is production-ready for iOS and Android! 🚀
