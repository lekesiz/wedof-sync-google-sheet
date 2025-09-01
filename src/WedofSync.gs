/**
 * Main WeDof Synchronization Module
 * @module WedofSync
 */

/**
 * Synchronize combined session and attendee data for a specific year
 * This is the main recommended function that combines session data with attendee registrations
 * @param {string} year - Year to filter sessions (default: current year)
 */
function syncCombinedSessionAndAttendeeData(year = null) {
  const targetYear = year || new Date().getFullYear().toString();
  const sheetName = CONFIG.SHEETS.COMBINED_DATA;
  
  Logger.log(`Starting combined data synchronization for year ${targetYear}...`);
  showToast(`Starting sync for ${targetYear}...`, 'WeDof Sync', 5);
  
  try {
    // Fetch all sessions
    const allSessions = fetchPaginatedData('/sessions');
    Logger.log(`Found ${allSessions.length} total sessions`);
    
    // Filter sessions by year
    const filteredSessions = allSessions.filter(session => 
      session.startDate && session.startDate.startsWith(targetYear)
    );
    
    Logger.log(`Found ${filteredSessions.length} sessions for year ${targetYear}`);
    
    if (filteredSessions.length === 0) {
      const message = `No sessions found for year ${targetYear}`;
      Logger.log(message);
      showToast(message);
      writeDataToSheet(sheetName, []);
      return;
    }
    
    // Process sessions and fetch attendee data
    const combinedData = processSessions(filteredSessions);
    
    // Write to sheet
    writeDataToSheet(sheetName, combinedData);
    
    const message = `Successfully synchronized ${combinedData.length} records for year ${targetYear}`;
    Logger.log(message);
    showToast(message);
    
  } catch (error) {
    logError('Combined data synchronization', error);
    showToast(`Error: ${error.message}`, 'Sync Failed');
    throw error;
  }
}

/**
 * Process sessions and fetch registration data
 * @param {Array} sessions - Array of session objects
 * @return {Array} Combined data array
 */
function processSessions(sessions) {
  const combinedData = [];
  const totalSessions = sessions.length;
  
  sessions.forEach((session, index) => {
    const sessionNumber = index + 1;
    const sessionTitle = session.sessionInfo?.trainingTitle || 'Untitled Session';
    
    Logger.log(`Processing ${sessionNumber}/${totalSessions}: "${sessionTitle}"`);
    
    // Flatten session data with 'session' prefix
    const flattenedSession = flattenObject(session, 'session');
    
    // Get registration URL
    const registrationUrl = session._links?.registrationFolders?.href;
    
    if (registrationUrl) {
      try {
        // Fetch registration data
        const registrationResponse = httpGet(registrationUrl);
        const registrations = extractListFromResponse(registrationResponse);
        
        if (registrations.length > 0) {
          // Add each registration as a separate row
          registrations.forEach(registration => {
            const flattenedRegistration = flattenObject(registration, 'registration');
            combinedData.push({
              ...flattenedSession,
              ...flattenedRegistration
            });
          });
          
          Logger.log(`  - Found ${registrations.length} registrations`);
        } else {
          // No registrations - add session data only
          combinedData.push(flattenedSession);
          Logger.log('  - No registrations found');
        }
        
      } catch (error) {
        logError(`Fetching registrations for "${sessionTitle}"`, error);
        // Add session data without registration on error
        combinedData.push({
          ...flattenedSession,
          'registration.error': error.message
        });
      }
    } else {
      // No registration link - add session data only
      combinedData.push(flattenedSession);
      Logger.log('  - No registration link available');
    }
    
    // Rate limiting between sessions
    if (sessionNumber % 10 === 0) {
      Utilities.sleep(1000);
    }
  });
  
  return combinedData;
}

/**
 * Synchronize all attendees
 */
function syncAllAttendees() {
  const sheetName = CONFIG.SHEETS.ATTENDEES;
  
  try {
    Logger.log('Starting attendees synchronization...');
    showToast('Synchronizing attendees...');
    
    const attendees = fetchPaginatedData('/attendees');
    writeDataToSheet(sheetName, attendees);
    
    const message = `Successfully synchronized ${attendees.length} attendees`;
    Logger.log(message);
    showToast(message);
    
  } catch (error) {
    logError('Attendees synchronization', error);
    showToast(`Error: ${error.message}`, 'Sync Failed');
    throw error;
  }
}

/**
 * Synchronize all sessions
 */
function syncAllSessions() {
  const sheetName = CONFIG.SHEETS.SESSIONS;
  
  try {
    Logger.log('Starting sessions synchronization...');
    showToast('Synchronizing sessions...');
    
    const sessions = fetchPaginatedData('/sessions');
    writeDataToSheet(sheetName, sessions);
    
    const message = `Successfully synchronized ${sessions.length} sessions`;
    Logger.log(message);
    showToast(message);
    
  } catch (error) {
    logError('Sessions synchronization', error);
    showToast(`Error: ${error.message}`, 'Sync Failed');
    throw error;
  }
}

/**
 * Full synchronization - runs all sync functions
 */
function runFullSync() {
  Logger.log('Starting full synchronization...');
  showToast('Starting full synchronization...', 'WeDof Sync', 10);
  
  try {
    // Sync combined data for current year
    syncCombinedSessionAndAttendeeData();
    
    // Sync all attendees
    syncAllAttendees();
    
    // Sync all sessions
    syncAllSessions();
    
    showToast('Full synchronization completed successfully!');
    
  } catch (error) {
    logError('Full synchronization', error);
    showToast('Full sync failed. Check logs for details.', 'Error');
  }
}