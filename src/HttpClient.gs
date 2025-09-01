/**
 * HTTP Client Module for API Communication
 * @module HttpClient
 */

/**
 * Make HTTP GET request with retry logic
 * @param {string} url - Request URL
 * @param {Object} queryParams - Query parameters
 * @param {Object} headers - Additional headers
 * @return {Object} Parsed JSON response
 * @throws {Error} If request fails after retries
 */
function httpGet(url, queryParams = {}, headers = {}) {
  const fullUrl = url.startsWith('http') ? url : getApiBaseUrl() + url;
  const queryString = buildQueryString(queryParams);
  const finalUrl = queryString ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}` : fullUrl;
  
  const options = {
    method: 'get',
    headers: Object.assign({}, getApiHeaders(), headers),
    muteHttpExceptions: true
  };
  
  for (let attempt = 0; attempt < CONFIG.DEFAULTS.MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(finalUrl, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode >= 200 && responseCode < 300) {
        return JSON.parse(response.getContentText());
      }
      
      if (responseCode === 429 || responseCode >= 500) {
        // Rate limit or server error - retry with exponential backoff
        const delay = CONFIG.DEFAULTS.RETRY_DELAY_MS * Math.pow(2, attempt);
        Logger.log(`HTTP ${responseCode} - Retrying after ${delay}ms...`);
        Utilities.sleep(delay);
      } else {
        // Client error - don't retry
        throw new Error(`HTTP ${responseCode}: ${response.getContentText()}`);
      }
    } catch (error) {
      if (attempt === CONFIG.DEFAULTS.MAX_RETRIES - 1) {
        throw new Error(`Failed after ${CONFIG.DEFAULTS.MAX_RETRIES} attempts: ${error.message}`);
      }
    }
  }
}

/**
 * Build query string from object
 * @param {Object} params - Query parameters
 * @return {string} URL encoded query string
 */
function buildQueryString(params) {
  return Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Extract list data from API response
 * @param {Object} response - API response object
 * @return {Array} Extracted array of items
 */
function extractListFromResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }
  
  // Common API response patterns
  const listKeys = ['data', 'items', 'results', 'content', 'records', 'rows', 'hydra:member'];
  
  for (const key of listKeys) {
    if (response && Array.isArray(response[key])) {
      return response[key];
    }
  }
  
  // Check if any property is an array
  if (response && typeof response === 'object') {
    for (const value of Object.values(response)) {
      if (Array.isArray(value)) {
        return value;
      }
    }
  }
  
  return [];
}

/**
 * Fetch paginated data from API
 * @param {string} endpoint - API endpoint
 * @param {Object} additionalParams - Additional query parameters
 * @return {Array} All items from paginated results
 */
function fetchPaginatedData(endpoint, additionalParams = {}) {
  const allItems = [];
  let page = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    const queryParams = {
      ...additionalParams,
      page: page,
      limit: CONFIG.DEFAULTS.PAGE_SIZE
    };
    
    try {
      const response = httpGet(endpoint, queryParams);
      const items = extractListFromResponse(response);
      
      if (items.length === 0) {
        hasMorePages = false;
        break;
      }
      
      allItems.push(...items);
      
      // Check for next page
      hasMorePages = checkHasNextPage(response, items.length);
      
      if (hasMorePages) {
        page++;
        // Rate limiting
        Utilities.sleep(CONFIG.DEFAULTS.RATE_LIMIT_DELAY_MS);
      }
      
    } catch (error) {
      logError(`Fetching page ${page} of ${endpoint}`, error);
      hasMorePages = false;
    }
  }
  
  Logger.log(`Fetched ${allItems.length} total items from ${endpoint}`);
  return allItems;
}

/**
 * Check if response has more pages
 * @param {Object} response - API response
 * @param {number} itemCount - Number of items in current page
 * @return {boolean} True if more pages exist
 */
function checkHasNextPage(response, itemCount) {
  // Check various pagination indicators
  if (response.links && response.links.next) return true;
  if (response.meta && (response.meta.next || response.meta.hasNext)) return true;
  if (response.hasNext === true) return true;
  
  // If we got full page, assume there might be more
  return itemCount === CONFIG.DEFAULTS.PAGE_SIZE;
}