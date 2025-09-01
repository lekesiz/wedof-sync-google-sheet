/**
 * Menu and UI Module
 * @module Menu
 */

/**
 * Create custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('WeDof Sync')
    .addItem('🔄 Sync Combined Data (Current Year)', 'syncCurrentYear')
    .addItem('📅 Sync Combined Data (Custom Year)...', 'syncCustomYear')
    .addSeparator()
    .addItem('👥 Sync All Attendees', 'syncAllAttendees')
    .addItem('📚 Sync All Sessions', 'syncAllSessions')
    .addSeparator()
    .addItem('🚀 Run Full Sync', 'runFullSync')
    .addSeparator()
    .addItem('⚙️ Configuration', 'showConfigurationDialog')
    .addItem('ℹ️ About', 'showAboutDialog')
    .addToUi();
}

/**
 * Sync current year data
 */
function syncCurrentYear() {
  syncCombinedSessionAndAttendeeData();
}

/**
 * Sync custom year data with user input
 */
function syncCustomYear() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.prompt(
    'Select Year',
    'Enter the year to synchronize (e.g., 2025):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const year = response.getResponseText().trim();
    
    if (/^\d{4}$/.test(year)) {
      syncCombinedSessionAndAttendeeData(year);
    } else {
      ui.alert('Invalid Year', 'Please enter a valid 4-digit year.', ui.ButtonSet.OK);
    }
  }
}

/**
 * Show configuration dialog
 */
function showConfigurationDialog() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .config-item { margin-bottom: 15px; }
          label { display: block; font-weight: bold; margin-bottom: 5px; }
          input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
          button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            margin-right: 10px;
          }
          button:hover { background-color: #45a049; }
          .cancel { background-color: #f44336; }
          .cancel:hover { background-color: #da190b; }
          .info { background-color: #e7f3ff; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>WeDof API Configuration</h2>
        <div class="info">
          Configure your WeDof API credentials below. These values are stored securely in Script Properties.
        </div>
        
        <div class="config-item">
          <label for="apiToken">API Token (Required):</label>
          <input type="text" id="apiToken" placeholder="Enter your WeDof API token">
        </div>
        
        <div class="config-item">
          <label for="apiBase">API Base URL (Optional):</label>
          <input type="text" id="apiBase" placeholder="https://www.wedof.fr/api">
        </div>
        
        <div class="config-item">
          <label for="webhookSecret">Webhook Secret (Optional):</label>
          <input type="text" id="webhookSecret" placeholder="Enter webhook secret if using webhooks">
        </div>
        
        <button onclick="saveConfiguration()">Save Configuration</button>
        <button class="cancel" onclick="google.script.host.close()">Cancel</button>
        
        <script>
          // Load current values
          google.script.run.withSuccessHandler(function(config) {
            document.getElementById('apiToken').value = config.token || '';
            document.getElementById('apiBase').value = config.baseUrl || '';
            document.getElementById('webhookSecret').value = config.webhookSecret || '';
          }).getConfiguration();
          
          function saveConfiguration() {
            const config = {
              token: document.getElementById('apiToken').value,
              baseUrl: document.getElementById('apiBase').value,
              webhookSecret: document.getElementById('webhookSecret').value
            };
            
            google.script.run
              .withSuccessHandler(function() {
                google.script.host.close();
              })
              .withFailureHandler(function(error) {
                alert('Error saving configuration: ' + error);
              })
              .saveConfiguration(config);
          }
        </script>
      </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(500)
    .setHeight(400);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'WeDof Configuration');
}

/**
 * Get current configuration for dialog
 */
function getConfiguration() {
  return {
    token: getConfig(CONFIG.PROPS.API_TOKEN) || '',
    baseUrl: getConfig(CONFIG.PROPS.API_BASE_URL) || '',
    webhookSecret: getConfig(CONFIG.PROPS.WEBHOOK_SECRET) || ''
  };
}

/**
 * Save configuration from dialog
 */
function saveConfiguration(config) {
  if (config.token) {
    setConfig(CONFIG.PROPS.API_TOKEN, config.token);
  }
  if (config.baseUrl) {
    setConfig(CONFIG.PROPS.API_BASE_URL, config.baseUrl);
  }
  if (config.webhookSecret) {
    setConfig(CONFIG.PROPS.WEBHOOK_SECRET, config.webhookSecret);
  }
  
  showToast('Configuration saved successfully!');
}

/**
 * Show about dialog
 */
function showAboutDialog() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #333; }
          .feature { margin: 10px 0; }
          .feature-icon { color: #4CAF50; margin-right: 5px; }
          a { color: #1a73e8; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h2>WeDof Google Sheets Sync</h2>
        <p>Professional integration tool for synchronizing WeDof training data with Google Sheets.</p>
        
        <h3>Features:</h3>
        <div class="feature">
          <span class="feature-icon">✓</span> Synchronize training sessions and attendee data
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span> Combined data view with session and registration details
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span> Year-based filtering for focused data analysis
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span> Automatic pagination and rate limiting
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span> Error handling and retry logic
        </div>
        
        <h3>Usage:</h3>
        <ol>
          <li>Configure your API token in the Configuration menu</li>
          <li>Use the menu options to sync data</li>
          <li>Data will be written to designated sheets</li>
        </ol>
        
        <p style="margin-top: 20px;">
          <strong>Version:</strong> 1.0.0<br>
          <strong>Author:</strong> Professional Development Team<br>
          <strong>Repository:</strong> <a href="https://github.com/yourusername/wedof-sync-google-sheet" target="_blank">GitHub</a>
        </p>
      </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(500);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'About WeDof Sync');
}