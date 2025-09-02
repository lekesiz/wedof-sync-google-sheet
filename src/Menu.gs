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
    .addSubMenu(ui.createMenu('🔧 Tools')
      .addItem('🩺 Run Diagnostics', 'runDiagnostics')
      .addItem('🧹 Remove Duplicates...', 'showRemoveDuplicatesDialog')
      .addItem('🔗 Show Webhook URL', 'showWebhookUrl')
      .addItem('📊 Show Sync Statistics', 'showSyncStatistics'))
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
          <span class="feature-icon">✓</span> Webhook support for real-time updates
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span> Upsert functionality to prevent duplicates
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span> Diagnostic tools for troubleshooting
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span> Automatic pagination with GET/POST fallback
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span> Error handling and retry logic
        </div>
        
        <h3>Usage:</h3>
        <ol>
          <li>Configure your API token in the Configuration menu</li>
          <li>Use the menu options to sync data</li>
          <li>Data will be written to designated sheets</li>
          <li>Configure webhooks for real-time updates (optional)</li>
        </ol>
        
        <p style="margin-top: 20px;">
          <strong>Version:</strong> 1.1.0<br>
          <strong>Author:</strong> Professional Development Team<br>
          <strong>Repository:</strong> <a href="https://github.com/lekesiz/wedof-sync-google-sheet" target="_blank">GitHub</a>
        </p>
      </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(550);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'About WeDof Sync');
}

/**
 * Show remove duplicates dialog
 */
