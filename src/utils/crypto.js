// src/utils/crypto.js - CORRECTED CLEAN VERSION
import CryptoJS from 'crypto-js';

// Environment variables with fallbacks
const SECRET_KEY = process.env.REACT_APP_QR_SECRET || 'AFssahVSAG125618fbjUOp158JrRpCeS4';
const HMAC_KEY = process.env.REACT_APP_HMAC_SECRET || 'PDssahVSAG125618ZbjUPp158JrRpCeS4';

// Debug logging function
const debugLog = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CRYPTO DEBUG] ${message}`, data || '');
  }
};

/**
 * Generate encrypted QR token
 * @param {Object} payload - Data to encrypt
 * @param {string} payload.guestId - Guest ID
 * @param {string} payload.eventId - Event ID
 * @param {number} payload.expiresIn - Expiration time in hours (default: 24)
 * @returns {string} Encrypted token
 */
export const generateQRToken = (payload) => {
  try {
    debugLog('Starting QR token generation', payload);
    
    const { guestId, eventId, expiresIn = 24 } = payload;
    
    // Validate input
    if (!guestId || !eventId) {
      throw new Error('Missing required fields: guestId and eventId are required');
    }

    // Ensure eventId is a string and normalize
    const normalizedEventId = String(eventId).trim();
    const normalizedGuestId = String(guestId).trim();
    
    // Create token data with normalized values
    const tokenData = {
      guestId: normalizedGuestId,
      eventId: normalizedEventId,
      timestamp: Date.now(),
      expires: Date.now() + (expiresIn * 60 * 60 * 1000), // Convert hours to milliseconds
      used: false,
      version: '1.0'
    };

    debugLog('Token data prepared', tokenData);

    // Convert to JSON string
    const dataString = JSON.stringify(tokenData);
    debugLog('JSON string created', { length: dataString.length });
    
    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
    debugLog('Data encrypted', { encryptedLength: encrypted.length });
    
    // Generate HMAC for integrity
    const hmac = CryptoJS.HmacSHA256(encrypted, HMAC_KEY).toString();
    debugLog('HMAC generated', { hmacLength: hmac.length });
    
    // Combine encrypted data and HMAC
    const token = `${encrypted}.${hmac}`;
    debugLog('Final token created', { tokenLength: token.length });
    
    return token;
  } catch (error) {
    console.error('Error generating QR token:', error);
    throw new Error(`Failed to generate QR token: ${error.message}`);
  }
};

/**
 * Decrypt and validate QR token
 * @param {string} token - Encrypted token
 * @returns {Object|null} Decrypted data or null if invalid
 */
export const validateQRToken = (token) => {
  try {
    debugLog('Starting QR token validation', { tokenLength: token ? token.length : 0 });
    
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format: token must be a non-empty string');
    }

    // Split token into encrypted data and HMAC
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid token structure: expected 2 parts, got ${parts.length}`);
    }

    const [encrypted, hmac] = parts;
    debugLog('Token parts extracted', { 
      encryptedLength: encrypted.length, 
      hmacLength: hmac.length 
    });

    // Verify HMAC
    const expectedHmac = CryptoJS.HmacSHA256(encrypted, HMAC_KEY).toString();
    if (hmac !== expectedHmac) {
      debugLog('HMAC verification failed', { 
        received: hmac.substring(0, 8) + '***',
        expected: expectedHmac.substring(0, 8) + '***'
      });
      throw new Error('Token integrity check failed: HMAC mismatch');
    }
    debugLog('HMAC verification passed');

    // Decrypt the data
    const decryptedBytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedData) {
      throw new Error('Failed to decrypt token: invalid secret key or corrupted data');
    }
    debugLog('Token decrypted successfully', { dataLength: decryptedData.length });

    // Parse JSON
    let tokenData;
    try {
      tokenData = JSON.parse(decryptedData);
    } catch (parseError) {
      throw new Error(`Failed to parse token JSON: ${parseError.message}`);
    }
    debugLog('Token data parsed', tokenData);

    // Validate token structure
    const requiredFields = ['guestId', 'eventId', 'timestamp', 'expires'];
    const missingFields = requiredFields.filter(field => !tokenData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid token data structure: missing fields ${missingFields.join(', ')}`);
    }

    // Normalize eventId for comparison
    tokenData.eventId = String(tokenData.eventId).trim();
    tokenData.guestId = String(tokenData.guestId).trim();
    
    debugLog('Token data normalized', {
      eventId: tokenData.eventId,
      guestId: tokenData.guestId
    });

    // Check if token is expired
    const now = Date.now();
    if (now > tokenData.expires) {
      const expiredAt = new Date(tokenData.expires).toISOString();
      throw new Error(`Token has expired at ${expiredAt}`);
    }
    debugLog('Token expiration check passed');

    // Check if token was already used
    if (tokenData.used) {
      throw new Error('Token has already been used');
    }
    debugLog('Token usage check passed');

    debugLog('Token validation completed successfully');
    return tokenData;
    
  } catch (error) {
    console.error('Error validating QR token:', error);
    debugLog('Token validation failed', { error: error.message });
    return null;
  }
};

/**
 * Generate QR data URL with encrypted token
 * @param {Object} payload - Token payload
 * @returns {string} JSON string for QR code
 */
export const generateQRData = (payload) => {
  try {
    debugLog('Generating QR data', payload);
    
    const token = generateQRToken(payload);
    
    // Create QR data object
    const qrData = {
      token,
      app: 'qr-events',
      version: '1.0',
      timestamp: Date.now(),
      eventId: String(payload.eventId).trim(), // Include eventId for quick validation
      guestId: String(payload.guestId).trim()  // Include guestId for quick validation
    };

    const qrString = JSON.stringify(qrData);
    debugLog('QR data generated', { 
      length: qrString.length,
      eventId: qrData.eventId,
      guestId: qrData.guestId
    });
    
    return qrString;
  } catch (error) {
    console.error('Error generating QR data:', error);
    throw new Error(`Failed to generate QR data: ${error.message}`);
  }
};

/**
 * Parse QR data and extract token
 * @param {string} qrDataString - Scanned QR data
 * @returns {Object|null} Parsed QR data or null if invalid
 */
export const parseQRData = (qrDataString) => {
  try {
    debugLog('Parsing QR data', { length: qrDataString ? qrDataString.length : 0 });
    
    if (!qrDataString || typeof qrDataString !== 'string') {
      throw new Error('Invalid QR data: must be a non-empty string');
    }

    let qrData;
    try {
      qrData = JSON.parse(qrDataString);
    } catch (parseError) {
      throw new Error(`Invalid QR code format: not valid JSON - ${parseError.message}`);
    }
    
    // Validate QR data structure
    if (!qrData.token) {
      throw new Error('Invalid QR code format: missing token field');
    }
    
    if (qrData.app !== 'qr-events') {
      throw new Error(`Invalid QR code format: wrong app identifier '${qrData.app}', expected 'qr-events'`);
    }

    // Normalize IDs if present
    if (qrData.eventId) {
      qrData.eventId = String(qrData.eventId).trim();
    }
    if (qrData.guestId) {
      qrData.guestId = String(qrData.guestId).trim();
    }

    debugLog('QR data parsed successfully', {
      app: qrData.app,
      version: qrData.version,
      eventId: qrData.eventId,
      guestId: qrData.guestId,
      tokenLength: qrData.token ? qrData.token.length : 0
    });

    return qrData;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    debugLog('QR data parsing failed', { error: error.message });
    return null;
  }
};

/**
 * Generate a secure random token for additional verification
 * @returns {string} Random verification token
 */
export const generateVerificationToken = () => {
  return CryptoJS.lib.WordArray.random(128/8).toString();
};

/**
 * Hash password for additional security
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
export const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};

/**
 * Validate environment configuration
 * @returns {Object} Configuration status
 */
export const validateCryptoConfig = () => {
  const config = {
    secretKey: {
      present: !!SECRET_KEY,
      length: SECRET_KEY ? SECRET_KEY.length : 0,
      isDefault: SECRET_KEY === 'AFssahVSAG125618fbjUOp158JrRpCeS4'
    },
    hmacKey: {
      present: !!HMAC_KEY,
      length: HMAC_KEY ? HMAC_KEY.length : 0,
      isDefault: HMAC_KEY === 'PDssahVSAG125618ZbjUPp158JrRpCeS4'
    },
    environment: process.env.NODE_ENV
  };

  debugLog('Crypto configuration validated', config);
  return config;
};

/**
 * Test crypto functions with sample data
 * @returns {Object} Test results
 */
export const testCryptoFunctions = () => {
  try {
    const testPayload = {
      guestId: 'TEST_GUEST_123',
      eventId: 'TEST_EVENT_456',
      expiresIn: 1 // 1 hour
    };

    // Test token generation
    const token = generateQRToken(testPayload);
    
    // Test QR data generation
    const qrData = generateQRData(testPayload);
    
    // Test QR data parsing
    const parsedQR = parseQRData(qrData);
    
    // Test token validation
    const validatedToken = validateQRToken(parsedQR.token);

    const results = {
      success: true,
      token: {
        generated: !!token,
        length: token ? token.length : 0
      },
      qrData: {
        generated: !!qrData,
        parsed: !!parsedQR,
        appMatch: parsedQR?.app === 'qr-events'
      },
      validation: {
        success: !!validatedToken,
        eventIdMatch: validatedToken?.eventId === testPayload.eventId,
        guestIdMatch: validatedToken?.guestId === testPayload.guestId,
        notExpired: validatedToken && Date.now() < validatedToken.expires
      }
    };

    debugLog('Crypto test completed', results);
    return results;
  } catch (error) {
    const results = {
      success: false,
      error: error.message
    };
    debugLog('Crypto test failed', results);
    return results;
  }
};

// Export configuration for debugging
export const cryptoConfig = {
  secretKey: SECRET_KEY.substring(0, 4) + '***',
  hmacKey: HMAC_KEY.substring(0, 4) + '***',
  environment: process.env.NODE_ENV
};