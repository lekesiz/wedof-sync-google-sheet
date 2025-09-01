/**
 * Utility Functions Module
 * @module Utils
 */

/**
 * Get or create a sheet by name
 * @param {string} sheetName - Name of the sheet
 * @return {GoogleAppsScript.Spreadsheet.Sheet} Sheet object
 */
function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log(`Created new sheet: ${sheetName}`);
  }
  
  return sheet;
}

/**
 * Flatten nested object to single level with dot notation
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Key prefix for nested properties
 * @return {Object} Flattened object
 */
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const [key, value] of Object.entries(obj || {})) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !isDate(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      flattened[newKey] = value.join(', ');
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Check if value is a Date object
 * @param {*} value - Value to check
 * @return {boolean} True if value is a Date
 */
function isDate(value) {
  return value instanceof Date || Object.prototype.toString.call(value) === '[object Date]';
}

/**
 * Write data to sheet with optimized batch processing
 * @param {string} sheetName - Name of the sheet
 * @param {Array<Object>} items - Array of objects to write
 */
function writeDataToSheet(sheetName, items) {
  const sheet = getOrCreateSheet(sheetName);
  sheet.clear();
  
  if (!items || items.length === 0) {
    sheet.getRange(1, 1).setValue('NO DATA');
    Logger.log(`No data to write for sheet: ${sheetName}`);
    return;
  }
  
  // Flatten all items
  const flattenedItems = items.map(item => flattenObject(item));
  
  // Extract all unique headers
  const headerSet = new Set();
  flattenedItems.forEach(item => {
    Object.keys(item).forEach(key => headerSet.add(key));
  });
  
  const headers = Array.from(headerSet).sort();
  
  // Write headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  
  // Prepare data rows
  const dataRows = flattenedItems.map(item => 
    headers.map(header => item[header] ?? '')
  );
  
  // Write data in chunks
  const chunkSize = CONFIG.DEFAULTS.CHUNK_SIZE;
  for (let i = 0; i < dataRows.length; i += chunkSize) {
    const chunk = dataRows.slice(i, i + chunkSize);
    sheet.getRange(2 + i, 1, chunk.length, headers.length).setValues(chunk);
  }
  
  // Format sheet
  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
  
  Logger.log(`Wrote ${items.length} rows to sheet: ${sheetName}`);
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} title - Toast title (optional)
 * @param {number} timeout - Timeout in seconds (optional)
 */
function showToast(message, title = 'WeDof Sync', timeout = 3) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title, timeout);
}

/**
 * Log error with context
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
function logError(context, error) {
  const errorMessage = `Error in ${context}: ${error.message || error}`;
  Logger.log(errorMessage);
  console.error(errorMessage, error.stack || '');
}