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