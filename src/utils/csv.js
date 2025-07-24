// src/utils/csv.js
import Papa from 'papaparse';

/**
 * Parse CSV data from string
 * @param {string} csvString - CSV string to parse
 * @param {Object} options - Papa parse options
 * @returns {Object} Parsed CSV data
 */
export const parseCSV = (csvString, options = {}) => {
  const defaultOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(), // Clean headers
    ...options
  };

  return Papa.parse(csvString, defaultOptions);
};

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Object} options - Papa unparse options
 * @returns {string} CSV string
 */
export const arrayToCSV = (data, options = {}) => {
  const defaultOptions = {
    header: true,
    ...options
  };

  return Papa.unparse(data, defaultOptions);
};

/**
 * Download data as CSV file
 * @param {Array} data - Data to download
 * @param {string} filename - Name of the file
 */
export const downloadCSV = (data, filename = 'export') => {
  const csv = arrayToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Parse CSV file from File object
 * @param {File} file - File object to parse
 * @param {Object} options - Parse options
 * @returns {Promise} Promise that resolves with parsed data
 */
export const parseCSVFile = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        reject(error);
      },
      ...options
    };

    Papa.parse(file, defaultOptions);
  });
};

/**
 * Validate CSV headers
 * @param {Array} headers - Array of header strings
 * @param {Array} requiredHeaders - Array of required headers
 * @returns {Object} Validation result
 */
export const validateCSVHeaders = (headers, requiredHeaders) => {
  const missingHeaders = requiredHeaders.filter(
    required => !headers.some(header => 
      header.toLowerCase().trim() === required.toLowerCase().trim()
    )
  );

  return {
    valid: missingHeaders.length === 0,
    missingHeaders,
    headers
  };
};

/**
 * Validate CSV file before processing
 * @param {File} file - CSV file to validate
 * @returns {Promise} Promise with validation result
 */
export const validateCSVFile = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('File must be a CSV file');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }
    
    // Try to parse first few lines to validate format
    const results = await parseCSVFile(file.slice(0, 1024)); // First 1KB
    
    if (results.errors.length > 0) {
      throw new Error(`CSV format error: ${results.errors[0].message}`);
    }
    
    return {
      valid: true,
      message: 'File is valid',
      headers: results.meta.fields || []
    };
  } catch (error) {
    return {
      valid: false,
      message: error.message,
      headers: []
    };
  }
};

/**
 * Clean CSV data - remove empty rows, trim strings
 * @param {Array} data - Array of objects from CSV
 * @returns {Array} Cleaned data
 */
export const cleanCSVData = (data) => {
  return data
    .filter(row => {
      // Remove rows where all values are empty
      const values = Object.values(row);
      return values.some(value => 
        value !== null && value !== undefined && value !== ''
      );
    })
    .map(row => {
      // Trim string values
      const cleanedRow = {};
      Object.keys(row).forEach(key => {
        const value = row[key];
        cleanedRow[key] = typeof value === 'string' ? value.trim() : value;
      });
      return cleanedRow;
    });
};

/**
 * Convert guest data to CSV format for export
 * @param {Array} guests - Array of guest objects
 * @returns {string} CSV string
 */
export const exportGuestsToCSV = (guests) => {
  const csvData = guests.map(guest => ({
    'Name': guest.name || '',
    'Email': guest.email || '',
    'Phone': guest.phone || '',
    'Status': guest.checkedIn ? 'Checked In' : 'Not Checked In',
    'Check-in Time': guest.checkInTime ? new Date(guest.checkInTime).toLocaleString() : '',
    'Event': guest.eventName || '',
    'Created At': guest.createdAt ? new Date(guest.createdAt).toLocaleString() : ''
  }));

  return arrayToCSV(csvData);
};

/**
 * Parse guest CSV data specifically
 * @param {File} file - CSV file with guest data
 * @returns {Promise} Promise with parsed guest data
 */
