// Configuration constants for Mobile-QuickMail

export const CONFIG = {
  // Gmail API Configuration
  GMAIL_API_BASE_URL: 'https://gmail.googleapis.com/gmail/v1',
  GMAIL_SCOPES: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ],

  // Google OAuth 2.0 Configuration
  // IMPORTANT: Replace these with your own credentials from Google Cloud Console
  // 1. Go to https://console.cloud.google.com/
  // 2. Create a new project or select existing
  // 3. Enable Gmail API
  // 4. Create OAuth 2.0 credentials for Mobile app
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'YOUR_CLIENT_SECRET', // Optional for mobile

  // Redirect URI for OAuth (must match what's configured in Google Console)
  // For Expo, use: exp://localhost:19000/--/callback
  // For production: your-app-scheme://callback
  OAUTH_REDIRECT_URI: 'exp://localhost:19000/--/callback',

  // Gemini API Configuration
  // Get your API key from: https://makersuite.google.com/app/apikey
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
  GEMINI_MODEL: 'gemini-1.5-flash',

  // Email fetch settings
  EMAIL_TIME_RANGE_HOURS: 6, // Fetch emails from last 6 hours
  MAX_EMAILS: 50,

  // Voice settings
  VOICE_RATE: 1.0,
  VOICE_PITCH: 1.0,
  VOICE_LANGUAGE: 'en-US',
  PAUSE_BETWEEN_EMAILS_MS: 200,

  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@quickmail:access_token',
    REFRESH_TOKEN: '@quickmail:refresh_token',
    SUMMARIES: '@quickmail:summaries',
    LAST_UPDATED: '@quickmail:last_updated',
  },
};
