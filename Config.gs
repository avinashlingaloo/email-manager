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
  // Use utility function for safer property access
  return {
    recipientEmail: getScriptProperty('RECIPIENT_EMAIL', 'your_email@gmail.com'),
    senderName: getScriptProperty('SENDER_NAME', 'Newsletter Digest Bot'),
    daysToSearch: parseInt(getScriptProperty('DAYS_TO_SEARCH', '1')),
    searchQuery: getScriptProperty('SEARCH_QUERY', 'unsubscribe OR "view in browser" OR from:substack OR from:medium -in:spam'),
    maxEmailsToProcess: parseInt(getScriptProperty('MAX_EMAILS_TO_PROCESS', '20')),
    geminiApiKey: getScriptProperty('GEMINI_API_KEY', ''),
    geminiModel: getScriptProperty('GEMINI_MODEL', 'gemini-1.5-flash'),
    labelName: getScriptProperty('LABEL_NAME', 'Newsletter-Processed')
  };
}

/**
 * Initialize script properties with default values
 * This function sets up all required properties for the newsletter summarizer
 */
function initializeScriptProperties() {
  try {
    const propertyDefaults = {
      'GEMINI_API_KEY': 'YOUR_GEMINI_API_KEY_HERE', // REQUIRED: Add your actual API key
      'RECIPIENT_EMAIL': 'your_email@gmail.com', // REQUIRED: Add your actual email
      'SENDER_NAME': 'Newsletter Digest Bot',
      'DAYS_TO_SEARCH': '1',
      'SEARCH_QUERY': 'unsubscribe OR "view in browser" OR from:substack OR from:medium -in:spam',
      'MAX_EMAILS_TO_PROCESS': '20',
      'GEMINI_MODEL': 'gemini-1.5-flash',
      'LABEL_NAME': 'Newsletter-Processed'
    };
    
    const properties = PropertiesService.getScriptProperties();
    
    Object.keys(propertyDefaults).forEach(function(key) {
      // Only set if property doesn't already exist
      if (!properties.getProperty(key)) {
        properties.setProperty(key, propertyDefaults[key]);
      }
    });
    
    console.log('Script properties initialized successfully!');
    console.log('Remember to update GEMINI_API_KEY and RECIPIENT_EMAIL with your actual values.');
    
    return true;
  } catch (error) {
    console.error('Error initializing script properties:', error);
    return false;
  }
}

/**
 * View all current script properties (safely masks sensitive data)
 */
function viewScriptProperties() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const allProps = properties.getProperties();
    
    console.log('Current Script Properties:');
    Object.keys(allProps).forEach(function(key) {
      let value = allProps[key];
      
      // Mask sensitive values for security
      if (key === 'GEMINI_API_KEY' && value.length > 10) {
        value = value.substring(0, 10) + '...' + value.substring(value.length - 4);
      } else if (key === 'RECIPIENT_EMAIL' && !value.includes('your_email')) {
        // Mask email partially
        const atIndex = value.indexOf('@');
        if (atIndex > 2) {
          value = value.substring(0, 2) + '***' + value.substring(atIndex);
        }
      }
      
      console.log(`${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('Error viewing script properties:', error);
  }
}