export const parseGuestCSV = async (file) => {
  try {
    const results = await parseCSVFile(file);
    
    // Validate required headers
    const requiredHeaders = ['name', 'email'];
    const validation = validateCSVHeaders(results.meta.fields, requiredHeaders);
    
    if (!validation.valid) {
      throw new Error(`Missing required headers: ${validation.missingHeaders.join(', ')}`);
    }

    // Clean and transform data
    const cleanData = cleanCSVData(results.data);
    
    const guests = cleanData.map((row, index) => ({
      id: `import_${Date.now()}_${index}`,
      name: row.name || row.Name || '',
      email: row.email || row.Email || '',
      phone: row.phone || row.Phone || '',
      checkedIn: false,
      createdAt: new Date().toISOString(),
      importedAt: new Date().toISOString()
    }));

    return {
      success: true,
      data: guests,
      totalRows: results.data.length,
      validRows: guests.length,
      errors: results.errors
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Import guests from CSV
 * @param {File} file - CSV file
 * @returns {Promise} Promise with parsed guest data
 */
export const importGuestsFromCSV = async (file) => {
  return parseGuestCSV(file);
};

/**
 * Download guest template CSV file
 * @param {string} filename - Template filename
 */
export const downloadGuestTemplate = (filename = 'guest_template') => {
  const templateData = [
    {
      'Name': 'John Doe',
      'Email': 'john.doe@example.com', 
      'Phone': '+1234567890'
    },
    {
      'Name': 'Jane Smith',
      'Email': 'jane.smith@example.com',
      'Phone': '+0987654321'
    }
  ];
  
  const csv = arrayToCSV(templateData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Export event statistics to CSV
 * @param {Array} events - Array of event objects with stats
 * @param {string} filename - Export filename
 */
export const exportEventStatsToCSV = (events, filename = 'event_stats') => {
  const statsData = events.map(event => ({
    'Event Name': event.name || '',
    'Date': event.date ? new Date(event.date).toLocaleDateString() : '',
    'Location': event.location || '',
    'Total Guests': event.totalGuests || 0,
    'Checked In': event.checkedInGuests || 0,
    'Attendance Rate': event.totalGuests ? 
      `${Math.round((event.checkedInGuests || 0) / event.totalGuests * 100)}%` : '0%',
    'Created At': event.createdAt ? new Date(event.createdAt).toLocaleDateString() : '',
    'Status': event.status || 'Active'
  }));

  downloadCSV(statsData, filename);
};

/**
 * Export detailed analytics to CSV
 * @param {Object} analyticsData - Analytics data object
 * @param {string} filename - Export filename
 */
export const exportAnalyticsToCSV = (analyticsData, filename = 'analytics_report') => {
  const { events, checkIns, summary } = analyticsData;
  
  // Create comprehensive analytics CSV
  const reportData = [
    // Summary section
    { Category: 'SUMMARY', Metric: 'Total Events', Value: summary?.totalEvents || 0 },
    { Category: 'SUMMARY', Metric: 'Total Check-ins', Value: summary?.totalCheckIns || 0 },
    { Category: 'SUMMARY', Metric: 'Average Attendance', Value: summary?.avgAttendance || '0%' },
    { Category: '', Metric: '', Value: '' }, // Empty row
    
    // Events details
    { Category: 'EVENT DETAILS', Metric: 'Event Name', Value: 'Attendance Rate' },
    ...events.map(event => ({
      Category: 'EVENT',
      Metric: event.name,
      Value: event.totalGuests ? 
        `${Math.round((event.checkedInGuests || 0) / event.totalGuests * 100)}%` : '0%'
    }))
  ];

  downloadCSV(reportData, filename);
};

/**
 * Parse and validate bulk import CSV
 * @param {File} file - CSV file for bulk import
 * @param {Array} requiredFields - Required field names
 * @returns {Promise} Promise with validation and data
 */
export const parseBulkImportCSV = async (file, requiredFields = []) => {
  try {
    // Validate file first
    const fileValidation = await validateCSVFile(file);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.message);
    }

    // Parse file
    const results = await parseCSVFile(file);
    
    // Validate headers if required fields specified
    if (requiredFields.length > 0) {
      const headerValidation = validateCSVHeaders(results.meta.fields, requiredFields);
      if (!headerValidation.valid) {
        throw new Error(`Missing required columns: ${headerValidation.missingHeaders.join(', ')}`);
      }
    }

    // Clean data
    const cleanData = cleanCSVData(results.data);
    
    return {
      success: true,
      data: cleanData,
      headers: results.meta.fields,
      totalRows: results.data.length,
      validRows: cleanData.length,
      errors: results.errors,
      warnings: []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: [],
      headers: [],
      totalRows: 0,
      validRows: 0,
      errors: [error],
      warnings: []
    };
  }
};