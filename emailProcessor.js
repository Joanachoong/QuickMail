import { decodeBase64 ,stripHTML} from "./utils.js";


function extractEmailBody(email){

    // Step 1: Get the base64 data
  
  // Step 2: Check if body exists
  // What if email has no body? (just attachments)
  if (!email.payload.body || !email.payload.body.data) {
  // What should we return here?
  return null;
}
  
  const base64 = email.payload.body.data;  // "SGVsbG8gV29ybGQ="
  const decoded = decodeBase64(base64);    // "Hello World"
  const plain = stripHTML(decoded);        // "Hello World"
  return plain;

}

export function extractSender(email){
     return getHeader(email.payload.headers, "From");

}

export function extractSubject(email){
     return getHeader(email.payload.headers, "Subject");


}

export function transformEmailForStorage(email) {
  // Extract from Gmail format
  const sender = extractSender(email);  // Already exists!
  const subject = extractSubject(email);  // Already exists!
  
  // WHY: Categorize email to determine if it should be read aloud
  const categorization = categorizeEmail(email);
  
  // Return clean object with categorization data
  return {
    sender: sender,
    subject: subject,
    summary: email.summary || 'No summary available',  // Added by summarizeBatch
    summarizedWithAI: email.summarizedWithAI || false,
    // NEW: Categorization data
    category: categorization.category,        // 'work', 'school', 'events', 'offers', 'junk', 'other'
    priority: categorization.priority,        // 'high', 'normal'
    shouldSkip: categorization.shouldSkip     // true for junk emails
  };
}

export async function summarizeEmail(email){
     // Uses ALL the private functions above
  const sender = extractSender(email);     // ← Private
  const subject = extractSubject(email);   // ← Private
  const body = extractEmailBody(email);    // ← Private
  
  // Build prompt and call Gemini
  const prompt = `Summarize in 10 seconds: From ${sender}, Subject: ${subject}, Body: ${body}`;
  
  // Format and return
  return `This is a sample`;

}
// ============================================================================
// EMAIL CATEGORIZATION SYSTEM
// ============================================================================
// WHY: Filter out junk emails and organize important emails by category
// This ensures users only hear relevant emails during TTS playback

/**
 * Main categorization function
 * WHY: Single entry point that applies filtering and categorization logic
 * 
 * @param {Object} email - Gmail API email object
 * @returns {Object} { category: string, priority: string, shouldSkip: boolean }
 */
export function categorizeEmail(email) {
  const sender = extractSender(email).toLowerCase();
  const subject = extractSubject(email).toLowerCase();
  const body = extractEmailBody(email)?.toLowerCase() || '';
  
  // STEP 1: Check if this is junk/spam (SKIP these entirely)
  // WHY: Don't waste user's time or API calls on promotional spam
  if (isJunkEmail(sender, subject, body)) {
    return {
      category: 'junk',
      priority: 'none',
      shouldSkip: true  // TTS will ignore this email
    };
  }
  
  // STEP 2: Determine category (priority order matters!)
  // WHY: More specific categories first to avoid mis-classification
  let category = 'other';
  
  if (isWorkEmail(sender, subject, body)) {
    category = 'work';
  } else if (isSchoolEmail(sender, subject, body)) {
    category = 'school';
  } else if (isEventEmail(sender, subject, body)) {
    category = 'events';
  } else if (isOfferEmail(sender, subject, body)) {
    category = 'offers';
  }
  
  // STEP 3: Calculate priority within the category
  // WHY: Some emails need immediate attention (deadlines, urgent requests)
  const priority = calculatePriority(sender, subject, body);
  
  return {
    category,
    priority,
    shouldSkip: false
  };
}

// ============================================================================
// JUNK/SPAM DETECTION
// ============================================================================
// WHY: Filter out promotional emails, newsletters, and spam BEFORE summarization
// This saves API credits and user's listening time

/**
 * Detects junk/spam emails using multiple signals
 * WHY: Score-based system is more reliable than binary yes/no
 */
