// Gmail API Service
// Handles all Gmail API interactions
// Ported from callEmailAPI.js

import { CONFIG } from '../config/constants';
import { getTimeHoursAgo } from '../utils/helpers';
import { extractSender, extractSubject } from '../utils/emailProcessor';
import AuthService from './AuthService';

class GmailService {
  constructor() {
    this.baseUrl = CONFIG.GMAIL_API_BASE_URL;
  }

  /**
   * Get email IDs from last N hours
   */
  async getEmailIDs(accessToken) {
    try {
      const timestamp = getTimeHoursAgo(CONFIG.EMAIL_TIME_RANGE_HOURS);

      console.log(`Fetching emails after timestamp: ${timestamp}`);

      const response = await fetch(
        `${this.baseUrl}/users/me/messages?q=after:${timestamp}&maxResults=${CONFIG.MAX_EMAILS}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status}`);
      }

      const data = await response.json();

      console.log(`✓ Found ${data.messages ? data.messages.length : 0} email IDs`);

      return data.messages || [];
    } catch (error) {
      console.error('Failed to fetch email IDs:', error);
      throw error;
    }
  }

  /**
   * Fetch details for a single email
   */
  async fetchEmailDetail(accessToken, messageId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch email ${messageId}: ${response.status}`
        );
      }

      const data = await response.json();

      // Add parsed fields for easier access
      return {
        ...data,
        sender: extractSender(data),
        subject: extractSubject(data),
      };
    } catch (error) {
      console.error('Failed to fetch email detail:', error);
      throw error;
    }
  }

  /**
   * Fetch all emails - main orchestration function
   */
  async fetchAllEmails() {
    try {
      console.log('📧 Step 1: Getting auth token...');
      const accessToken = await AuthService.getAccessToken();

      if (!accessToken) {
        throw new Error('No access token available. Please login.');
      }

      console.log('📧 Step 2: Fetching email IDs...');
      const messageIds = await this.getEmailIDs(accessToken);

      if (messageIds.length === 0) {
        console.log(
          `📧 No emails in last ${CONFIG.EMAIL_TIME_RANGE_HOURS} hours`
        );
        return [];
      }

      console.log(
        `📧 Step 3: Fetching details for ${messageIds.length} emails...`
      );

      // Fetch all email details in parallel
      const emailPromises = messageIds.map(msg =>
        this.fetchEmailDetail(accessToken, msg.id)
      );

      const emails = await Promise.all(emailPromises);

      console.log(`✓ Successfully fetched ${emails.length} full emails`);
      return emails;
    } catch (error) {
      console.error('❌ Error in fetchAllEmails:', error);
      throw error;
    }
  }

  /**
   * Send an email reply
   * Used for voice reply feature
   */
  async sendEmail(to, subject, body, threadId = null) {
    try {
      const accessToken = await AuthService.getAccessToken();

      if (!accessToken) {
        throw new Error('No access token available. Please login.');
      }

      // Create email in RFC 2822 format
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        threadId ? `In-Reply-To: ${threadId}` : '',
        threadId ? `References: ${threadId}` : '',
        'Content-Type: text/plain; charset=utf-8',
        '',
        body,
      ]
        .filter(line => line !== '')
        .join('\r\n');

      // Base64 encode the email
      const encodedEmail = btoa(email)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch(`${this.baseUrl}/users/me/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
          threadId: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Email sent successfully:', data.id);

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new GmailService();
