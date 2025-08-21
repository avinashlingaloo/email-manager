/**
 * Newsletter Summarizer for Google Apps Script
 * Automatically fetches, summarizes, and emails newsletter digests
 */

// Configuration - Uses Script Properties for all settings
const CONFIG = {
  // Email settings
  recipientEmail: getScriptProperty('RECIPIENT_EMAIL') || 'your_email@gmail.com',
  senderName: getScriptProperty('SENDER_NAME') || 'Newsletter Digest Bot',
  
  // Search settings
  daysToSearch: parseInt(getScriptProperty('DAYS_TO_SEARCH')) || 1,
  searchQuery: getScriptProperty('SEARCH_QUERY') || 'unsubscribe OR "view in browser" OR from:substack OR from:medium -in:spam',
  maxEmailsToProcess: parseInt(getScriptProperty('MAX_EMAILS_TO_PROCESS')) || 20,
  
  // Gemini API settings (get key from https://makersuite.google.com/app/apikey)
  geminiApiKey: getScriptProperty('GEMINI_API_KEY') || '',
  geminiModel: getScriptProperty('GEMINI_MODEL') || 'gemini-1.5-flash',
  
  // Label management
  labelName: getScriptProperty('LABEL_NAME') || 'Newsletter-Processed',
};

// Helper functions are now in Utils.gs for better organization

/**
 * Function to set up script properties (run this once)
 * IMPORTANT: Update these values with your actual configuration
 */
function setupScriptProperties() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Set your configuration values
    properties.setProperty('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY_HERE'); // REQUIRED: Add your actual API key
    properties.setProperty('RECIPIENT_EMAIL', 'your_email@gmail.com'); // REQUIRED: Add your actual email
    properties.setProperty('SENDER_NAME', 'Newsletter Digest Bot');
    properties.setProperty('DAYS_TO_SEARCH', '1');
    properties.setProperty('SEARCH_QUERY', 'unsubscribe OR "view in browser" OR from:substack OR from:medium -in:spam');
    properties.setProperty('MAX_EMAILS_TO_PROCESS', '20');
    properties.setProperty('GEMINI_MODEL', 'gemini-1.5-flash');
    properties.setProperty('LABEL_NAME', 'Newsletter-Processed');
    
    console.log('Script properties set successfully!');
    console.log('Remember to update GEMINI_API_KEY and RECIPIENT_EMAIL with your actual values.');
    
  } catch (error) {
    console.error('Error setting script properties:', error);
  }
}

/**
 * Function to view current script properties
 */
function viewScriptProperties() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const allProps = properties.getProperties();
    
    console.log('Current Script Properties:');
    Object.keys(allProps).forEach(key => {
      if (key === 'GEMINI_API_KEY') {
        // Mask API key for security
        const masked = allProps[key].substring(0, 10) + '...' + allProps[key].substring(allProps[key].length - 4);
        console.log(`${key}: ${masked}`);
      } else {
        console.log(`${key}: ${allProps[key]}`);
      }
    });
    
  } catch (error) {
    console.error('Error viewing script properties:', error);
  }
}

/**
 * Main function - Run this manually or via trigger
 */
function processNewsletters() {
  try {
    console.log('Starting newsletter processing...');
    
    // Validate configuration before processing
    validateConfiguration();
    
    // Get newsletters from Gmail
    const newsletters = fetchNewsletters();
    
    if (newsletters.length === 0) {
      console.log('No new newsletters found');
      return;
    }
    
    console.log(`Found ${newsletters.length} newsletters to process`);
    
    // Summarize newsletters
    const summaries = summarizeNewsletters(newsletters);
    
    // Send digest email
    sendDigestEmail(summaries);
    
    // Mark emails as processed
    markEmailsAsProcessed(newsletters);
    
    console.log('Newsletter processing completed successfully');
    
  } catch (error) {
    console.error('Error processing newsletters:', error);
    // Send error notification
    GmailApp.sendEmail(
      CONFIG.recipientEmail,
      'Newsletter Digest - Error',
      `An error occurred: ${error.toString()}`
    );
  }
}

/**
 * Fetch newsletters from Gmail
 */
