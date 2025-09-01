/**
 * Triggers and Automation Module
 * @module Triggers
 */

/**
 * Set up time-based triggers for automatic synchronization
 */
function setupAutomaticSync() {
  // Remove existing triggers
  removeAllTriggers();
  
  // Create daily trigger at 2 AM
  ScriptApp.newTrigger('dailySync')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
    
  Logger.log('Automatic daily sync trigger created for 2:00 AM');
  showToast('Automatic daily sync enabled');
}

/**
 * Remove all project triggers
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  Logger.log(`Removed ${triggers.length} triggers`);
}

/**
 * Daily sync function
 */
function dailySync() {
  Logger.log('Starting automated daily sync...');
  
  try {
    // Sync current year data
    syncCombinedSessionAndAttendeeData();
    
    // Send summary email if configured
    sendSyncSummaryEmail();
    
  } catch (error) {
    logError('Daily sync', error);
    sendErrorNotificationEmail(error);
  }
}

/**
 * Send sync summary email
 */
function sendSyncSummaryEmail() {
  const emailAddress = Session.getActiveUser().getEmail();
  
  if (!emailAddress) {
    Logger.log('No email address available for summary');
    return;
  }
  
  const spreadsheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const currentYear = new Date().getFullYear();
  
  const subject = `WeDof Sync Summary - ${new Date().toLocaleDateString()}`;
  
  const body = `
    Daily synchronization completed successfully.
    
    Spreadsheet: ${spreadsheetUrl}
    Year: ${currentYear}
    
    Please check the spreadsheet for the latest data.
    
    Best regards,
    WeDof Sync System
  `;
  
  MailApp.sendEmail({
    to: emailAddress,
    subject: subject,
    body: body
  });
  
  Logger.log('Summary email sent to: ' + emailAddress);
}

/**
 * Send error notification email
 */
function sendErrorNotificationEmail(error) {
  const emailAddress = Session.getActiveUser().getEmail();
  
  if (!emailAddress) {
    Logger.log('No email address available for error notification');
    return;
  }
  
  const subject = `WeDof Sync Error - ${new Date().toLocaleDateString()}`;
  
  const body = `
    An error occurred during the daily synchronization:
    
    Error: ${error.message || error}
    
    Please check the script logs for more details.
    
    Best regards,
    WeDof Sync System
  `;
  
  MailApp.sendEmail({
    to: emailAddress,
    subject: subject,
    body: body
  });
  
  Logger.log('Error notification sent to: ' + emailAddress);
}