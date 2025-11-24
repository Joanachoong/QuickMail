// Email processing utilities
// Ported from Chrome extension emailProcessor.js

/**
 * Decode base64 email body
 */
export function decodeBase64(base64String) {
  try {
    // Replace URL-safe characters
    const base64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
    // Decode base64
    const decoded = atob(base64);
    return decoded;
  } catch (error) {
    console.error('Failed to decode base64:', error);
    return '';
  }
}

/**
 * Strip HTML tags from text
 */
export function stripHTML(html) {
  if (!html) return '';
  // Simple HTML tag removal (for mobile, we don't have DOMParser)
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extract email body from Gmail message object
 */
export function extractEmailBody(email) {
  if (!email.payload || !email.payload.body || !email.payload.body.data) {
    return null;
  }

  const base64 = email.payload.body.data;
  const decoded = decodeBase64(base64);
  const plain = stripHTML(decoded);
  return plain;
}

/**
 * Extract sender from email headers
 */
export function extractSender(email) {
  return getHeader(email.payload?.headers, 'From') || 'Unknown Sender';
}

/**
 * Extract subject from email headers
 */
export function extractSubject(email) {
  return getHeader(email.payload?.headers, 'Subject') || 'No Subject';
}

/**
 * Get specific header value from headers array
 */
function getHeader(headers, name) {
  if (!headers) return 'Unknown';
  const header = headers.find(h => h.name === name);
  return header ? header.value : 'Unknown';
}

/**
 * Clean summary text - remove emojis and extra whitespace
 */
export function cleanSummaryText(text) {
  if (!text) return '';

  // Remove emojis (comprehensive regex)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

  return text
    .replace(emojiRegex, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Transform email to storage format with summary
 */
export function transformEmailForStorage(email, summary) {
  return {
    id: email.id,
    sender: extractSender(email),
    subject: cleanSummaryText(extractSubject(email)),
    summary: cleanSummaryText(summary),
    threadId: email.threadId,
    timestamp: email.internalDate,
  };
}

/**
 * Format email for voice reading
 */
export function formatEmailForSpeech(email, index, total) {
  if (!email.summary || email.summary === 'Summary unavailable') {
    return `Email ${index} of ${total}. From ${email.sender}. Subject: ${email.subject}.`;
  }

  return `Email ${index} of ${total}. From ${email.sender}. Subject: ${email.subject}. ${email.summary}`;
}
