# QuickMail - Mobile App

A voice-powered email assistant for mobile devices built with React Native and Expo. This app lets you listen to your emails, reply with your voice, and navigate hands-free.

## 🎯 Core Features

### ✅ 1. Listen to Emails
- Fetch recent emails from Gmail
- AI-powered email summarization using Gemini
- Text-to-Speech (TTS) reading with auto-play
- Pause/resume controls

### 🎤 2. Voice Reply
- Trigger reply with voice command
- Record reply via Speech-to-Text
- Read back confirmation before sending
- Send via Gmail API

### 🗣️ 3. Navigation
- "Next email" command
- "Previous email" command
- "Stop" / "Pause" / "Resume" commands
- Fully hands-free control

## 📱 Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Authentication**: OAuth 2.0 (expo-auth-session)
- **AI Summarization**: Google Gemini API
- **Email API**: Gmail API
- **Text-to-Speech**: Expo Speech
- **Speech-to-Text**: @react-native-voice/voice
- **Storage**: AsyncStorage

## 🚀 Setup Instructions

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Expo CLI**: `npm install -g expo-cli`
3. **Expo Go app** on your mobile device (for testing)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 1: Clone and Install

```bash
cd Mobile-QuickMail
npm install
```

### Step 2: Set Up Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose application type:
     - For testing: **Web application** or **iOS/Android**
     - For production: **iOS** and/or **Android**

5. Configure OAuth consent screen:
   - Add required scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`

6. Add authorized redirect URIs:
   - For Expo development: `https://auth.expo.io/@your-username/quickmail-mobile`
   - For custom scheme: `quickmail://callback`

7. Copy your **Client ID** and **Client Secret** (if applicable)

### Step 3: Set Up Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API key" or "Create API key"
3. Copy your **Gemini API Key**

### Step 4: Configure the App

Open `src/config/constants.js` and update the following:

```javascript
export const CONFIG = {
  // Replace with your Google OAuth Client ID
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // Replace with your Gemini API key
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',

  // Update redirect URI if needed
  OAUTH_REDIRECT_URI: 'quickmail://callback',

  // Other settings can remain as default
};
```

### Step 5: Run the App

#### Development Mode (Expo Go)

```bash
npm start
```

Then scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

#### iOS Simulator

```bash
npm run ios
```

#### Android Emulator

```bash
npm run android
```

## 🔧 Project Structure

```
Mobile-QuickMail/
├── App.js                      # Main app entry with navigation
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js      # OAuth authentication
│   │   ├── LoadingScreen.js    # Email fetching & summarization
│   │   └── VoiceScreen.js      # Main voice interface
│   ├── services/
│   │   ├── AuthService.js      # OAuth 2.0 authentication
│   │   ├── GmailService.js     # Gmail API calls
│   │   ├── GeminiService.js    # AI summarization
│   │   └── VoiceService.js     # TTS & STT
│   ├── utils/
│   │   ├── emailProcessor.js   # Email parsing utilities
│   │   └── helpers.js          # Helper functions
│   └── config/
│       └── constants.js        # Configuration & API keys
├── package.json
└── README.md
```

## 🎮 How to Use

### First Time Setup

1. Launch the app
2. Tap "Sign in with Google"
3. Authorize Gmail access
4. Wait for emails to load and summarize

### Listening to Emails

- The app will automatically start reading your emails when loaded
- Use **Pause** button to pause
- Use **Resume** button to continue
- Use **Stop** button to stop completely
- Use **Next/Previous** buttons to navigate

### Voice Commands

1. Tap the "🎤 Voice Command" button
2. Say one of the following:
   - **"Next"** - Skip to next email
   - **"Previous"** or **"Back"** - Go to previous email
   - **"Pause"** - Pause reading
   - **"Resume"** or **"Play"** - Resume reading
   - **"Stop"** - Stop reading
   - **"Reply"** - Start voice reply mode

### Voice Reply

1. Tap "💬 Voice Reply" or say "Reply"
2. Speak your message
3. The app will read back your message
4. Say "Send" to send, or "Cancel" to cancel