function fetchNewsletters() {
  const newsletters = [];
  
  // Create or get the label
  const label = getOrCreateLabel(CONFIG.labelName);
  
  // Build search query with date range
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - CONFIG.daysToSearch);
  const formattedDate = Utilities.formatDate(dateFrom, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  
  // Exclude already processed emails
  const searchQuery = `(${CONFIG.searchQuery}) after:${formattedDate} -label:${CONFIG.labelName}`;
  
  // Search for threads
  const threads = GmailApp.search(searchQuery, 0, CONFIG.maxEmailsToProcess);
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    const latestMessage = messages[messages.length - 1];
    
    // Extract newsletter data
    newsletters.push({
      id: latestMessage.getId(),
      thread: thread,
      subject: latestMessage.getSubject(),
      from: latestMessage.getFrom(),
      date: latestMessage.getDate(),
      body: extractTextFromEmail(latestMessage),
      snippet: latestMessage.getPlainBody().substring(0, 500)
    });
  });
  
  return newsletters;
}

/**
 * Extract text content from email
 */
function extractTextFromEmail(message) {
  let body = message.getPlainBody();
  
  // If plain text is empty, try to extract from HTML
  if (!body || body.trim().length < 100) {
    const htmlBody = message.getBody();
    // Basic HTML to text conversion
    body = htmlBody
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Increase length for comprehensive summaries
  return body.substring(0, 5000);
}

/**
 * Summarize newsletters using Gemini API
 */
function summarizeNewsletters(newsletters) {
  const summaries = [];
  
  // Process individually for better quality summaries
  newsletters.forEach((newsletter, index) => {
    console.log(`Summarizing ${index + 1}/${newsletters.length}: ${newsletter.subject}`);
    
    const prompt = `
      You are an expert newsletter reader who creates comprehensive yet digestible summaries.
      
      Analyze this newsletter and provide a COMPLETE summary that captures all important information.
      
      Newsletter:
      FROM: ${newsletter.from}
      SUBJECT: ${newsletter.subject}
      DATE: ${newsletter.date}
      CONTENT: ${newsletter.body}
      
      Create a summary with:
      1. "overview": A 2-3 sentence overview capturing the main theme and purpose
      2. "keyInsights": Array of 4-6 major points, insights, or findings (full sentences, not fragments)
      3. "details": A paragraph (3-5 sentences) with important context, data, examples, or arguments
      4. "actionItems": Any specific recommendations, links, resources, or calls to action mentioned
      5. "quotable": One memorable quote or key statistic if present (or null)
      6. "category": tech/business/marketing/productivity/news/personal/other
      
      Format as JSON:
      {
        "source": "Newsletter name/sender",
        "subject": "Original subject",
        "overview": "2-3 sentence comprehensive overview",
        "keyInsights": ["complete insight 1", "complete insight 2", ...],
        "details": "Additional important context and details paragraph",
        "actionItems": ["action 1", "link 1", ...],
        "quotable": "memorable quote or stat",
        "category": "category"
      }
      
      Ensure the summary is comprehensive enough that someone could understand the newsletter's full message without reading the original.
    `;
    
    try {
      const summary = callGeminiAPI(prompt);
      const parsed = JSON.parse(summary);
      summaries.push(parsed);
    } catch (error) {
      console.error('Error summarizing newsletter:', error);
      // More detailed fallback
      summaries.push({
        source: newsletter.from,
        subject: newsletter.subject,
        overview: `Newsletter from ${newsletter.from}. Summary generation failed.`,
        keyInsights: [newsletter.snippet.substring(0, 200) + '...'],
        details: 'Unable to generate full summary due to processing error.',
        actionItems: [],
        quotable: null,
        category: 'other'
      });
    }
    
    // Small delay to avoid rate limits
    Utilities.sleep(1000);
  });
  
  return summaries;
}

/**
 * Call Gemini API for text generation
 */
function callGeminiAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${CONFIG.geminiApiKey}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.error) {
    throw new Error(`Gemini API error: ${result.error.message}`);
  }
  
  return result.candidates[0].content.parts[0].text;
}

/**
 * Send digest email with summaries
 */
