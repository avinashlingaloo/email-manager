/**
 * Utility functions for Newsletter Summarizer
 * Helper functions for common operations
 */

/**
 * Extract text content from email with improved HTML handling
 */
function extractTextFromEmail(message) {
  let body = message.getPlainBody();
  
  // If plain text is empty or too short, try to extract from HTML
  if (!body || body.trim().length < 100) {
    const htmlBody = message.getBody();
    body = convertHtmlToText(htmlBody);
  }
  
  // Limit body length for API processing (5000 characters)
  return body.substring(0, 5000);
}

/**
 * Convert HTML to plain text with better formatting
 */
function convertHtmlToText(html) {
  return html
    // Remove scripts and styles
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // Replace common HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    // Replace line breaks and paragraphs with spaces
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/div>/gi, " ")
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, " ")
    // Clean up whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Format date for Gmail search queries
 */
function formatDateForSearch(daysBack) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);
  return Utilities.formatDate(
    dateFrom,
    Session.getScriptTimeZone(),
    "yyyy/MM/dd"
  );
}

/**
 * Safe JSON parsing with error handling
 */
function safeJsonParse(jsonString, fallback) {
  if (fallback === undefined) fallback = null;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON parsing error:", error);
    return fallback;
  }
}

/**
 * Validate newsletter summary structure
 */
function validateNewsletterSummary(summary) {
  const requiredFields = ['source', 'subject', 'overview', 'keyInsights', 'details', 'actionItems', 'category'];
  const hasRequiredFields = requiredFields.every(function(field) {
    return summary.hasOwnProperty(field);
  });
  
  if (!hasRequiredFields) {
    console.error("Missing required fields in summary:", summary);
    return false;
  }
  
  if (!Array.isArray(summary.keyInsights) || !Array.isArray(summary.actionItems)) {
    console.error("Invalid array fields in summary:", summary);
    return false;
  }
  
  return true;
}

/**
 * Create a fallback summary when API fails
 */
function createFallbackSummary(newsletter) {
  return {
    source: newsletter.from || "Unknown",
    subject: newsletter.subject || "No Subject",
    overview: "Newsletter from " + (newsletter.from || "unknown sender") + ". Summary generation failed.",
    keyInsights: [(newsletter.snippet ? newsletter.snippet.substring(0, 200) + "..." : "Content unavailable")],
    details: "Unable to generate full summary due to processing error. Please check the original email for content.",
    actionItems: [],
    quotable: null,
    category: "other",
  };
}

/**
 * Log with timestamp for better debugging
 */
function logWithTimestamp(message, level) {
  if (level === undefined) level = "INFO";
  const timestamp = new Date().toISOString();
  console.log("[" + timestamp + "] [" + level + "] " + message);
}

/**
 * Check if running in Google Apps Script environment
 */
function isGoogleAppsScript() {
  return typeof GmailApp !== 'undefined' && typeof Utilities !== 'undefined';
}

/**
 * Get script execution time remaining (approximate)
 */
function getExecutionTimeRemaining() {
  // Google Apps Script has a 6-minute execution time limit
  // This is a rough estimate - in practice, you should keep executions under 5 minutes
  return 300; // 5 minutes in seconds
}
