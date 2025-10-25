export function decodeBase64(base64String) {
  // Generic: works with ANY base64 string
  return atob(base64String);
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