## 🔒 Permissions Required

### iOS
- **Microphone**: For voice commands and voice replies
- **Speech Recognition**: For converting speech to text

### Android
- **RECORD_AUDIO**: For voice commands and voice replies

## 🐛 Troubleshooting

### OAuth Authentication Fails

- Verify your Client ID in `constants.js`
- Check that redirect URI matches in Google Cloud Console
- Ensure Gmail API is enabled
- Check OAuth consent screen configuration

### No Emails Showing

- App fetches emails from the last 6 hours by default
- Check `EMAIL_TIME_RANGE_HOURS` in `constants.js` to adjust
- Verify Gmail API permissions

### Voice Commands Not Working

- Ensure microphone permissions are granted
- Check device volume is not muted
- Try speaking more clearly and slowly
- Voice recognition works best in quiet environments

### AI Summarization Fails

- Verify Gemini API key is correct
- Check API quota limits in Google AI Studio
- Ensure internet connection is stable

## 📝 Configuration Options

Edit `src/config/constants.js` to customize:

```javascript
// Email fetch settings
EMAIL_TIME_RANGE_HOURS: 6,      // Fetch emails from last N hours
MAX_EMAILS: 50,                  // Maximum emails to fetch

// Voice settings
VOICE_RATE: 1.0,                 // Speech speed (0.5 - 2.0)
VOICE_PITCH: 1.0,                // Voice pitch (0.5 - 2.0)
VOICE_LANGUAGE: 'en-US',         // Language code
PAUSE_BETWEEN_EMAILS_MS: 200,   // Pause between emails (ms)

// Gemini settings
GEMINI_MODEL: 'gemini-1.5-flash', // AI model
```

## 🔄 Differences from Chrome Extension

| Feature | Chrome Extension | Mobile App |
|---------|------------------|------------|
| AI Summarization | Chrome's built-in Summarizer | Google Gemini API |
| Authentication | chrome.identity API | OAuth 2.0 (expo-auth-session) |
| Text-to-Speech | Web Speech API | Expo Speech |
| Speech-to-Text | webkitSpeechRecognition | @react-native-voice/voice |
| Storage | chrome.storage | AsyncStorage |
| Platform | Chrome browser only | iOS & Android |

## 🚧 Known Limitations

1. **Voice Recognition**: Accuracy depends on device and environment
2. **Background TTS**: May stop when app is backgrounded (platform limitation)
3. **API Rate Limits**: Gemini and Gmail have daily quotas
4. **OAuth Flow**: Requires browser for authentication

## 📚 API Documentation

- [Gmail API](https://developers.google.com/gmail/api)
- [Gemini API](https://ai.google.dev/docs)
- [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/)
- [React Native Voice](https://github.com/react-native-voice/voice)

## 🤝 Contributing

This project is converted from the Chrome extension version. See the parent repository for contribution guidelines.

## 📄 License

Same as the main QuickMail project.

## 🎯 Next Steps

### Future Enhancements
- [ ] Email categories/filtering
- [ ] Smart reply suggestions
- [ ] Offline mode
- [ ] Background email checking with notifications
- [ ] Swipe gestures for navigation
- [ ] Custom voice selection
- [ ] Multi-account support
- [ ] Email attachments support

## ⚙️ Development Notes

### Testing OAuth Flow

For development testing, you can use Expo's auth proxy:

```javascript
// In constants.js, use:
OAUTH_REDIRECT_URI: AuthSession.makeRedirectUri({
  scheme: 'quickmail',
  path: 'callback'
})
```

### Building for Production

```bash
# iOS
expo build:ios

# Android
expo build:android
```

### Debugging

```bash
# View logs
npx react-native log-ios
npx react-native log-android

# Debug with Chrome DevTools
# Shake device > "Debug" > Opens Chrome debugger
```

## 📞 Support

For issues and questions:
1. Check existing issues in the repository
2. Review troubleshooting section above
3. Check API documentation links
4. Create a new issue with details

---

Built with ❤️ using React Native and Expo
