export function decodeBase64(base64String) {
  // Step 1: Convert base64url to standard base64
  // Replace URL-safe characters with standard base64 characters
  let base64 = base64String
    .replace(/-/g, '+')   // - becomes +
    .replace(/_/g, '/');  // _ becomes /
  
  // Step 2: Add padding if needed
  // Base64 strings should be divisible by 4
  const padding = base64.length % 4;
  if (padding > 0) {
    base64 += '='.repeat(4 - padding);
  }
  // Generic: works with ANY base64 string
  return atob(base64);
}

export function stripHTML(html) {
  // Generic: works with ANY HTML string
  return html.replace(/<[^>]*>/g, '');
}

export function getTime() {
  const sixHours = new Date();
  sixHours.setHours(sixHours.getHours() - 6);
  return Math.floor(sixHours.getTime() / 1000);
}

function getTimeStatus(){
  return Math.floor()
}

// utils.js - YOU fill in the logic

// Function 1: Hide ALL pages
export function hideAllPages() {

  const pages = document.querySelectorAll('.page');
  
  // Loop through each page
  // 'page' is the current element in the loop
  pages.forEach(page => {
    // Remove the 'active' class if it exists
    page.classList.remove('active');
    
    // Add the 'hidden' class
    page.classList.add('hidden');
  });
  
  console.log('✅ All pages hidden');
}

// Function 2: Show ONE specific page
export function showPage(pageId) {

  hideAllPages();

  // get the specofic page 
  const page = document.getElementById(pageId);

  //check if page exist 
  if (!page) {
    console.error(`❌ Page with ID '${pageId}' not found!`);
    return;  // Exit the function early
  }
  
  // STEP 4: Show the page
  page.classList.remove('hidden');  // Remove hidden class
  page.classList.add('active');     // Add active class
  
  console.log(`✅ Showing page: ${pageId}`);

}

// Function 3: Update progress percentage
export function updateProgress(percentage) {
  
  // Get ONE element by class name (first match)
  const percentageElement = document.querySelector('.percentage');

  //check if the percentage exisst 
  if (!percentageElement) {
    console.error('❌ Percentage element not found!');
    return;
  }
  
  // Update the text content
  // We add '%' symbol after the number
  percentageElement.textContent = `${percentage}%`;
  
  console.log(`📊 Progress updated: ${percentage}%`);
 
}

// CLEAN SUMMARY TEXT: Remove HTML tags and emojis
 export function cleanSummaryText(text) {
 if (!text) return '';
 
  let cleaned = text;
 
 // STEP 1: Remove HTML tags (like <p>, </p>, <br>, etc.)
 // This regex matches anything between < and >
  cleaned = cleaned.replace(/<[^>]*>/g, '');
 
 // STEP 2: Remove emojis
 // This regex matches most emoji characters
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
 cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc Symbols and Pictographs
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport and Map
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Misc symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats
  cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}]/gu, '');   // Variation Selectors
  cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols and Pictographs
  cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs Extended-A
 
  // STEP 3: Remove extra whitespace and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  console.log('🧹 Cleaned text:', {
    original: text.substring(0, 50) + '...',
    cleaned: cleaned.substring(0, 50) + '...'
  });
  
  return cleaned;
}
