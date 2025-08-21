# 📰 Newsletter Summarizer for Google Apps Script

Automatically fetch, summarize, and email newsletter digests using Google's Gemini AI API. This Google Apps Script project processes your Gmail newsletters and sends you beautiful, comprehensive summaries with key insights, action items, and categorized content.

## ✨ Features

- **🎨 Modern Email Design**: Beautiful, responsive HTML emails with gradient headers and card-based layouts
- **🤖 AI-Powered Summaries**: Uses Gemini API for intelligent content analysis and categorization
- **📊 Smart Statistics**: Visual summary bar showing newsletters, insights, and action items count
- **🏷️ Category Organization**: Automatically categorizes newsletters by topic with color-coded styling
- **⚡ Automatic Processing**: Runs daily to process new newsletters automatically
- **📧 Gmail Integration**: Seamlessly works with your Gmail account and labels
- **🔄 Error Handling**: Robust error handling with fallback summaries

## 🚀 Quick Start

### 1. Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Delete the default `Code.gs` file

### 2. Add Project Files

Copy the following files into your Google Apps Script project:

- `Code.gs` - Main application logic with configuration
- `Config.gs` - Backward compatibility (optional)
- `Utils.gs` - Utility functions (optional)
- `README.md` - This documentation

### 3. Configure Settings

Edit the `CONFIG` object in `Code.gs`:

```javascript
const CONFIG = {
  recipientEmail: 'your-email@gmail.com', // Your email address
  geminiApiKey: 'your-api-key-here',     // Get from https://makersuite.google.com/app/apikey
  
  // Customize search query for your newsletters
  searchQuery: 'unsubscribe OR "view in browser" OR from:substack OR from:medium -in:spam',
  
  // Adjust processing frequency
  daysToSearch: 1, // How many days back to search
};
```

### 4. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to `Code.gs` in the `geminiApiKey` field

### 5. Set Up Daily Trigger

Run the `setupDailyTrigger()` function once to schedule daily processing at 8 AM.

### 6. Test the System

Run `testWithSampleData()` to test the email formatting with sample data.

## 📁 Project Structure

```
Newsletter Summarizer/
├── Code.gs          # Main application logic & configuration
├── Config.gs        # Backward compatibility (optional)
├── Utils.gs         # Utility functions (optional)
└── README.md        # This file
```

## 🎨 Email Design Features

### Modern Visual Elements

- **Gradient Headers**: Beautiful purple-to-blue gradient header
- **Card Layout**: Clean, modern card design for each newsletter
- **Color Coding**: Category-specific colors and emojis
- **Responsive Design**: Mobile-friendly email layout
- **Visual Hierarchy**: Clear typography and spacing

### Category Styling

- **Tech** 💻 - Indigo theme
- **Business** 💼 - Green theme  
- **Marketing** 📢 - Amber theme
- **Productivity** ⚡ - Purple theme
- **News** 📰 - Red theme
- **Personal** 🌟 - Pink theme
- **Other** 📌 - Gray theme

## ⚙️ Configuration Options

### Email Settings

- `recipientEmail`: Where to send digest emails
- `senderName`: Name shown as sender

### Search Settings

- `daysToSearch`: How many days back to search for newsletters
- `searchQuery`: Gmail search query to identify newsletters
- `maxEmailsToProcess`: Maximum emails to process per run

### AI Settings

- `geminiApiKey`: Your Gemini API key (REQUIRED)
- `geminiModel`: AI model to use (gemini-1.5-flash or gemini-1.5-pro)

## 🔍 Customizing Newsletter Detection

Modify the `searchQuery` in `Code.gs` to match your newsletter patterns:

```javascript
// Examples:
searchQuery: 'unsubscribe OR "view in browser" -in:spam'  // Generic newsletters
searchQuery: 'from:substack OR from:medium OR from:newsletter'  // Specific senders
searchQuery: 'subject:"weekly digest" OR subject:"newsletter"'  // Subject patterns
```

## 📧 Email Digest Format

Each digest email includes:

- **📬 Header**: Beautiful gradient header with date
- **📊 Summary Bar**: Statistics showing newsletters, insights, and actions
- **🏷️ Categories**: Organized by topic with color-coded styling
- **📋 Newsletter Cards**: Individual cards for each newsletter containing:
  - **Overview**: 2-3 sentence summary
  - **Key Insights**: Numbered list of major points
  - **Context & Details**: Additional information
  - **Quotes**: Memorable quotes or statistics (if present)
  - **Actions & Resources**: Recommendations and links
- **🤖 Footer**: Attribution and processing information

## 🛠️ Available Functions

### Main Functions

- `processNewsletters()` - Main processing function
- `setupDailyTrigger()` - Set up daily automation
- `testWithSampleData()` - Test with sample data

### Utility Functions (in Utils.gs)

- `extractTextFromEmail()` - Extract text from email content
- `convertHtmlToText()` - Convert HTML to plain text
- `validateNewsletterSummary()` - Validate AI responses
- `createFallbackSummary()` - Create fallback when API fails

## 🔒 Security & Privacy

- **API Key**: Store your Gemini API key securely in `Code.gs`
- **Gmail Access**: Only accesses emails matching your search criteria
- **Data Processing**: All processing happens within Google's secure environment
- **No External Storage**: No data is stored outside your Gmail account

## 📊 Performance Considerations

- **Execution Time**: Google Apps Script has a 6-minute execution limit
- **Rate Limiting**: Built-in delays prevent API rate limit issues
- **Batch Processing**: Processes multiple newsletters efficiently
- **Memory Management**: Optimized for large email content

## 🚨 Troubleshooting

### Common Issues

1. **API Key Errors**: Verify your Gemini API key is correct
2. **No Emails Found**: Check your search query and date range
3. **Execution Timeout**: Reduce `maxEmailsToProcess` or email body length
4. **Permission Errors**: Ensure Gmail access is enabled

### Debug Mode

Enable detailed logging by running:

```javascript
function enableDebugMode() {
  console.log("Debug mode enabled");
  // Add your debug code here
}
```

## 🔄 Automation

### Daily Trigger

The system automatically runs daily at 8 AM to process new newsletters.

### Manual Execution

Run `processNewsletters()` manually anytime to process newsletters immediately.

### Custom Scheduling

Modify `setupDailyTrigger()` to change frequency or timing.

## 📈 Monitoring & Analytics

- **Execution Logs**: View in Google Apps Script execution history
- **Email Statistics**: Each digest includes processing statistics
- **Error Notifications**: Automatic error emails for failed runs
- **Label Tracking**: Monitor processed emails with Gmail labels

## 🤝 Contributing

This project is designed for personal use but can be extended with:

- Additional AI providers
- Custom email templates
- Advanced filtering options
- Integration with other services

## 📄 License

This project is for personal use. Please respect Google Apps Script and Gemini API terms of service.

## 🆘 Support

For issues or questions:

1. Check the execution logs in Google Apps Script
2. Verify your configuration settings
3. Test with the sample data function
4. Ensure all required permissions are granted

---

**Happy Newsletter Summarizing! 📚✨**
