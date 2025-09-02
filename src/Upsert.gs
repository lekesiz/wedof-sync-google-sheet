/**
 * Upsert Operations Module
 * @module Upsert
 */

/**
 * Upsert a single record to sheet
 * @param {Object} record - Record to upsert
 * @param {string} keyField - Key field for matching
 * @param {string} sheetName - Target sheet name
 */
function upsertData(record, keyField = 'id', sheetName = CONFIG.SHEETS.WEBHOOK_DATA) {
  const sheet = getOrCreateSheet(sheetName);
  const headers = Object.keys(record);
  
  // Ensure headers exist
  ensureHeaders(headers, sheetName);
  
  // Get all headers (including existing ones)
  const allHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const keyIndex = allHeaders.indexOf(keyField);
  
  if (keyIndex < 0) {
    throw new Error(`Key field not found: ${keyField}`);
  }
  
  const rowCount = sheet.getLastRow() - 1;
  const rowValues = allHeaders.map(header => record.hasOwnProperty(header) ? record[header] : '');
  
  if (rowCount > 0) {
    // Search for existing record
    const keyValues = sheet.getRange(2, keyIndex + 1, rowCount, 1).getValues().map(row => String(row[0]));
    const existingIndex = keyValues.indexOf(String(record[keyField]));
    
    if (existingIndex === -1) {
      // Insert new record
      sheet.appendRow(rowValues);
    } else {
      // Update existing record
      sheet.getRange(existingIndex + 2, 1, 1, allHeaders.length).setValues([rowValues]);
    }
  } else {
    // First data row
    sheet.appendRow(rowValues);
  }
}

/**
 * Batch upsert multiple records
 * @param {Array<Object>} records - Records to upsert
 * @param {string} keyField - Key field for matching
 * @param {string} sheetName - Target sheet name
 */
function batchUpsertData(records, keyField = 'id', sheetName) {
  if (!records || records.length === 0) {
    Logger.log('No records to upsert');
    return;
  }
  
  const sheet = getOrCreateSheet(sheetName);
  
  // Collect all unique headers
  const headerSet = new Set();
  records.forEach(record => {
    Object.keys(record).forEach(key => headerSet.add(key));
  });
  const headers = Array.from(headerSet).sort();
  
  // Ensure headers exist
  ensureHeaders(headers, sheetName);
  
  // Get all headers (including existing ones)
  const allHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const keyIndex = allHeaders.indexOf(keyField);
  
  if (keyIndex < 0) {
    throw new Error(`Key field not found: ${keyField}`);
  }
  
  // Get existing data
  const rowCount = sheet.getLastRow() - 1;
  let existingData = {};
  
  if (rowCount > 0) {
    const dataRange = sheet.getRange(2, 1, rowCount, allHeaders.length);
    const dataValues = dataRange.getValues();
    
    // Build lookup map
    dataValues.forEach((row, index) => {
      const key = String(row[keyIndex]);
      existingData[key] = {
        rowIndex: index + 2,
        data: row
      };
    });
  }
  
  // Process records
  const updates = [];
  const inserts = [];
  
  records.forEach(record => {
    const key = String(record[keyField]);
    const rowValues = allHeaders.map(header => record.hasOwnProperty(header) ? record[header] : '');
    
    if (existingData[key]) {
      // Update existing
      updates.push({
        row: existingData[key].rowIndex,
        values: rowValues
      });
    } else {
      // Insert new
      inserts.push(rowValues);
    }
  });
  
  // Apply updates
  updates.forEach(update => {
    sheet.getRange(update.row, 1, 1, allHeaders.length).setValues([update.values]);
  });
  
  // Apply inserts
  if (inserts.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, inserts.length, allHeaders.length).setValues(inserts);
  }
  
  Logger.log(`Upserted ${records.length} records: ${updates.length} updated, ${inserts.length} inserted`);
}

/**
 * Ensure sheet has required headers
 * @param {Array<string>} requiredHeaders - Required header names
 * @param {string} sheetName - Sheet name
 */
function ensureHeaders(requiredHeaders, sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  
  if (sheet.getLastRow() === 0) {
    // No headers yet, create them
    sheet.appendRow(requiredHeaders);
    sheet.getRange(1, 1, 1, requiredHeaders.length).setFontWeight('bold');
    return;
  }
  
  // Get existing headers
  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0] || [];
  
  // Find missing headers
  const missingHeaders = requiredHeaders.filter(header => !currentHeaders.includes(header));
  
  if (missingHeaders.length > 0) {
    // Add missing headers
    const startColumn = currentHeaders.length + 1;
    sheet.getRange(1, startColumn, 1, missingHeaders.length)
      .setValues([missingHeaders])
      .setFontWeight('bold');
  }
}