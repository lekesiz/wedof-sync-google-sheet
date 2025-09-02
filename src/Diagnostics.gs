/**
 * Diagnostics Module
 * @module Diagnostics
 */

/**
 * Run authentication probe to test different auth methods
 */
function authProbe() {
  const baseUrl = getApiBaseUrl();
  const testUrl = baseUrl + '/attendees/find';
  const token = getApiToken();
  
  const results = {
    'Authorization: Bearer': tryRequest('A) Authorization: Bearer', testUrl, { 'Authorization': 'Bearer ' + token }, { query: 'jane@doe.com' }),
    'X-Api-Key': tryRequest('B) X-Api-Key', testUrl, { 'X-Api-Key': token }, { query: 'jane@doe.com' }),
    'Query param token': tryRequest('C) Query param token', testUrl, {}, { query: 'jane@doe.com', token: token })
  };
  
  const message = `AuthProbe Results: A=${results['Authorization: Bearer']}, B=${results['X-Api-Key']}, C=${results['Query param token']}`;
  Logger.log(message);
  showToast(message);
}

/**
 * Try a request with given parameters
 * @param {string} label - Test label
 * @param {string} url - Request URL
 * @param {Object} headers - Request headers
 * @param {Object} queryParams - Query parameters
 * @return {number} Response code
 */
function tryRequest(label, url, headers, queryParams) {
  try {
    const queryString = buildQueryString(queryParams);
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    const response = UrlFetchApp.fetch(fullUrl, {
      method: 'get',
      headers: Object.assign({ 'Accept': 'application/json' }, headers),
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const preview = response.getContentText().slice(0, 200);
    Logger.log(`${label} -> ${code}: ${preview}`);
    
    return code;
  } catch (error) {
    Logger.log(`${label} -> ERROR: ${error.message}`);
    return 0;
  }
}

/**
 * Run comprehensive diagnostics
 */
function runDiagnostics() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.DIAGNOSTICS);
  sheet.clear();
  sheet.appendRow(['Endpoint', 'Method', 'Status', 'Items', 'Top Level Keys', 'First Item Keys']);
  
  const candidates = [
    ['/attendees', 'GET', null, {}],
    ['/attendees/find', 'GET', null, { query: '' }],
    ['/attendees/find', 'POST', { query: '' }, {}],
    ['/trainings', 'GET', null, {}],
    ['/proposals', 'GET', null, {}],
    ['/sessions', 'GET', null, {}]
  ];
  
  candidates.forEach(([path, method, body, qs]) => {
    probeEndpoint(sheet, path, method, body, qs);
  });
  
  // Format the sheet
  sheet.autoResizeColumns(1, 6);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  
  Logger.log('Diagnostics completed - check wedof_probe sheet');
  showToast('Diagnostics completed - check wedof_probe sheet');
}

/**
 * Probe a single endpoint
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Target sheet
 * @param {string} path - API endpoint path
 * @param {string} method - HTTP method
 * @param {Object} body - Request body
 * @param {Object} queryParams - Query parameters
 */
function probeEndpoint(sheet, path, method, body, queryParams) {
  try {
    let response;
    
    if (method === 'POST') {
      response = httpPost(path, queryParams || {}, body || {});
    } else {
      response = httpGet(path, queryParams || {});
    }
    
    const list = extractListFromResponse(response);
    const topLevelKeys = Object.keys(response || {});
    const firstItemKeys = list[0] ? Object.keys(list[0]) : [];
    
    sheet.appendRow([
      path,
      method,
      'OK',
      list.length,
      topLevelKeys.join(', '),
      firstItemKeys.join(', ')
    ]);
    
  } catch (error) {
    const message = String(error);
    const statusCode = (message.match(/HTTP\s(\d{3})/) || [])[1] || '';
    
    sheet.appendRow([
      path,
      method,
      statusCode || 'ERR',
      0,
      message.slice(0, 200),
      ''
    ]);
  }
}