function isJunkEmail(sender, subject, body) {
  let junkScore = 0;
  
  // SIGNAL 1: Suspicious sender patterns (very reliable)
  // WHY: Marketing emails use these standardized sender addresses
  const suspiciousSenders = [
    'noreply@',
    'no-reply@',
    'donotreply@',
    'newsletter@',
    'marketing@',
    'promo@',
    'promotions@',
    'deals@',
    'offers@',
    'info@',  // Often used by marketing
    'hello@',  // Common in cold emails
    'team@'   // Generic company emails
  ];
  
  if (suspiciousSenders.some(pattern => sender.includes(pattern))) {
    junkScore += 3;  // Strong signal
  }
  
  // SIGNAL 2: Unsubscribe links (dead giveaway)
  // WHY: Legitimate personal emails never have unsubscribe links
  if (body.includes('unsubscribe') || 
      body.includes('opt out') || 
      body.includes('opt-out') ||
      body.includes('manage preferences') ||
      body.includes('update email preferences')) {
    junkScore += 4;  // Very strong signal
  }
  
  // SIGNAL 3: Marketing/spam keywords in subject
  // WHY: These phrases are heavily used in promotional emails
  const spamSubjectKeywords = [
    'limited time',
    'act now',
    'don\'t miss',
    'exclusive offer',
    'click here',
    'open now',
    'you\'ve won',
    'claim your',
    'free gift',
    'urgent action required',
    '50% off',
    '% off',
    'last chance'
  ];
  
  const subjectSpamCount = spamSubjectKeywords.filter(keyword => 
    subject.includes(keyword)
  ).length;
  
  if (subjectSpamCount >= 2) {
    junkScore += 3;  // Multiple spam keywords = likely junk
  } else if (subjectSpamCount === 1) {
    junkScore += 1;
  }
  
  // SIGNAL 4: Excessive promotional language in body
  // WHY: Real emails from people don't sound like ads
  const marketingKeywords = [
    'buy now',
    'order now',
    'shop now',
    'limited stock',
    'while supplies last',
    'today only',
    'flash sale',
    'clearance',
    'best price',
    'lowest price',
    'guarantee',
    'risk free',
    'no obligation',
    'credit card',
    'click below',
    'visit our website'
  ];
  
  const bodyMarketingCount = marketingKeywords.filter(keyword => 
    body.includes(keyword)
  ).length;
  
  if (bodyMarketingCount >= 3) {
    junkScore += 2;
  }
  
  // SIGNAL 5: Newsletter indicators
  // WHY: Most newsletters are optional reading, not urgent
  if (subject.includes('newsletter') || 
      subject.includes('weekly digest') ||
      subject.includes('daily update') ||
      sender.includes('newsletter')) {
    junkScore += 2;
  }
  
  // DECISION: Threshold for marking as junk
  // WHY: Score >= 5 means multiple strong signals = very likely spam
  return junkScore >= 5;
}

// ============================================================================
// CATEGORY DETECTION FUNCTIONS
// ============================================================================

/**
 * Detects work-related emails
 * WHY: Users need to prioritize work emails during their morning routine
 */
function isWorkEmail(sender, subject, body) {
  let workScore = 0;
  
  // SIGNAL 1: Common work email domains
  // WHY: Corporate domains are the strongest signal
  // TODO: In future, get user's actual work domain during onboarding
  const workDomains = [
    // Generic corporate indicators
    '.corp', '.company', '.inc', '.llc', '.ltd',
    // Common business email services
    'workplace', 'company', 'corporate'
  ];
  
  if (workDomains.some(domain => sender.includes(domain))) {
    workScore += 5;  // Very strong signal
  }
  
  // SIGNAL 2: Work-related keywords (weighted by strength)
  // WHY: These words strongly indicate professional communication
  const strongWorkKeywords = [
    'meeting',
    'deadline',
    'project',
    'client',
    'deliverable',
    'sprint',
    'standup',
    'review',
    'approval needed',
    'urgent',
    'asap'
  ];
  
  const moderateWorkKeywords = [
    'team',
    'update',
    'report',
    'presentation',
    'schedule',
    'conference call',
    'zoom',
    'call',
    'discussion'
  ];
  
  // Count keyword matches
  const strongMatches = strongWorkKeywords.filter(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  ).length;
  
  const moderateMatches = moderateWorkKeywords.filter(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  ).length;
  
  workScore += strongMatches * 2;  // Strong keywords worth more
  workScore += moderateMatches * 1;
  
  // SIGNAL 3: Work collaboration tools
  // WHY: These services only send work-related notifications
  const workTools = [
    'slack.com',
    'jira',
    'asana',
    'trello',
    'monday.com',
    'notion',
    'confluence',
    'github',
    'gitlab',
    'salesforce'
  ];
  
  if (workTools.some(tool => sender.includes(tool))) {
    workScore += 4;
  }
  
  // DECISION: Threshold for work category
  return workScore >= 4;
}

