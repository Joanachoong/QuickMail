import { decodeBase64 ,stripHTML} from "./utils";
import { callGeminiAPI } from "./callAPI";

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

function extractSender(email){
     return getHeader(email.payload.headers, "From");

}

function extractSubject(email){
     return getHeader(email.payload.headers, "Subject");


}

export async function summarizeEmail(email){
     // Uses ALL the private functions above
  const sender = extractSender(email);     // ← Private
  const subject = extractSubject(email);   // ← Private
  const body = extractEmailBody(email);    // ← Private
  
  // Build prompt and call Gemini
  const prompt = `Summarize in 10 seconds: From ${sender}, Subject: ${subject}, Body: ${body}`;
  const summary = await callGeminiAPI(prompt);
  
  // Format and return
  return `[${sender}] sent [${subject}] about [${summary}]`;

}
function categorizeEmail(){

}

function getHeader(headers, name){
     const header = headers.find(h => h.name === name);
  return header ? header.value : 'Unknown';

}