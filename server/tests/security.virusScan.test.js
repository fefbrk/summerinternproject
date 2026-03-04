const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const virusScanModulePath = path.join(__dirname, '..', 'security', 'virusScan.js');

const loadVirusScanModule = () => {
  delete require.cache[require.resolve(virusScanModulePath)];
  return require(virusScanModulePath);
};

const withEnvironment = async (overrides, callback) => {
  const previousValues = {};

  for (const [key, value] of Object.entries(overrides)) {
    previousValues[key] = process.env[key];
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await callback();
  } finally {
    for (const [key, previousValue] of Object.entries(previousValues)) {
      if (typeof previousValue === 'undefined') {
        delete process.env[key];
      } else {
        process.env[key] = previousValue;
      }
    }

    delete require.cache[require.resolve(virusScanModulePath)];
  }
};

test('virus scan fail-open defaults to true in non-production', async () => {
  await withEnvironment({
    NODE_ENV: 'test',
    ENABLE_VIRUS_SCAN: 'true',
    VIRUS_SCAN_COMMAND: 'missing-virus-scan-command-for-test',
    VIRUS_SCAN_FAIL_OPEN: undefined,
  }, async () => {
    const { scanFileForMalware } = loadVirusScanModule();

    const result = await scanFileForMalware('dummy-file-for-test');

    assert.equal(result.clean, true);
    assert.equal(result.skipped, true);
    assert.equal(result.reason, 'virus-scan-provider-error-fail-open');
  });
});

test('virus scan fail-open defaults to false in production', async () => {
  await withEnvironment({
    NODE_ENV: 'production',
    ENABLE_VIRUS_SCAN: 'true',
    VIRUS_SCAN_COMMAND: 'missing-virus-scan-command-for-test',
    VIRUS_SCAN_FAIL_OPEN: undefined,
  }, async () => {
    const { scanFileForMalware } = loadVirusScanModule();

    const result = await scanFileForMalware('dummy-file-for-test');

    assert.equal(result.clean, false);
    assert.equal(result.skipped, true);
    assert.equal(result.reason, 'virus-scan-provider-error-fail-closed');
  });
});