/**
 * Detects school/education emails
 * WHY: Students need to prioritize assignments and professor emails
 */
function isSchoolEmail(sender, subject, body) {
  let schoolScore = 0;
  
  // SIGNAL 1: .edu domain (GOLD STANDARD)
  // WHY: Only educational institutions use .edu
  if (sender.includes('.edu')) {
    schoolScore += 10;  // Instant classification
  }
  
  // SIGNAL 2: Academic keywords
  // WHY: These words are almost exclusively used in educational contexts
  const strongSchoolKeywords = [
    'professor',
    'instructor',
    'teaching assistant',
    'ta:',
    'assignment',
    'homework',
    'exam',
    'midterm',
    'final exam',
    'quiz',
    'grade',
    'syllabus',
    'course',
    'lecture',
    'class',
    'semester',
    'office hours',
    'academic',
    'registrar',
    'dean',
    'department'
  ];
  
  const schoolMatches = strongSchoolKeywords.filter(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  ).length;
  
  schoolScore += schoolMatches * 2;
  
  // SIGNAL 3: Learning management systems
  // WHY: These platforms only send school-related emails
  const learningPlatforms = [
    'canvas',
    'blackboard',
    'moodle',
    'schoology',
    'edmodo',
    'google classroom'
  ];
  
  if (learningPlatforms.some(platform => 
    sender.includes(platform) || body.includes(platform)
  )) {
    schoolScore += 5;
  }
  
  // SIGNAL 4: University identifiers
  const universityTerms = [
    'university',
    'college',
    'school of',
    'institute of',
    'academy'
  ];
  
  if (universityTerms.some(term => sender.includes(term))) {
    schoolScore += 3;
  }
  
  // DECISION: Threshold for school category
  return schoolScore >= 4;
}

/**
 * Detects event invitations
 * WHY: Users want to know about upcoming events (meetings, parties, conferences)
 */
function isEventEmail(sender, subject, body) {
  let eventScore = 0;
  
  // SIGNAL 1: Event-specific keywords
  // WHY: These words strongly indicate an event invitation
  const eventKeywords = [
    'invitation',
    'invite',
    'invited',
    'rsvp',
    'save the date',
    'event',
    'calendar',
    'reminder',
    'upcoming',
    'join us',
    'you\'re invited',
    'please join',
    'venue',
    'location',
    'date and time',
    'register',
    'registration'
  ];
  
  const eventMatches = eventKeywords.filter(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  ).length;
  
  eventScore += eventMatches * 2;
  
  // SIGNAL 2: Event platforms
  // WHY: These services only send event-related emails
  const eventPlatforms = [
    'eventbrite',
    'meetup',
    'hopin',
    'evite',
    'partiful',
    'luma',
    'lu.ma'
  ];
  
  if (eventPlatforms.some(platform => sender.includes(platform))) {
    eventScore += 5;
  }
  
  // SIGNAL 3: Calendar/meeting services
  const calendarServices = [
    'calendar',
    'outlook',
    'zoom',
    'google meet',
    'microsoft teams',
    'webex'
  ];
  
  if (calendarServices.some(service => sender.includes(service))) {
    eventScore += 3;
  }
  
  // SIGNAL 4: Conference/webinar indicators
  const conferenceKeywords = [
    'conference',
    'webinar',
    'workshop',
    'seminar',
    'summit',
    'symposium',
    'meetup'
  ];
  
  if (conferenceKeywords.some(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  )) {
    eventScore += 2;
  }
  
  // DECISION: Threshold for event category
  return eventScore >= 4;
}

/**
 * Detects promotional/offer emails
 * WHY: Separate wanted deals (Amazon order updates) from pure spam
 */
