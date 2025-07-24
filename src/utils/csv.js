// src/utils/csv.js
import Papa from 'papaparse';

/**
 * Parse CSV file to guest data
 * @param {File} file - CSV file
 * @returns {Promise<Array>} Array of guest objects
 */
export const parseGuestCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize headers
        return header.toLowerCase().trim().replace(/\s+/g, '_');
      },
      transform: (value, field) => {
        // Clean and validate data
        if (typeof value === 'string') {
          return value.trim();
        }
        return value;
      },
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }

          const guests = results.data
            .filter(row => row.name && row.name.trim()) // Filter rows with empty names
            .map((row, index) => ({
              id: `guest_${Date.now()}_${index}`,
              name: row.name || '',
              email: row.email || '',
              phone: row.phone || row.phone_number || '',
              category: row.category || row.type || 'General',
              company: row.company || row.organization || '',
              title: row.title || row.position || '',
              checkedIn: false,
              checkInTime: null,
              notes: row.notes || row.remarks || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));

          resolve(guests);
        } catch (error) {
          reject(new Error(`Error processing CSV data: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};

/**
 * Export guests data to CSV
 * @param {Array} guests - Array of guest objects
 * @param {string} eventName - Event name for filename
 * @returns {void} Downloads CSV file
 */
export const exportGuestsToCSV = (guests, eventName = 'event') => {
  try {
    // Prepare data for export
    const csvData = guests.map(guest => ({
      'Name': guest.name,
      'Email': guest.email,
      'Phone': guest.phone,
      'Category': guest.category,
      'Company': guest.company,
      'Title': guest.title,
      'Checked In': guest.checkedIn ? 'Yes' : 'No',
      'Check In Time': guest.checkInTime ? new Date(guest.checkInTime).toLocaleString() : '',
      'Notes': guest.notes,
      'Created At': new Date(guest.createdAt).toLocaleString()
    }));

    // Generate CSV
    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ','
    });

    // Download CSV file
    downloadCSV(csv, `${eventName.replace(/\s+/g, '_')}_guests_${Date.now()}.csv`);
  } catch (error) {
    console.error('Error exporting guests to CSV:', error);
    throw new Error('Failed to export guests data');
  }
};

/**
 * Export event statistics to CSV
 * @param {Object} stats - Event statistics
 * @param {Array} guests - Array of guest objects
 * @param {string} eventName - Event name
 * @returns {void} Downloads CSV file
 */
export const exportEventStatsToCSV = (stats, guests, eventName = 'event') => {
  try {
    // Summary data
    const summaryData = [
      ['Event Statistics', ''],
      ['Event Name', eventName],
      ['Total Guests', stats.totalGuests],
      ['Checked In', stats.checkedIn],
      ['Not Checked In', stats.notCheckedIn],
      ['Check-in Rate', `${stats.checkinRate}%`],
      ['Generated At', new Date().toLocaleString()],
      ['', ''], // Empty row
      ['Guest Details', '']
    ];

    // Guest details
    const guestDetails = guests.map(guest => [
      guest.name,
      guest.email,
      guest.category,
      guest.checkedIn ? 'Yes' : 'No',
      guest.checkInTime ? new Date(guest.checkInTime).toLocaleString() : 'Not checked in'
    ]);

    // Add headers for guest details
    guestDetails.unshift(['Name', 'Email', 'Category', 'Checked In', 'Check In Time']);

    // Combine all data
    const allData = [...summaryData, ...guestDetails];

    // Generate CSV
    const csv = Papa.unparse(allData, {
      header: false,
      delimiter: ','
    });

    // Download CSV file
    downloadCSV(csv, `${eventName.replace(/\s+/g, '_')}_statistics_${Date.now()}.csv`);
  } catch (error) {
    console.error('Error exporting statistics to CSV:', error);
    throw new Error('Failed to export statistics data');
  }
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content
 * @param {string} filename - File name
 */
const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Validate CSV file format
 * @param {File} file - CSV file
 * @returns {Promise<boolean>} True if valid, throws error if invalid
 */
export const validateCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      reject(new Error('Please select a valid CSV file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      reject(new Error('File size should be less than 5MB'));
      return;
    }

    // Quick check for CSV format by reading first few lines
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').slice(0, 3); // Check first 3 lines
      
      if (lines.length < 2) {
        reject(new Error('CSV file appears to be empty or invalid'));
        return;
      }

      // Check if it looks like CSV (has commas)
      const hasCommas = lines.some(line => line.includes(','));
      if (!hasCommas) {
        reject(new Error('File does not appear to be in CSV format'));
        return;
      }

      resolve(true);
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file.slice(0, 1024)); // Read first 1KB for validation
  });
};

/**
 * Generate CSV template for guest import
 * @returns {void} Downloads template CSV file
 */
export const downloadGuestTemplate = () => {
  const templateData = [
    {
      'name': 'John Doe',
      'email': 'john.doe@example.com',
      'phone': '+1234567890',
      'category': 'VIP',
      'company': 'Example Corp',
      'title': 'Manager',
      'notes': 'Important guest'
    },
    {
      'name': 'Jane Smith',
      'email': 'jane.smith@example.com',
      'phone': '+0987654321',
      'category': 'General',
      'company': 'Tech Solutions',
      'title': 'Developer',
      'notes': ''
    }
  ];

  const csv = Papa.unparse(templateData, {
    header: true,
    delimiter: ','
  });

  downloadCSV(csv, 'guest_import_template.csv');
};