function sendDigestEmail(summaries) {
  const date = new Date();
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy');
  
  // Group summaries by category
  const grouped = {};
  summaries.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });
  
  // Category colors and icons (using HTML entities and Unicode for better compatibility)
  const categoryStyles = {
    tech: { color: '#6366f1', icon: '&#128187;', iconText: '[TECH]', bg: '#eef2ff' },
    business: { color: '#10b981', icon: '&#128188;', iconText: '[BIZ]', bg: '#f0fdf4' },
    marketing: { color: '#f59e0b', icon: '&#128226;', iconText: '[MKT]', bg: '#fef3c7' },
    productivity: { color: '#8b5cf6', icon: '&#9889;', iconText: '[PROD]', bg: '#f3e8ff' },
    news: { color: '#ef4444', icon: '&#128240;', iconText: '[NEWS]', bg: '#fee2e2' },
    personal: { color: '#ec4899', icon: '&#127775;', iconText: '[PERS]', bg: '#fce7f3' },
    other: { color: '#6b7280', icon: '&#128204;', iconText: '[OTHER]', bg: '#f3f4f6' }
  };
  
  // Build HTML email
  let htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Newsletter Digest</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table style="width: 100%; background-color: #f9fafb; padding: 20px 0;">
        <tr>
          <td align="center">
            <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                  Newsletter Digest
                </h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 18px;">
                  ${dateStr}
                </p>
              </div>
              
              <!-- Summary Bar -->
              <div style="background: #fafafa; padding: 20px 30px; border-bottom: 1px solid #e5e7eb;">
                <table style="width: 100%;">
                  <tr>
                    <td align="center" style="padding: 0 15px;">
                      <div style="font-size: 28px; font-weight: 700; color: #667eea;">${summaries.length}</div>
                      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Newsletters</div>
                    </td>
                    <td align="center" style="padding: 0 15px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                      <div style="font-size: 28px; font-weight: 700; color: #764ba2;">${summaries.reduce((acc, s) => acc + s.keyInsights.length, 0)}</div>
                      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Insights</div>
                    </td>
                    <td align="center" style="padding: 0 15px;">
                      <div style="font-size: 28px; font-weight: 700; color: #667eea;">${summaries.reduce((acc, s) => acc + (s.actionItems?.length || 0), 0)}</div>
                      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Actions</div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Content -->
              <div style="padding: 30px;">
  `;
  
  // Add summaries by category
  Object.keys(grouped).sort().forEach(category => {
    const style = categoryStyles[category] || categoryStyles.other;
    
    htmlBody += `
      <!-- Category Header -->
      <div style="margin-bottom: 30px;">
        <div style="display: inline-block; background: ${style.bg}; padding: 8px 16px; border-radius: 8px; margin-bottom: 20px;">
          <span style="font-size: 20px; margin-right: 8px; color: ${style.color};">${style.icon}</span>
          <span style="color: ${style.color}; font-weight: 600; font-size: 16px; text-transform: capitalize;">
            ${category}
          </span>
          <span style="color: #6b7280; margin-left: 8px;">(${grouped[category].length})</span>
        </div>
    `;
    
    grouped[category].forEach((item, index) => {
      htmlBody += `
        <!-- Newsletter Card -->
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 20px; overflow: hidden; transition: all 0.2s;">
          
          <!-- Card Header -->
          <div style="background: linear-gradient(to right, ${style.bg}, #ffffff); padding: 20px; border-bottom: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600; line-height: 1.4;">
              ${item.subject}
            </h3>
            <div style="color: #6b7280; font-size: 13px;">
              <span style="color: ${style.color}; font-weight: 500;">${item.source}</span>
            </div>
          </div>
          
          <!-- Card Body -->
          <div style="padding: 20px;">
            
            <!-- Overview Box -->
            <div style="background: linear-gradient(to right, #f9fafb, #ffffff); border-left: 3px solid ${style.color}; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
              <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6; font-style: italic;">
                ${item.overview}
              </p>
            </div>
            
            <!-- Key Insights -->
            <div style="margin-bottom: 20px;">
              <h4 style="color: #374151; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Key Insights
              </h4>
              ${item.keyInsights.map((insight, i) => `
                <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                  <div style="min-width: 24px; height: 24px; background: ${style.bg}; color: ${style.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; margin-right: 12px; margin-top: 2px;">
                    ${i + 1}
                  </div>
                  <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5; flex: 1;">
                    ${insight}
                  </p>
                </div>
              `).join('')}
            </div>
            
            <!-- Details Section -->
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Context & Details
              </h4>
              <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">
                ${item.details}
              </p>
            </div>
            
            ${item.quotable ? `
            <!-- Quote -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; position: relative;">
              <div style="position: absolute; top: 10px; left: 15px; font-size: 30px; color: #f59e0b; opacity: 0.3;">&ldquo;</div>
              <p style="color: #92400e; font-size: 14px; font-style: italic; margin: 0; padding-left: 20px; line-height: 1.5;">
                ${item.quotable}
              </p>
            </div>
            ` : ''}
            
            ${item.actionItems && item.actionItems.length > 0 ? `
            <!-- Action Items -->
            <div style="background: linear-gradient(to right, #f0fdf4, #ffffff); border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px;">
              <h4 style="color: #166534; margin: 0 0 10px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Actions & Resources
              </h4>
              ${item.actionItems.map(action => `
                <div style="color: #166534; font-size: 13px; margin-bottom: 6px; padding-left: 20px; position: relative;">
                  <span style="position: absolute; left: 0; color: #166534;">&rarr;</span>
                  ${action}
                </div>
              `).join('')}
            </div>
            ` : ''}
            
          </div>
        </div>
      `;
    });
    
    htmlBody += `</div>`;
  });
  
  htmlBody += `
              </div>
              
              <!-- Footer -->
              <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
                  Automatically curated by Newsletter Summarizer
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                  Processed ${summaries.length} newsletters from the last ${CONFIG.daysToSearch} day(s)
                </p>
              </div>
              
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  // Send email
  GmailApp.sendEmail(
    CONFIG.recipientEmail,
    `Newsletter Digest - ${dateStr} (${summaries.length} newsletters)`,
    `Newsletter Digest for ${dateStr}\n\nView this email in HTML for better formatting.`,
    {
      htmlBody: htmlBody,
      name: CONFIG.senderName
    }
  );
  
  console.log(`Digest email sent with ${summaries.length} comprehensive summaries`);
}

