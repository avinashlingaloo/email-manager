/**
 * Configuration file for Newsletter Summarizer
 * 
 * IMPORTANT: Set up your environment variables in the Google Apps Script project:
 * 1. Go to your Google Apps Script project
 * 2. Click on "Project Settings" (gear icon)
 * 3. Scroll down to "Script Properties"
 * 4. Add the following properties:
 *    - GEMINI_API_KEY: Your Gemini API key
 *    - RECIPIENT_EMAIL: Your email address
 *    - SENDER_NAME: Newsletter Digest Bot
 *    - DAYS_TO_SEARCH: 1
 *    - SEARCH_QUERY: unsubscribe OR "view in browser" OR from:substack OR from:medium -in:spam
 *    - MAX_EMAILS_TO_PROCESS: 20
 *    - GEMINI_MODEL: gemini-1.5-flash
 *    - LABEL_NAME: Newsletter-Processed
 */

// Get configuration from Google Apps Script properties
function getConfig() {
  const properties = PropertiesService.getScriptProperties();
  
  return {
    recipientEmail: properties.getProperty('RECIPIENT_EMAIL') || 'your_email@gmail.com',
    senderName: properties.getProperty('SENDER_NAME') || 'Newsletter Digest Bot',
    daysToSearch: parseInt(properties.getProperty('DAYS_TO_SEARCH')) || 1,
    searchQuery: properties.getProperty('SEARCH_QUERY') || 'unsubscribe OR "view in browser" OR from:substack OR from:medium -in:spam',
    maxEmailsToProcess: parseInt(properties.getProperty('MAX_EMAILS_TO_PROCESS')) || 20,
    geminiApiKey: properties.getProperty('GEMINI_API_KEY') || '',
    geminiModel: properties.getProperty('GEMINI_MODEL') || 'gemini-1.5-flash',
    labelName: properties.getProperty('LABEL_NAME') || 'Newsletter-Processed'
  };
}
