const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getDatabasePath = () => {
  const configuredPath = typeof process.env.SQLITE_RESTORE_TARGET_PATH === 'string'
    ? process.env.SQLITE_RESTORE_TARGET_PATH.trim()
    : '';

  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  const sqliteDbPath = typeof process.env.SQLITE_DB_PATH === 'string'
    ? process.env.SQLITE_DB_PATH.trim()
    : '';

  if (sqliteDbPath) {
    return path.resolve(sqliteDbPath);
  }

  return path.join(__dirname, '..', 'database', 'kinderlab.db');
};

const normalizeEncryptionKey = (rawValue) => {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return null;
  }

  const candidate = rawValue.trim();
  const base64Pattern = /^[A-Za-z0-9+/=_-]+$/;
  if (base64Pattern.test(candidate) && candidate.length >= 44) {
    try {
      const decoded = Buffer.from(candidate, 'base64');
      if (decoded.length === 32) {
        return decoded;
      }
    } catch (_error) {
      // no-op
    }
  }

  const hexPattern = /^[A-Fa-f0-9]{64}$/;
  if (hexPattern.test(candidate)) {
    return Buffer.from(candidate, 'hex');
  }

  const utf8 = Buffer.from(candidate, 'utf8');
  if (utf8.length === 32) {
    return utf8;
  }

  return null;
};

const buildTimestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
};

const decodeEncryptedBackup = (encryptedPath, encryptionKey) => {
  const payloadText = fs.readFileSync(encryptedPath, 'utf8');
  const payload = JSON.parse(payloadText);

  if (!payload || payload.version !== 1 || payload.algorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported encrypted backup format.');
  }

  const iv = Buffer.from(String(payload.iv || ''), 'base64url');
  const authTag = Buffer.from(String(payload.authTag || ''), 'base64url');
  const ciphertext = Buffer.from(String(payload.ciphertext || ''), 'base64url');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH || ciphertext.length === 0) {
    throw new Error('Encrypted backup payload is invalid.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

const main = () => {
  const backupArgument = process.argv[2];
  if (!backupArgument) {
    throw new Error('Backup file path is required. Usage: npm run restore:db -- <backup-file>');
  }

  const backupPath = path.resolve(backupArgument);
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const targetDatabasePath = getDatabasePath();
  fs.mkdirSync(path.dirname(targetDatabasePath), { recursive: true });

  const restoreTimestamp = buildTimestamp();
  const preRestoreBackupPath = `${targetDatabasePath}.pre-restore-${restoreTimestamp}.bak`;
  const tempRestorePath = `${targetDatabasePath}.restore.tmp`;

  if (fs.existsSync(targetDatabasePath)) {
    fs.copyFileSync(targetDatabasePath, preRestoreBackupPath);
  }

  try {
    if (backupPath.endsWith('.enc')) {
      const encryptionKey = normalizeEncryptionKey(process.env.SQLITE_BACKUP_ENCRYPTION_KEY || '');
      if (!encryptionKey) {
        throw new Error('SQLITE_BACKUP_ENCRYPTION_KEY is required to restore encrypted backups.');
      }

      const decryptedBuffer = decodeEncryptedBackup(backupPath, encryptionKey);
      fs.writeFileSync(tempRestorePath, decryptedBuffer, { mode: 0o600 });
    } else {
      fs.copyFileSync(backupPath, tempRestorePath);
    }

    const walPath = `${targetDatabasePath}-wal`;
    const shmPath = `${targetDatabasePath}-shm`;
    if (fs.existsSync(walPath)) {
      fs.unlinkSync(walPath);
    }
    if (fs.existsSync(shmPath)) {
      fs.unlinkSync(shmPath);
    }
    if (fs.existsSync(targetDatabasePath)) {
      fs.unlinkSync(targetDatabasePath);
    }

    fs.renameSync(tempRestorePath, targetDatabasePath);
  } catch (error) {
    if (fs.existsSync(tempRestorePath)) {
      fs.unlinkSync(tempRestorePath);
    }

    throw error;
  }

  console.log(`Database restored to: ${targetDatabasePath}`);
  if (fs.existsSync(preRestoreBackupPath)) {
    console.log(`Pre-restore snapshot: ${preRestoreBackupPath}`);
  }
};

try {
  main();
} catch (error) {
  console.error('Database restore failed:', error);
  process.exit(1);
}
