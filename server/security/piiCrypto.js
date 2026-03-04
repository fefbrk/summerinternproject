const crypto = require('node:crypto');

const ENCRYPTED_PREFIX = 'enc:v1:';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getRawEncryptionKey = () => {
  const configured = typeof process.env.PII_ENCRYPTION_KEY === 'string'
    ? process.env.PII_ENCRYPTION_KEY.trim()
    : '';

  return configured;
};

const normalizeEncryptionKey = (rawKey) => {
  if (!rawKey) {
    return null;
  }

  const keyCandidate = rawKey.trim();

  const base64Pattern = /^[A-Za-z0-9+/=_-]+$/;
  if (base64Pattern.test(keyCandidate) && keyCandidate.length >= 44) {
    try {
      const decoded = Buffer.from(keyCandidate, 'base64');
      if (decoded.length === 32) {
        return decoded;
      }
    } catch (_error) {
      // no-op
    }
  }

  const hexPattern = /^[A-Fa-f0-9]{64}$/;
  if (hexPattern.test(keyCandidate)) {
    return Buffer.from(keyCandidate, 'hex');
  }

  const utf8 = Buffer.from(keyCandidate, 'utf8');
  if (utf8.length === 32) {
    return utf8;
  }

  return null;
};

const getEncryptionKey = () => {
  return normalizeEncryptionKey(getRawEncryptionKey());
};

const isPiiEncryptionEnabled = () => {
  return Boolean(getEncryptionKey());
};

const isEncryptedValue = (value) => {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX);
};

const encryptPii = (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  if (isEncryptedValue(value)) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString('base64url')}:${authTag.toString('base64url')}:${encrypted.toString('base64url')}`;
};

const decryptPii = (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }

  if (!isEncryptedValue(value)) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  const parts = value.slice(ENCRYPTED_PREFIX.length).split(':');
  if (parts.length !== 3) {
    return value;
  }

  try {
    const iv = Buffer.from(parts[0], 'base64url');
    const authTag = Buffer.from(parts[1], 'base64url');
    const encrypted = Buffer.from(parts[2], 'base64url');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      return value;
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (_error) {
    return value;
  }
};

const hashLookupValue = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '';
  }

  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
};

module.exports = {
  decryptPii,
  encryptPii,
  hashLookupValue,
  isEncryptedValue,
  isPiiEncryptionEnabled,
};
