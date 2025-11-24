// Gemini AI Service for Email Summarization
// Replaces Chrome's built-in Summarizer API

import { CONFIG } from '../config/constants';

class GeminiService {
  constructor() {
    this.apiKey = CONFIG.GEMINI_API_KEY;
    this.model = CONFIG.GEMINI_MODEL;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Summarize a single email using Gemini API
   */
  async summarizeEmail(email) {
    try {
      // Build email text from subject and snippet/body
      const emailText = `Subject: ${email.subject || 'No Subject'}\n\n${
        email.snippet || email.body || ''
      }`;

      // Skip if too short
      if (emailText.length < 50) {
        console.log(`Skipping short email: ${email.subject}`);
        return {
          success: true,
          summary: emailText,
          usedAI: false,
        };
      }

      // Create prompt for Gemini
      const prompt = `You are an email assistant. Summarize this email in 1-2 concise sentences (max 50 words). Focus on the key action items or information.

Email:
${emailText}

Summary:`;

      // Call Gemini API
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 100,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract summary from response
      const summary =
        data.candidates?.[0]?.content?.parts?.[0]?.text || 'Summary unavailable';

      console.log(`✅ Summarized: ${email.subject}`);

      return {
        success: true,
        summary: summary.trim(),
        usedAI: true,
      };
    } catch (error) {
      console.error('Gemini summarization failed:', error);

      // Fallback: return sender + subject
      const fallback = `Email from ${email.from || 'unknown sender'}, regarding ${
        email.subject
      }`;

      return {
        success: true,
        summary: fallback,
        usedAI: false,
        error: error.message,
      };
    }
  }

  /**
   * Summarize multiple emails in batch
   */
  async summarizeBatch(emails, onProgress) {
    console.log(`📧 Starting batch summarization for ${emails.length} emails`);

    const results = [];

    // Process emails one by one (to avoid rate limits)
    for (let i = 0; i < emails.length; i++) {
      const result = await this.summarizeEmail(emails[i]);
      results.push(result);

      // Report progress
      if (onProgress) {
        onProgress(Math.floor(((i + 1) / emails.length) * 100));
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Attach summaries to original email objects
    emails.forEach((email, index) => {
      email.summary = results[index].summary;
      email.summarizedWithAI = results[index].usedAI;
    });

    const aiCount = results.filter(r => r.usedAI).length;
    console.log(
      `✅ Summarized ${aiCount} emails with AI, ${emails.length - aiCount} without AI`
    );

    return emails;
  }
}

export default new GeminiService();
