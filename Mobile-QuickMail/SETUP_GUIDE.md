# QuickMail Mobile - Detailed Setup Guide

This guide provides step-by-step instructions for setting up the QuickMail mobile app, including all required API credentials.

## Table of Contents

1. [Gmail API Setup](#1-gmail-api-setup)
2. [Gemini API Setup](#2-gemini-api-setup)
3. [OAuth 2.0 Configuration](#3-oauth-20-configuration)
4. [App Configuration](#4-app-configuration)
5. [Testing](#5-testing)

---

## 1. Gmail API Setup

### Step 1.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: **QuickMail Mobile**
5. Click "Create"
6. Wait for project creation to complete

### Step 1.2: Enable Gmail API

1. In the project dashboard, click "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API"
4. Click "Enable"
5. Wait for API to be enabled

### Step 1.3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose user type:
   - **External** (for testing with any Google account)
   - Click "Create"

3. Fill in App information:
   - **App name**: QuickMail Mobile
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - Click "Save and Continue"

4. Add Scopes:
   - Click "Add or Remove Scopes"
   - Search and select:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
   - Click "Update"
   - Click "Save and Continue"

5. Add Test Users (for External app in testing):
   - Click "Add Users"
   - Enter your Gmail address
   - Click "Add"
   - Click "Save and Continue"

6. Review and click "Back to Dashboard"

### Step 1.4: Create OAuth Credentials

#### For Development (Expo Go):

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose application type: **Web application**
4. Name: **QuickMail Web (Expo Dev)**
5. Add Authorized redirect URIs:
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/quickmail-mobile
   ```
   (Replace `YOUR_EXPO_USERNAME` with your Expo username)
6. Click "Create"
7. **Copy the Client ID** - save it for later

#### For Production Build:

**iOS:**

1. Create another OAuth client ID
2. Choose: **iOS**
3. Name: **QuickMail iOS**
4. Bundle ID: `com.quickmail.mobile`
5. Click "Create"
6. Copy the iOS Client ID

**Android:**

1. Create another OAuth client ID
2. Choose: **Android**
3. Name: **QuickMail Android**
4. Package name: `com.quickmail.mobile`
5. SHA-1 fingerprint:
   ```bash
   # Get debug keystore SHA-1
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   Copy the SHA-1 fingerprint
6. Click "Create"
7. Copy the Android Client ID

---

## 2. Gemini API Setup

### Step 2.1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API key" or "Create API key"
4. Choose your Google Cloud project (QuickMail Mobile)
5. Click "Create API key in existing project"
6. **Copy the API key** - save it securely
7. **Important**: Keep this key secret and never commit it to version control

### Step 2.2: Test Gemini API

You can test your API key with curl:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, Gemini!"}]
    }]
  }'
```

If successful, you'll get a JSON response with generated content.

---

## 3. OAuth 2.0 Configuration

### Step 3.1: Understanding Redirect URIs

For Expo development, the redirect URI format is:
```
https://auth.expo.io/@YOUR_EXPO_USERNAME/quickmail-mobile
```

For standalone apps (after building):
```
quickmail://callback
```

### Step 3.2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click on your Web application OAuth client
4. Under "Authorized redirect URIs", add both:
   - `https://auth.expo.io/@YOUR_EXPO_USERNAME/quickmail-mobile`
   - `quickmail://callback`
5. Click "Save"

### Step 3.3: Get Your Expo Username

```bash
expo whoami
```

If not logged in:
```bash
expo login
```

---

## 4. App Configuration

### Step 4.1: Update Constants File

Open `src/config/constants.js` and update:

```javascript
export const CONFIG = {
  // Gmail API Configuration
  GMAIL_API_BASE_URL: 'https://gmail.googleapis.com/gmail/v1',
  GMAIL_SCOPES: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ],

  // Google OAuth 2.0 Configuration
  // PASTE YOUR CLIENT ID HERE:
  GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',

  OAUTH_REDIRECT_URI: 'https://auth.expo.io/@YOUR_EXPO_USERNAME/quickmail-mobile',

  // Gemini API Configuration
  // PASTE YOUR GEMINI API KEY HERE:
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
  GEMINI_MODEL: 'gemini-1.5-flash',

  // Other settings (can keep defaults)
  EMAIL_TIME_RANGE_HOURS: 6,
  MAX_EMAILS: 50,
  VOICE_RATE: 1.0,
  VOICE_PITCH: 1.0,
  VOICE_LANGUAGE: 'en-US',
  PAUSE_BETWEEN_EMAILS_MS: 200,
};
```

### Step 4.2: Security Best Practices

**IMPORTANT**: Never commit API keys to version control!

1. Create a `.env` file (not tracked by git):
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GEMINI_API_KEY=your_api_key_here
   ```

2. Install dotenv:
   ```bash
   npm install react-native-dotenv
   ```

3. Update `constants.js` to use environment variables:
   ```javascript
   import { GOOGLE_CLIENT_ID, GEMINI_API_KEY } from '@env';

   export const CONFIG = {
     GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
     GEMINI_API_KEY: GEMINI_API_KEY,
     // ... rest of config
   };
   ```

4. Add to `.gitignore`:
   ```
   .env
   src/config/constants.js
   ```

---

## 5. Testing

### Step 5.1: Test the App

1. Start the development server:
   ```bash
   npm start
   ```

2. Open Expo Go on your phone and scan the QR code

3. Test OAuth Flow:
   - Tap "Sign in with Google"
   - You should see Google's OAuth consent screen
   - Sign in with your test user account
   - Grant permissions
   - You should be redirected back to the app

### Step 5.2: Test Email Fetching

1. Send yourself a test email
2. In the app, after signing in, you should see the loading screen
3. The app should:
   - Fetch your recent emails
   - Summarize them with Gemini
   - Navigate to the Voice screen
   - Start reading the summaries automatically

### Step 5.3: Test Voice Features

1. **Play/Pause**: Test the pause and resume buttons
2. **Navigation**: Test next/previous buttons
3. **Voice Commands**:
   - Tap "Voice Command" button
   - Say "Next" or "Previous"
   - Verify the command is recognized

4. **Voice Reply**:
   - Tap "Voice Reply" button
   - Speak a short message
   - Listen to the confirmation
   - Say "Send" or "Cancel"

### Step 5.4: Troubleshooting Tests

If OAuth fails:
```bash
# Check redirect URI
expo start --clear

# Verify client ID
cat src/config/constants.js | grep CLIENT_ID
```

If emails don't fetch:
```bash
# Check Gmail API is enabled
# Check OAuth scopes include gmail.readonly
```

If summarization fails:
```bash
# Test Gemini API key with curl
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Test"}]}]}'
```

---

## Quick Reference

### Required Credentials

✅ **Google OAuth Client ID** (from Google Cloud Console)
- Format: `xxxxx.apps.googleusercontent.com`
- Used for: Gmail authentication

✅ **Gemini API Key** (from Google AI Studio)
- Format: `AIzaSy...`
- Used for: Email summarization

### Required Permissions

✅ **Gmail API Scopes**:
- `gmail.readonly` - Read emails
- `gmail.send` - Send replies

✅ **Mobile Permissions**:
- Microphone (for voice commands)
- Speech Recognition (for STT)

### Common Issues

| Issue | Solution |
|-------|----------|
| OAuth redirect fails | Check redirect URI matches in Google Console |
| Emails don't load | Verify Gmail API is enabled |
| Summarization fails | Check Gemini API key and quota |
| Voice not working | Grant microphone permissions |
| Build fails | Run `npm install` and `expo prebuild` |

---

## Next Steps

After setup is complete:

1. ✅ Test all features thoroughly
2. ✅ Customize voice settings in `constants.js`
3. ✅ Build standalone app for production
4. ✅ Submit to App Store / Play Store (optional)

For production deployment, see the main README.md for build instructions.

---

**Need Help?**

- Gmail API: https://developers.google.com/gmail/api
- Gemini API: https://ai.google.dev/docs
- Expo OAuth: https://docs.expo.dev/guides/authentication/
- Common errors: Check troubleshooting section in README.md

Happy coding! 🚀
