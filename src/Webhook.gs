/**
 * Webhook Handling Module
 * @module Webhook
 */

/**
 * Handle GET requests to webhook endpoint
 * @param {GoogleAppsScript.Events.DoGet} e - GET event
 * @return {GoogleAppsScript.Content.TextOutput} Response
 */
function doGet(e) {
  return ContentService.createTextOutput('OK');
}

/**
 * Handle POST requests to webhook endpoint
 * @param {GoogleAppsScript.Events.DoPost} e - POST event
 * @return {GoogleAppsScript.Content.TextOutput} Response
 */
function doPost(e) {
  try {
    // Parse request body
    const body = e.postData ? JSON.parse(e.postData.contents) : {};
    
    // Check webhook secret
    const secret = (e.parameter && e.parameter.secret) || body.secret;
    const configuredSecret = getConfig(CONFIG.PROPS.WEBHOOK_SECRET);
    
    if (!secret || secret !== configuredSecret) {
      Logger.log('Unauthorized webhook request');
      return ContentService.createTextOutput('Unauthorized');
    }
    
    // Extract payload from various possible locations
    const payload = body?.object || body?.data || body || {};
    
    // Flatten the payload
    const flattenedRecord = flattenObject(payload);
    
    // Find and ensure ID field
    const idCandidates = ['id', 'attendeeId', 'attendee_id', 'uuid', 'reference', 'externalId', 'external_id'];
    let recordId = null;
    
    for (const candidate of idCandidates) {
      if (payload && payload[candidate] != null) {
        recordId = payload[candidate];
        break;
      }
    }
    
    if (!recordId && flattenedRecord['id'] != null) {
      recordId = flattenedRecord['id'];
    }
    
    if (!recordId) {
      throw new Error('Webhook payload missing required ID field');
    }
    
    // Add metadata
    flattenedRecord.id = recordId;
    flattenedRecord._event = body.event || body.type || '';
    flattenedRecord._receivedAt = new Date().toISOString();
    
    // Upsert the record
    upsertData(flattenedRecord, 'id', CONFIG.SHEETS.WEBHOOK_DATA);
    
    Logger.log(`Webhook processed successfully for ID: ${recordId}`);
    return ContentService.createTextOutput('OK');
    
  } catch (error) {
    logError('Webhook processing', error);
    return ContentService.createTextOutput('ERR');
  }
}