/**
 * Mark processed emails with label
 */
function markEmailsAsProcessed(newsletters) {
  const label = getOrCreateLabel(CONFIG.labelName);
  
  newsletters.forEach(newsletter => {
    newsletter.thread.addLabel(label);
  });
  
  console.log(`Marked ${newsletters.length} emails as processed`);
}

/**
 * Get or create a Gmail label
 */
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  
  if (!label) {
    label = GmailApp.createLabel(labelName);
    console.log(`Created new label: ${labelName}`);
  }
  
  return label;
}

/**
 * Set up daily trigger (run this once)
 */
function setupDailyTrigger() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processNewsletters') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger at 8 AM
  ScriptApp.newTrigger('processNewsletters')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  
  console.log('Daily trigger set up for 8 AM');
}

/**
 * Test function with sample data
 */
function testWithSampleData() {
  const sampleSummaries = [
    {
      source: "Medium - The NewGenCoder",
      subject: "TypeScript Beyond the Frontend: How It Powers Modern Development",
      overview: "TypeScript has evolved from a frontend-focused language to a universal solution for modern development. This article explores how TypeScript is transforming backend development, mobile apps, desktop applications, and DevOps tooling, becoming the default choice for large-scale JavaScript projects.",
      keyInsights: [
        "TypeScript adoption in Node.js backends has increased by 300% in the last two years, with major frameworks like NestJS leading the charge",
        "React Native and Expo now offer first-class TypeScript support, making type-safe mobile development the new standard",
        "DevOps tools like Pulumi and CDK use TypeScript for infrastructure-as-code, bringing type safety to cloud deployments",
        "Electron apps including VS Code and Discord leverage TypeScript for maintainable desktop application development",
        "The TypeScript compiler's incremental compilation and project references have solved the performance issues that previously limited large-scale adoption"
      ],
      details: "The article presents compelling evidence that TypeScript's type system provides a 40% reduction in production bugs according to Microsoft's internal studies. It highlights real-world case studies from Airbnb, Netflix, and Slack showing how TypeScript enabled them to scale their engineering teams while maintaining code quality. The piece also discusses the ecosystem maturity, with over 90% of popular npm packages now shipping with TypeScript definitions.",
      actionItems: [
        "Explore NestJS for building scalable Node.js backends",
        "Check out the TypeScript Deep Dive book (free online)",
        "Try Pulumi for type-safe infrastructure management"
      ],
      quotable: "TypeScript isn't just JavaScript with types—it's a paradigm shift in how we think about large-scale JavaScript applications",
      category: "tech"
    },
    {
      source: "GitHub - Mattermost",
      subject: "Mobile App Version 2.32.0 Release",
      overview: "Mattermost mobile app version 2.32.0 has been released with build number 665. This release includes bug fixes, performance improvements, and new playbook features for mobile users.",
      keyInsights: [
        "New bottom sheet UI for playbooks checklist items improves mobile task management",
        "Performance optimizations reduce app startup time by 15%",
        "Fixed critical bug affecting notification delivery on iOS devices",
        "Added missing translation strings for 5 additional languages"
      ],
      details: "This release represents three weeks of development effort with contributions from 12 developers. The playbooks integration allows mobile users to participate more effectively in incident response workflows. The team has also laid groundwork for upcoming features including improved file sharing and voice message support planned for Q3 2025.",
      actionItems: [
        "Update to version 2.32.0 via app stores",
        "Review breaking changes in the changelog",
        "Test playbook features in staging environment"
      ],
      quotable: null,
      category: "tech"
    }
  ];
  
  sendDigestEmail(sampleSummaries);
}
