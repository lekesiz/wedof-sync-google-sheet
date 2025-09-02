/**
 * Configuration Module for WeDof API Integration
 * @module Config
 */

/**
 * Script Properties keys
 */
const CONFIG = {
  PROPS: {
    API_TOKEN: 'WEDOF_API_TOKEN',
    WEBHOOK_SECRET: 'WEBHOOK_SECRET',
    API_BASE_URL: 'WEDOF_API_BASE'
  },
  DEFAULTS: {
    API_BASE_URL: 'https://www.wedof.fr/api',
    PAGE_SIZE: 200,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    RATE_LIMIT_DELAY_MS: 200,
    CHUNK_SIZE: 200
  },
  SHEETS: {
    WEBHOOK_DATA: 'wedof_data',
    COMBINED_DATA: 'wedof_birlesik_veriler',
    ATTENDEES: 'wedof_attendees',
    SESSIONS: 'wedof_sessions',
    DIAGNOSTICS: 'wedof_probe'
  }
};

/**
 * Get configuration value from Script Properties
 * @param {string} key - Property key
 * @return {string|null} Property value
 */
function getConfig(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

/**
 * Set configuration value in Script Properties
 * @param {string} key - Property key
 * @param {string} value - Property value
 */
function setConfig(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

/**
 * Get API base URL
 * @return {string} API base URL
 */
function getApiBaseUrl() {
  const baseUrl = getConfig(CONFIG.PROPS.API_BASE_URL) || CONFIG.DEFAULTS.API_BASE_URL;
  return baseUrl.replace(/\/+$/, '');
}

/**
 * Get API token
 * @return {string} API token
 * @throws {Error} If token is not configured
 */
function getApiToken() {
  const token = (getConfig(CONFIG.PROPS.API_TOKEN) || '').trim().replace(/^["']|["']$/g, '');
  if (!token) {
    throw new Error('WEDOF_API_TOKEN is not configured. Please set it in Script Properties.');
  }
  return token;
}

/**
 * Get API headers for requests
 * @return {Object} Headers object
 */
function getApiHeaders() {
  return {
    'X-Api-Key': getApiToken(),
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}