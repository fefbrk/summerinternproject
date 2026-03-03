const crypto = require('crypto');

const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${HASH_PREFIX}:${salt}:${derivedKey}`;
};

const verifyPassword = (password, storedPassword) => {
  if (!storedPassword || typeof storedPassword !== 'string') {
    return false;
  }

  if (!storedPassword.startsWith(`${HASH_PREFIX}:`)) {
    console.warn('WARNING: Plaintext password comparison used. This user password should be migrated to scrypt hash.');
    return password === storedPassword;
  }

  const [, salt, key] = storedPassword.split(':');
  if (!salt || !key) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  const storedKeyBuffer = Buffer.from(key, 'hex');

  if (storedKeyBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedKeyBuffer, derivedKey);
};

const isHashedPassword = (storedPassword) => {
  return typeof storedPassword === 'string' && storedPassword.startsWith(`${HASH_PREFIX}:`);
};

module.exports = {
  hashPassword,
  verifyPassword,
  isHashedPassword
};
