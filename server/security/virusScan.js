const { execFile } = require('node:child_process');

const isVirusScanEnabled = () => process.env.ENABLE_VIRUS_SCAN === 'true';

const isFailOpen = () => {
  const configuredValue = typeof process.env.VIRUS_SCAN_FAIL_OPEN === 'string'
    ? process.env.VIRUS_SCAN_FAIL_OPEN.trim().toLowerCase()
    : '';

  if (configuredValue === 'true') {
    return true;
  }

  if (configuredValue === 'false') {
    return false;
  }

  return process.env.NODE_ENV !== 'production';
};

const scanFileForMalware = (filePath) => {
  if (!isVirusScanEnabled()) {
    return Promise.resolve({
      clean: true,
      skipped: true,
      reason: 'virus-scan-disabled',
    });
  }

  const scannerCommand = typeof process.env.VIRUS_SCAN_COMMAND === 'string' && process.env.VIRUS_SCAN_COMMAND.trim().length > 0
    ? process.env.VIRUS_SCAN_COMMAND.trim()
    : 'clamscan';
  const scannerArgs = [
    '--no-summary',
    filePath,
  ];

  return new Promise((resolve) => {
    execFile(scannerCommand, scannerArgs, { timeout: 20000 }, (error, _stdout, _stderr) => {
      if (!error) {
        resolve({
          clean: true,
          skipped: false,
          reason: 'virus-scan-clean',
        });
        return;
      }

      const exitCode = typeof error.code === 'number' ? error.code : null;
      if (exitCode === 1) {
        resolve({
          clean: false,
          skipped: false,
          reason: 'virus-scan-detected-malware',
        });
        return;
      }

      if (isFailOpen()) {
        resolve({
          clean: true,
          skipped: true,
          reason: 'virus-scan-provider-error-fail-open',
        });
        return;
      }

      resolve({
        clean: false,
        skipped: true,
        reason: 'virus-scan-provider-error-fail-closed',
      });
    });
  });
};

module.exports = {
  scanFileForMalware,
};