function isOfferEmail(sender, subject, body) {
  let offerScore = 0;
  
  // SIGNAL 1: Promotional keywords
  // WHY: These indicate deals/sales but might be from retailers user actually uses
  const offerKeywords = [
    'sale',
    'discount',
    'deal',
    'promotion',
    'coupon',
    'save',
    '% off',
    'percent off',
    'off your order',
    'free shipping',
    'special offer',
    'exclusive',
    'members only'
  ];
  
  const offerMatches = offerKeywords.filter(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  ).length;
  
  offerScore += offerMatches * 2;
  
  // SIGNAL 2: Retail/e-commerce senders
  // WHY: Distinguish between wanted retailer emails vs random spam
  const retailIndicators = [
    'amazon',
    'ebay',
    'etsy',
    'walmart',
    'target',
    'shop',
    'store',
    'retail',
    'market'
  ];
  
  if (retailIndicators.some(retailer => sender.includes(retailer))) {
    offerScore += 3;
  }
  
  // DECISION: Threshold for offers category
  // Note: Many offer emails will be caught by junk filter first
  return offerScore >= 4;
}

// ============================================================================
// PRIORITY DETECTION
// ============================================================================
// WHY: Some emails need immediate attention regardless of category

/**
 * Calculates email priority (high/normal/low)
 * WHY: Users should hear urgent emails first during TTS playback
 */
function calculatePriority(sender, subject, body) {
  // HIGH PRIORITY indicators
  // WHY: These words/patterns signal time-sensitive content
  const urgentKeywords = [
    'urgent',
    'asap',
    'immediately',
    'action required',
    'deadline today',
    'due today',
    'expiring',
    'time sensitive',
    'important',
    'critical',
    'emergency'
  ];
  
  const hasUrgentKeyword = urgentKeywords.some(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  );
  
  if (hasUrgentKeyword) {
    return 'high';
  }
  
  // MEDIUM PRIORITY (default for most emails)
  return 'normal';
  
  // TODO: Add LOW PRIORITY for:
  // - Newsletters (informational only)
  // - CC'd emails (not directly addressed to user)
  // - Old threads (RE: RE: RE:)
}

function getHeader(headers, name){
     const header = headers.find(h => h.name === name);
  return header ? header.value : 'Unknown';

}

// ============================================================================
// UTILITY FUNCTIONS FOR EMAIL FILTERING & SORTING
// ============================================================================
// WHY: TTS system needs to filter out junk and prioritize important emails

/**
 * Filters out junk emails from an array
 * WHY: Don't waste user's time reading promotional spam
 * 
 * @param {Array} emails - Array of processed email objects
 * @returns {Array} - Filtered emails (junk removed)
 */
export function filterJunkEmails(emails) {
  return emails.filter(email => !email.shouldSkip);
}

/**
 * Groups emails by category
 * WHY: TTS can announce "You have 3 work emails, 2 school emails..." 
 * 
 * @param {Array} emails - Array of processed email objects
 * @returns {Object} - { work: [...], school: [...], events: [...], etc }
 */
export function groupEmailsByCategory(emails) {
  const grouped = {
    work: [],
    school: [],
    events: [],
    offers: [],
    other: []
  };
  
  emails.forEach(email => {
    if (!email.shouldSkip && grouped[email.category]) {
      grouped[email.category].push(email);
    }
  });
  
  return grouped;
}

/**
 * Sorts emails by priority (high priority first)
 * WHY: Users should hear urgent emails before normal ones
 * 
 * @param {Array} emails - Array of processed email objects
 * @returns {Array} - Sorted emails (high priority first)
 */
export function sortEmailsByPriority(emails) {
  return [...emails].sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Gets email count summary for TTS announcement
 * WHY: "You have 5 new emails: 2 work, 1 school, 2 events"
 * 
 * @param {Array} emails - Array of processed email objects
 * @returns {Object} - { total: 5, work: 2, school: 1, events: 2, ... }
 */
export function getEmailCountSummary(emails) {
  const filtered = filterJunkEmails(emails);
  const grouped = groupEmailsByCategory(filtered);
  
  return {
    total: filtered.length,
    work: grouped.work.length,
    school: grouped.school.length,
    events: grouped.events.length,
    offers: grouped.offers.length,
    other: grouped.other.length,
    highPriority: filtered.filter(e => e.priority === 'high').length
  };
}