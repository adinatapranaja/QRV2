// src/utils/uuid.js

/**
 * Generate UUID v4
 * @returns {string} UUID string
 */
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate short ID for events/guests
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Short ID
 */
export const generateShortId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${randomPart}`.toUpperCase();
};

/**
 * Generate event ID
 * @returns {string} Event ID
 */
export const generateEventId = () => {
  return generateShortId('EVT_');
};

/**
 * Generate guest ID
 * @returns {string} Guest ID
 */
export const generateGuestId = () => {
  return generateShortId('GST_');
};

/**
 * Generate QR code ID
 * @returns {string} QR code ID
 */
export const generateQRId = () => {
  return generateShortId('QR_');
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 */
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Generate secure random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
export const generateSecureString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for older browsers
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
};