function showRemoveDuplicatesDialog() {
  const ui = SpreadsheetApp.getUi();
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets()
    .map(sheet => sheet.getName())
    .filter(name => !name.startsWith('_'));
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .form-group { margin-bottom: 15px; }
          label { display: block; font-weight: bold; margin-bottom: 5px; }
          select, input { 
            width: 100%; 
            padding: 8px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
          }
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
          .warning { 
            background-color: #fff3cd; 
            border: 1px solid #ffeeba; 
            color: #856404; 
            padding: 10px; 
            border-radius: 4px; 
            margin-bottom: 15px; 
          }
        </style>
      </head>
      <body>
        <h2>Remove Duplicates</h2>
        <div class="warning">
          ⚠️ This action will permanently remove duplicate records. Make sure to backup your data first!
        </div>
        
        <div class="form-group">
          <label for="sheetName">Select Sheet:</label>
          <select id="sheetName">
            ${sheets.map(name => `<option value="${name}">${name}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label for="primaryKey">Primary Key Field:</label>
          <input type="text" id="primaryKey" value="id" placeholder="Enter the field to use as primary key">
        </div>
        
        <button onclick="removeDuplicates()">Remove Duplicates</button>
        <button class="cancel" onclick="google.script.host.close()">Cancel</button>
        
        <script>
          function removeDuplicates() {
            const sheetName = document.getElementById('sheetName').value;
            const primaryKey = document.getElementById('primaryKey').value;
            
            if (!primaryKey) {
              alert('Please enter a primary key field');
              return;
            }
            
            google.script.run
              .withSuccessHandler(function(count) {
                alert(`Removed ${count} duplicate records from ${sheetName}`);
                google.script.host.close();
              })
              .withFailureHandler(function(error) {
                alert('Error: ' + error);
              })
              .removeDuplicates(sheetName, primaryKey);
          }
        </script>
      </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(400);
    
  ui.showModalDialog(htmlOutput, 'Remove Duplicates');
}

/**
 * Show sync statistics
 */
function showSyncStatistics() {
  const lastSync = PropertiesService.getScriptProperties().getProperty('LAST_SYNC_TIME');
  const syncStats = JSON.parse(PropertiesService.getScriptProperties().getProperty('SYNC_STATS') || '{}');
  
  let statsHtml = '<table style="width: 100%; border-collapse: collapse;">';
  statsHtml += '<tr><th style="text-align: left; padding: 5px; border-bottom: 2px solid #ddd;">Category</th>';
  statsHtml += '<th style="text-align: right; padding: 5px; border-bottom: 2px solid #ddd;">Created</th>';
  statsHtml += '<th style="text-align: right; padding: 5px; border-bottom: 2px solid #ddd;">Updated</th>';
  statsHtml += '<th style="text-align: right; padding: 5px; border-bottom: 2px solid #ddd;">Last Event</th></tr>';
  
  Object.entries(syncStats).forEach(([category, stats]) => {
    const lastEvent = stats.lastEvent ? new Date(stats.lastEvent).toLocaleString() : 'Never';
    statsHtml += `<tr>`;
    statsHtml += `<td style="padding: 5px; border-bottom: 1px solid #eee;">${category}</td>`;
    statsHtml += `<td style="text-align: right; padding: 5px; border-bottom: 1px solid #eee;">${stats.created || 0}</td>`;
    statsHtml += `<td style="text-align: right; padding: 5px; border-bottom: 1px solid #eee;">${stats.updated || 0}</td>`;
    statsHtml += `<td style="text-align: right; padding: 5px; border-bottom: 1px solid #eee; font-size: 0.9em;">${lastEvent}</td>`;
    statsHtml += `</tr>`;
  });
  
  statsHtml += '</table>';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #333; }
          .info-box { 
            background-color: #e7f3ff; 
            padding: 15px; 
            border-radius: 4px; 
            margin-bottom: 20px; 
          }
          button { 
            background-color: #f44336; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            margin-top: 20px;
          }
          button:hover { background-color: #da190b; }
        </style>
      </head>
      <body>
        <h2>Sync Statistics</h2>
        <div class="info-box">
          <strong>Last Sync:</strong> ${lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
        </div>
        
        ${Object.keys(syncStats).length > 0 ? statsHtml : '<p>No statistics available yet.</p>'}
        
        <button onclick="clearStats()">Clear Statistics</button>
        
        <script>
          function clearStats() {
            if (confirm('Are you sure you want to clear all statistics?')) {
              google.script.run
                .withSuccessHandler(function() {
                  alert('Statistics cleared');
                  google.script.host.close();
                })
                .clearSyncStatistics();
            }
          }
        </script>
      </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(600)
    .setHeight(400);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Sync Statistics');
}

/**
 * Clear sync statistics
 */
function clearSyncStatistics() {
  PropertiesService.getScriptProperties().deleteProperty('SYNC_STATS');
  PropertiesService.getScriptProperties().deleteProperty('LAST_SYNC_TIME');
}

/**
 * Show webhook URL
 */
function showWebhookUrl() {
  const scriptId = ScriptApp.getScriptId();
  const webhookUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .url-box {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 4px;
            word-break: break-all;
            margin: 20px 0;
            font-family: monospace;
            font-size: 0.9em;
          }
          button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover { background-color: #45a049; }
          .info { 
            background-color: #e7f3ff; 
            padding: 15px; 
            border-radius: 4px; 
            margin-bottom: 20px; 
          }
        </style>
      </head>
      <body>
        <h2>Webhook URL</h2>
        <div class="info">
          Use this URL to configure webhooks in WeDof. Add your webhook secret as a query parameter.
        </div>
        
        <h3>Webhook Endpoint:</h3>
        <div class="url-box" id="webhookUrl">${webhookUrl}</div>
        
        <button onclick="copyToClipboard()">Copy to Clipboard</button>
        
        <h3>Example with secret:</h3>
        <div class="url-box">${webhookUrl}?secret=YOUR_WEBHOOK_SECRET</div>
        
        <script>
          function copyToClipboard() {
            const url = document.getElementById('webhookUrl').textContent;
            navigator.clipboard.writeText(url).then(function() {
              alert('Webhook URL copied to clipboard!');
            }, function(err) {
              alert('Could not copy URL: ' + err);
            });
          }
        </script>
      </body>
    </html>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(600)
    .setHeight(450);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Webhook URL');
}

/**
 * Remove duplicates from a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {string} primaryKey - Primary key field
 * @return {number} Number of duplicates removed
 */
function removeDuplicates(sheetName, primaryKey) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return 0;
  }
  
  const headers = data[0];
  const keyIndex = headers.indexOf(primaryKey);
  
  if (keyIndex === -1) {
    throw new Error(`Primary key field not found: ${primaryKey}`);
  }
  
  // Keep track of seen keys and row indices to keep
  const seenKeys = new Set();
  const rowsToKeep = [0]; // Always keep header row
  let duplicatesCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][keyIndex]);
    
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      rowsToKeep.push(i);
    } else {
      duplicatesCount++;
    }
  }
  
  if (duplicatesCount > 0) {
    // Clear sheet and write back unique rows
    sheet.clear();
    const uniqueData = rowsToKeep.map(index => data[index]);
    sheet.getRange(1, 1, uniqueData.length, headers.length).setValues(uniqueData);
    
    // Restore formatting
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return duplicatesCount;
}