# QuickMail Mobile - Quick Start Guide

This guide will help you run the app in **5 minutes** on your phone.

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Dependencies (1 min)

```bash
cd Mobile-QuickMail
npm install
```

### Step 2: Get API Keys (3 mins)

#### Gmail API (OAuth Client ID)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project → Enable "Gmail API"
3. Create Credentials → OAuth 2.0 Client ID → **Web Application**
4. Copy your **Client ID**

#### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your **API Key**

### Step 3: Configure App (1 min)

Open `src/config/constants.js` and paste your keys:

```javascript
export const CONFIG = {
  // PASTE HERE:
  GOOGLE_CLIENT_ID: 'your-client-id.apps.googleusercontent.com',
  GEMINI_API_KEY: 'AIzaSy...',

  // Keep the rest as is
  GMAIL_API_BASE_URL: 'https://gmail.googleapis.com/gmail/v1',
  // ...
};
```

### Step 4: Run App (30 seconds)

```bash
npm start
```

Then:
- **iOS**: Open Camera → Scan QR code
- **Android**: Open Expo Go app → Scan QR code

## 📱 Using the App

### First Time
1. Tap "Sign in with Google"
2. Login and grant permissions
3. Wait for emails to load (automatic)
4. App will start reading your emails!

### Voice Controls
- **Pause/Resume**: Tap pause button
- **Next/Previous**: Use navigation buttons
- **Voice Command**: Tap mic button, say "Next", "Previous", "Stop", or "Reply"
- **Voice Reply**: Tap "Voice Reply" → Speak → Say "Send" or "Cancel"

## 🔧 Troubleshooting

### OAuth Error
- Check Client ID in `constants.js`
- Verify Gmail API is enabled
- Add redirect URI in Google Console:
  ```
  https://auth.expo.io/@YOUR_EXPO_USERNAME/quickmail-mobile
  ```

### No Emails Loading
- Default: last 6 hours
- Change `EMAIL_TIME_RANGE_HOURS` in constants.js

### Voice Not Working
- Grant microphone permissions when prompted
- Speak clearly and slowly
- Check device volume

## 📦 What's Included

All React Native mobile-ready code:

✅ **Screens** (React Components with Hooks)
- `LoginScreen.js` - OAuth authentication
- `LoadingScreen.js` - Email fetching with progress
- `VoiceScreen.js` - Voice controls UI

✅ **Services** (Mobile APIs)
- `AuthService.js` - OAuth 2.0 (expo-auth-session)
- `GmailService.js` - Gmail API calls
- `GeminiService.js` - AI summarization
- `VoiceService.js` - TTS & STT for mobile

✅ **Utilities**
- `emailProcessor.js` - Email parsing (Base64 for React Native)
- `helpers.js` - Helper functions

✅ **Configuration**
- `constants.js` - All settings in one place

## 🎯 Key React Native Features Used

### React Hooks
```javascript
// All screens use modern React hooks
import React, { useState, useEffect } from 'react';

function VoiceScreen() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  // ...
}
```

### React Native Components
```javascript
import {
  View,          // Container
  Text,          // Text display
  TouchableOpacity,  // Buttons
  ScrollView,    // Scrollable content
  ActivityIndicator, // Loading spinner
  Alert,         // Dialogs
} from 'react-native';
```

### Navigation
```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Navigate between screens
navigation.replace('Voice');
navigation.goBack();
```

### Async Storage
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data
await AsyncStorage.setItem('summaries', JSON.stringify(data));

// Retrieve data
const data = await AsyncStorage.getItem('summaries');
```

### Voice Features
```javascript
// Text-to-Speech
import * as Speech from 'expo-speech';
await Speech.speak(text);

// Speech-to-Text
import Voice from '@react-native-voice/voice';
await Voice.start('en-US');
```

## 🔄 Mobile-Specific Adaptations

### 1. Base64 Encoding (Browser → React Native)
```javascript
// ❌ Browser (doesn't work in React Native)
const decoded = atob(base64);
const encoded = btoa(text);

// ✅ React Native
import Base64 from 'react-native-base64';
const decoded = Base64.decode(base64);
const encoded = Base64.encode(text);
```

### 2. OAuth (Chrome Identity → expo-auth-session)
```javascript
// ❌ Chrome Extension
chrome.identity.getAuthToken({ interactive: true }, callback);

// ✅ React Native
import * as AuthSession from 'expo-auth-session';
const result = await request.promptAsync(discovery);
```

### 3. TTS (Web Speech API → Expo Speech)
```javascript
// ❌ Browser
const utterance = new SpeechSynthesisUtterance(text);
window.speechSynthesis.speak(utterance);

// ✅ React Native
import * as Speech from 'expo-speech';
await Speech.speak(text, { rate: 1.0, pitch: 1.0 });
```

### 4. STT (WebKit → React Native Voice)
```javascript
// ❌ Browser
const recognition = new webkitSpeechRecognition();
recognition.start();

// ✅ React Native
import Voice from '@react-native-voice/voice';
await Voice.start('en-US');
```

## 📚 Dependencies Reference

```json
{
  "expo": "React Native framework",
  "@react-navigation/native": "Navigation between screens",
  "expo-auth-session": "OAuth 2.0 authentication",
  "expo-speech": "Text-to-Speech",
  "@react-native-voice/voice": "Speech-to-Text",
  "@react-native-async-storage/async-storage": "Local storage",
  "react-native-base64": "Base64 encode/decode",
  "axios": "HTTP requests (optional)"
}
```

## 🚀 Next Steps

1. ✅ Run the app with `npm start`
2. ✅ Test all features
3. ✅ Customize voice settings in `constants.js`
4. 📦 Build standalone app: `expo build:android` or `expo build:ios`

---

**Ready to code?** All components use React hooks, React Native APIs, and mobile-friendly libraries. The code is production-ready for iOS and Android! 📱

For detailed API setup, see `SETUP_GUIDE.md`
