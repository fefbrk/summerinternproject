const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const ALLOWED_EMAIL_DOMAINS = new Set([
  'example.com',
  'local.invalid',
  'kinderlab.local',
]);

const extractEmailDomains = (value) => {
  const source = String(value || '');
  const matcher = /[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
  const domains = [];
  let match = null;

  while ((match = matcher.exec(source)) !== null) {
    const domain = String(match[1] || '').toLowerCase();
    if (domain) {
      domains.push(domain);
    }
  }

  return domains;
};

const collectDisallowedDomains = (domains) => {
  return domains.filter((domain) => !ALLOWED_EMAIL_DOMAINS.has(domain));
};

const collectFixtureViolations = (fixturePath) => {
  if (!fs.existsSync(fixturePath)) {
    return [];
  }

  const fixtureContent = fs.readFileSync(fixturePath, 'utf8');
  const disallowedDomains = collectDisallowedDomains(extractEmailDomains(fixtureContent));
  if (disallowedDomains.length === 0) {
    return [];
  }

  return [{
    source: 'server/fixtures/demo-data.json',
    domains: [...new Set(disallowedDomains)].sort(),
  }];
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

const allAsync = (db, sql) => {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows || []);
    });
  });
};

const closeAsync = (db) => {
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

const collectDatabaseViolations = async (databasePath) => {
  if (!fs.existsSync(databasePath)) {
    return [];
  }

  const db = await openDatabase(databasePath);

  try {
    const checks = [
      {
        label: 'users.email',
        sql: 'SELECT email as value FROM users',
      },
      {
        label: 'contacts.email',
        sql: 'SELECT email as value FROM contacts',
      },
      {
        label: 'orders.customer_email',
        sql: 'SELECT customer_email as value FROM orders',
      },
      {
        label: 'orders.shipping_address',
        sql: 'SELECT shipping_address as value FROM orders',
      },
      {
        label: 'course_registrations.customer_email',
        sql: 'SELECT customer_email as value FROM course_registrations',
      },
      {
        label: 'course_registrations.registration_data',
        sql: 'SELECT registration_data as value FROM course_registrations',
      },
    ];

    const violations = [];

    for (const check of checks) {
      const rows = await allAsync(db, check.sql);
      const domains = rows.flatMap((row) => extractEmailDomains(row?.value));
      const disallowedDomains = collectDisallowedDomains(domains);

      if (disallowedDomains.length > 0) {
        violations.push({
          source: check.label,
          domains: [...new Set(disallowedDomains)].sort(),
        });
      }
    }

    return violations;
  } finally {
    await closeAsync(db);
  }
};

const main = async () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const fixturePath = path.join(projectRoot, 'server', 'fixtures', 'demo-data.json');
  const databasePath = path.join(projectRoot, 'server', 'database', 'kinderlab.db');

  const violations = [
    ...collectFixtureViolations(fixturePath),
    ...(await collectDatabaseViolations(databasePath)),
  ];

  if (violations.length > 0) {
    console.error('Found disallowed email domains in tracked demo assets.');
    console.error(`Allowed domains: ${[...ALLOWED_EMAIL_DOMAINS].join(', ')}`);

    for (const violation of violations) {
      console.error(`- ${violation.source}: ${violation.domains.join(', ')}`);
    }

    process.exit(1);
  }

  console.log('Tracked demo DB and fixture email domains are safe.');
};

main().catch((error) => {
  console.error('DB safety check failed with an unexpected error:', error);
  process.exit(1);
});
