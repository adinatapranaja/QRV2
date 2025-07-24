// src/utils/crypto.js
import CryptoJS from 'crypto-js';

// Secret key for encryption (in production, use environment variable)
const SECRET_KEY = process.env.REACT_APP_QR_SECRET || 'your-super-secret-key-change-this';
const HMAC_KEY = process.env.REACT_APP_HMAC_SECRET || 'your-hmac-secret-key-change-this';

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
    const { guestId, eventId, expiresIn = 24 } = payload;
    
    // Create token data
    const tokenData = {
      guestId,
      eventId,
      timestamp: Date.now(),
      expires: Date.now() + (expiresIn * 60 * 60 * 1000), // Convert hours to milliseconds
      used: false,
      version: '1.0'
    };

    // Convert to JSON string
    const dataString = JSON.stringify(tokenData);
    
    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
    
    // Generate HMAC for integrity
    const hmac = CryptoJS.HmacSHA256(encrypted, HMAC_KEY).toString();
    
    // Combine encrypted data and HMAC
    const token = `${encrypted}.${hmac}`;
    
    return token;
  } catch (error) {
    console.error('Error generating QR token:', error);
    throw new Error('Failed to generate QR token');
  }
};

/**
 * Decrypt and validate QR token
 * @param {string} token - Encrypted token
 * @returns {Object|null} Decrypted data or null if invalid
 */
export const validateQRToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    // Split token into encrypted data and HMAC
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid token structure');
    }

    const [encrypted, hmac] = parts;

    // Verify HMAC
    const expectedHmac = CryptoJS.HmacSHA256(encrypted, HMAC_KEY).toString();
    if (hmac !== expectedHmac) {
      throw new Error('Token integrity check failed');
    }

    // Decrypt the data
    const decryptedBytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedData) {
      throw new Error('Failed to decrypt token');
    }

    // Parse JSON
    const tokenData = JSON.parse(decryptedData);

    // Validate token structure
    if (!tokenData.guestId || !tokenData.eventId || !tokenData.timestamp || !tokenData.expires) {
      throw new Error('Invalid token data structure');
    }

    // Check if token is expired
    if (Date.now() > tokenData.expires) {
      throw new Error('Token has expired');
    }

    // Check if token was already used
    if (tokenData.used) {
      throw new Error('Token has already been used');
    }

    return tokenData;
  } catch (error) {
    console.error('Error validating QR token:', error);
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
 * Generate QR data URL with encrypted token
 * @param {Object} payload - Token payload
 * @returns {string} Base64 encoded QR data
 */
export const generateQRData = (payload) => {
  const token = generateQRToken(payload);
  
  // Create QR data object
  const qrData = {
    token,
    app: 'qr-events',
    version: '1.0',
    timestamp: Date.now()
  };

  return JSON.stringify(qrData);
};

/**
 * Parse QR data and extract token
 * @param {string} qrDataString - Scanned QR data
 * @returns {Object|null} Parsed QR data or null if invalid
 */
export const parseQRData = (qrDataString) => {
  try {
    const qrData = JSON.parse(qrDataString);
    
    // Validate QR data structure
    if (!qrData.token || qrData.app !== 'qr-events') {
      throw new Error('Invalid QR code format');
    }

    return qrData;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
};