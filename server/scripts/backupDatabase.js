const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const DEFAULT_KEEP_COUNT = 30;
const DEFAULT_RETENTION_DAYS = 30;
const IV_LENGTH = 12;

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }

  return fallback;
};

const getDatabasePath = () => {
  const configuredPath = typeof process.env.SQLITE_DB_PATH === 'string'
    ? process.env.SQLITE_DB_PATH.trim()
    : '';

  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  return path.join(__dirname, '..', 'database', 'kinderlab.db');
};

const getBackupDirectory = (databasePath) => {
  const configuredPath = typeof process.env.SQLITE_BACKUP_DIR === 'string'
    ? process.env.SQLITE_BACKUP_DIR.trim()
    : '';

  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  return path.join(path.dirname(databasePath), 'backups');
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

const escapeSqlLiteral = (value) => {
  return String(value).replace(/'/g, "''");
};

const openDatabase = (databasePath) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(db);
    });
  });
};

const runSql = (db, sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const closeDatabase = (db) => {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

const encryptBackupFile = (plainPath, encryptedPath, encryptionKey) => {
  const plainBuffer = fs.readFileSync(plainPath);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = {
    version: 1,
    algorithm: 'aes-256-gcm',
    createdAt: new Date().toISOString(),
    iv: iv.toString('base64url'),
    authTag: authTag.toString('base64url'),
    ciphertext: encrypted.toString('base64url'),
  };

  fs.writeFileSync(encryptedPath, `${JSON.stringify(payload)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.unlinkSync(plainPath);
};

const listBackupFiles = (backupDirectory, backupPrefix) => {
  if (!fs.existsSync(backupDirectory)) {
    return [];
  }

  const files = fs.readdirSync(backupDirectory, { withFileTypes: true });

  return files
    .filter((entry) => {
      if (!entry.isFile()) {
        return false;
      }

      if (!entry.name.startsWith(`${backupPrefix}-`)) {
        return false;
      }

      return entry.name.endsWith('.db') || entry.name.endsWith('.db.enc');
    })
    .map((entry) => {
      const fullPath = path.join(backupDirectory, entry.name);
      const stat = fs.statSync(fullPath);

      return {
        path: fullPath,
        mtimeMs: stat.mtimeMs,
      };
    });
};

const pruneBackups = ({ backupDirectory, backupPrefix, preservePath, keepCount, retentionDays }) => {
  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const candidates = listBackupFiles(backupDirectory, backupPrefix);

  const keptByAge = [];
  for (const candidate of candidates) {
    if (candidate.path === preservePath) {
      keptByAge.push(candidate);
      continue;
    }

    if (now - candidate.mtimeMs > maxAgeMs) {
      fs.unlinkSync(candidate.path);
      continue;
    }

    keptByAge.push(candidate);
  }

  keptByAge.sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (let index = keepCount; index < keptByAge.length; index += 1) {
    const candidate = keptByAge[index];
    if (candidate.path === preservePath) {
      continue;
    }

    fs.unlinkSync(candidate.path);
  }
};

const main = async () => {
  const databasePath = getDatabasePath();
  if (!fs.existsSync(databasePath)) {
    throw new Error(`Database file not found: ${databasePath}`);
  }

  const backupDirectory = getBackupDirectory(databasePath);
  fs.mkdirSync(backupDirectory, { recursive: true });

  const databaseBaseName = path.basename(databasePath, path.extname(databasePath));
  const timestamp = buildTimestamp();
  const backupPrefix = databaseBaseName;
  const plainBackupPath = path.join(backupDirectory, `${backupPrefix}-${timestamp}.db`);

  const db = await openDatabase(databasePath);
  try {
    const snapshotSql = `VACUUM INTO '${escapeSqlLiteral(plainBackupPath)}'`;
    await runSql(db, snapshotSql);
  } finally {
    await closeDatabase(db);
  }

  const encryptionKey = normalizeEncryptionKey(process.env.SQLITE_BACKUP_ENCRYPTION_KEY || '');
  const shouldEncrypt = Boolean(process.env.SQLITE_BACKUP_ENCRYPTION_KEY);
  if (shouldEncrypt && !encryptionKey) {
    fs.unlinkSync(plainBackupPath);
    throw new Error('SQLITE_BACKUP_ENCRYPTION_KEY is set but invalid. Provide a valid 32-byte utf8/base64/hex key.');
  }

  let finalBackupPath = plainBackupPath;
  if (encryptionKey) {
    finalBackupPath = `${plainBackupPath}.enc`;
    encryptBackupFile(plainBackupPath, finalBackupPath, encryptionKey);
  }

  const keepCount = parsePositiveInteger(process.env.SQLITE_BACKUP_KEEP_COUNT, DEFAULT_KEEP_COUNT);
  const retentionDays = parsePositiveInteger(process.env.SQLITE_BACKUP_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);

  pruneBackups({
    backupDirectory,
    backupPrefix,
    preservePath: finalBackupPath,
    keepCount,
    retentionDays,
  });

  console.log(`Database backup created: ${finalBackupPath}`);
};

main().catch((error) => {
  console.error('Database backup failed:', error);
  process.exit(1);
});
