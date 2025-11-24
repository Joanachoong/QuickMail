// OAuth 2.0 Authentication Service for Gmail
// Replaces Chrome's identity API

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config/constants';

// Required for web-based OAuth flow
WebBrowser.maybeCompleteAuthSession();

class AuthService {
  constructor() {
    this.discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };
  }

  /**
   * Start OAuth flow and get access token
   */
  async authenticate() {
    try {
      console.log('🔐 Starting OAuth authentication...');

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'quickmail',
        path: 'callback',
      });

      console.log('Redirect URI:', redirectUri);

      const request = new AuthSession.AuthRequest({
        clientId: CONFIG.GOOGLE_CLIENT_ID,
        redirectUri,
        scopes: CONFIG.GMAIL_SCOPES,
        responseType: AuthSession.ResponseType.Token,
        usePKCE: false,
      });

      const result = await request.promptAsync(this.discovery);

      console.log('Auth result:', result.type);

      if (result.type === 'success') {
        const { access_token, refresh_token } = result.params;

        // Store tokens
        await this.storeTokens(access_token, refresh_token);

        console.log('✅ Authentication successful');
        return {
          success: true,
          accessToken: access_token,
        };
      } else {
        console.log('❌ Authentication cancelled or failed');
        return {
          success: false,
          error: 'Authentication cancelled',
        };
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Store tokens in AsyncStorage
   */
  async storeTokens(accessToken, refreshToken) {
    try {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Get stored access token
   */
  async getAccessToken() {
    try {
      const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const token = await this.getAccessToken();
    return token !== null;
  }

  /**
   * Logout - clear tokens
   */
  async logout() {
    try {
      await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }
}

export default new AuthService();
