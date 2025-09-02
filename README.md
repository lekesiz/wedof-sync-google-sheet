# WeDof Google Sheets Sync v1.1.0

Professional Google Apps Script solution for synchronizing WeDof training data with Google Sheets.

## Overview

This tool provides automated synchronization between the WeDof API and Google Sheets, allowing you to:
- Import training sessions and attendee data
- Combine session and registration information
- Filter data by year for focused analysis
- Automate daily synchronization

## Features

### Core Features
- **Combined Data View**: Merges session information with attendee registrations
- **Year-based Filtering**: Focus on specific years for better data management
- **Automatic Pagination**: Handles large datasets efficiently with GET/POST fallback
- **Rate Limiting**: Respects API limits to ensure stable operation
- **Error Handling**: Robust retry logic and error reporting
- **User-friendly Menu**: Easy-to-use interface within Google Sheets

### New in v1.1.0
- **Webhook Support**: Real-time data updates via webhook endpoints
- **Upsert Functionality**: Smart insert/update operations to prevent duplicates
- **Diagnostic Tools**: Built-in system diagnostics and API testing
- **Duplicate Management**: Remove duplicate records with configurable primary keys
- **Sync Statistics**: Track created/updated records with detailed statistics
- **Enhanced Security**: X-Api-Key authentication and webhook secret support

## Installation

1. Create a new Google Sheet or open an existing one
2. Go to Extensions → Apps Script
3. Delete any existing code
4. Copy all `.gs` files from the `src` directory into the Apps Script editor
5. Save the project

## Configuration

### 1. Set up API Token

1. In your Google Sheet, you'll see a new menu called "WeDof Sync"
2. Click WeDof Sync → Configuration
3. Enter your WeDof API token
4. Optionally configure the API base URL and webhook secret
5. Click Save Configuration

### 2. Manual Configuration (Alternative)

You can also set configuration directly in Apps Script:

1. In Apps Script, go to Project Settings (gear icon)
2. Scroll down to "Script Properties"
3. Add the following properties:
   - `WEDOF_API_TOKEN`: Your WeDof API token (required)
   - `WEDOF_API_BASE`: API base URL (optional, defaults to https://www.wedof.fr/api)
   - `WEBHOOK_SECRET`: Webhook secret for secure webhooks (optional)

## Usage

### Menu Options

The WeDof Sync menu provides the following options:

- **Sync Combined Data (Current Year)**: Synchronizes sessions and registrations for the current year
- **Sync Combined Data (Custom Year)**: Choose a specific year to synchronize
- **Sync All Attendees**: Import all attendee records
- **Sync All Sessions**: Import all training sessions
- **Run Full Sync**: Execute all synchronization tasks
- **Tools** submenu:
  - **Run Diagnostics**: Test API connectivity and system configuration
  - **Remove Duplicates**: Clean up duplicate records in any sheet
  - **Show Webhook URL**: Display webhook endpoint for real-time updates
  - **Show Sync Statistics**: View detailed sync statistics
- **Configuration**: Set up API credentials
- **About**: View information about the tool

### Sheets Created

The tool creates three sheets:

1. **wedof_birlesik_veriler**: Combined session and registration data
2. **wedof_attendees**: All attendee records
3. **wedof_sessions**: All training sessions

### Data Structure

Data is automatically flattened using dot notation for nested objects:
- `session.id`: Session identifier
- `session.startDate`: Session start date
- `session.sessionInfo.trainingTitle`: Training title
- `registration.attendee.firstName`: Attendee first name
- etc.

## Automation

### Set up Daily Sync

To enable automatic daily synchronization:

1. In Apps Script, run the `setupAutomaticSync()` function
2. This creates a daily trigger that runs at 2:00 AM
3. You'll receive email notifications about sync status

### Remove Automation

To disable automatic sync:

1. Run the `removeAllTriggers()` function in Apps Script

## API Rate Limits

The tool implements several measures to respect API limits:
- Automatic retry with exponential backoff
- Rate limiting between requests
- Chunked data processing
- Configurable page sizes

## Error Handling

- All errors are logged to the Apps Script console
- User-friendly error messages in the UI
- Email notifications for automated sync failures
- Partial data recovery on errors

## Development

### Project Structure

```
src/
├── Config.gs        # Configuration management
├── Utils.gs         # Utility functions
├── HttpClient.gs    # HTTP communication with GET/POST fallback
├── WedofSync.gs     # Main synchronization logic
├── Menu.gs          # User interface and menus
├── Triggers.gs      # Automation and triggers
├── Webhook.gs       # Webhook endpoints (doGet/doPost)
├── Upsert.gs        # Smart insert/update operations
└── Diagnostics.gs   # System diagnostics and testing
```

### Code Standards

- Modular architecture with clear separation of concerns
- JSDoc documentation for all functions
- Consistent error handling and logging
- Performance optimizations for large datasets

## Troubleshooting

### Common Issues

1. **"WEDOF_API_TOKEN is not configured"**
   - Solution: Set your API token via Configuration menu

2. **HTTP 401 Unauthorized**
   - Solution: Verify your API token is correct

3. **HTTP 429 Too Many Requests**
   - Solution: The tool will automatically retry; if persistent, reduce request frequency

4. **No data appearing**
   - Check the year filter matches your data
   - Verify API endpoint URLs are correct

### Debug Mode

Enable detailed logging:
1. View → Logs in Apps Script editor
2. Check execution transcript for detailed information

## Support

For issues or feature requests, please contact your development team or create an issue in the project repository.

## License

This project is proprietary software. All rights reserved.

## Webhook Integration

### Setting up Webhooks

1. Get your webhook URL:
   - Go to WeDof Sync → Tools → Show Webhook URL
   - Copy the displayed URL

2. Configure in WeDof:
   - Add the webhook URL to your WeDof account
   - Set up events you want to receive (session.created, attendee.updated, etc.)

3. Test the webhook:
   - Visit `[your-webhook-url]?action=probe` to test connectivity
   - Visit `[your-webhook-url]?action=status` to check sync status

### Webhook Endpoints

- **GET /exec?action=probe**: Returns system information
- **GET /exec?action=status**: Returns sync statistics
- **GET /exec?action=test**: Simple connectivity test
- **POST /exec**: Receives webhook events from WeDof

### Webhook Security

- Configure a webhook secret in Script Properties
- The webhook will validate the `X-Webhook-Secret` header
- All webhook data is automatically upserted to prevent duplicates

## Advanced Features

### Diagnostics

Run comprehensive system diagnostics:
1. Go to WeDof Sync → Tools → Run Diagnostics
2. The diagnostic tool will test:
   - API configuration
   - API connectivity
   - Spreadsheet access
   - Webhook configuration
   - Data operations

### Data Management

**Remove Duplicates:**
1. Go to WeDof Sync → Tools → Remove Duplicates
2. Select the sheet to clean
3. Specify the primary key field (default: 'id')
4. Click Remove Duplicates

**Upsert Behavior:**
- All sync operations now use upsert (insert or update)
- Records are matched by their primary key
- Existing records are updated, new records are inserted
- Prevents duplicate data accumulation

## Version History

- **1.1.0** - Added webhook support, upsert functionality, diagnostics, and enhanced pagination
- **1.0.0** - Initial release with core synchronization features