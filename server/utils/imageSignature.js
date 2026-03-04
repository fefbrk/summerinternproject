const fs = require('node:fs');
const path = require('node:path');

const MIME_BY_TYPE = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const EXTENSIONS_BY_TYPE = {
  jpeg: new Set(['.jpg', '.jpeg']),
  png: new Set(['.png']),
  gif: new Set(['.gif']),
  webp: new Set(['.webp']),
};

const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  const gifHeader = buffer.subarray(0, 6).toString('ascii');
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
    return 'gif';
  }

  const riffHeader = buffer.subarray(0, 4).toString('ascii');
  const webpHeader = buffer.subarray(8, 12).toString('ascii');
  if (riffHeader === 'RIFF' && webpHeader === 'WEBP') {
    return 'webp';
  }

  return null;
};

const readSignatureBuffer = async (filePath) => {
  const fileHandle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(32);
    await fileHandle.read(buffer, 0, buffer.length, 0);
    return buffer;
  } finally {
    await fileHandle.close();
  }
};

const isValidUploadedImage = async ({ filePath, mimeType, originalName }) => {
  if (!filePath || !mimeType) {
    return false;
  }

  const signatureBuffer = await readSignatureBuffer(filePath);
  const detectedType = detectImageType(signatureBuffer);
  if (!detectedType) {
    return false;
  }

  const expectedMime = MIME_BY_TYPE[detectedType];
  if (!expectedMime || mimeType !== expectedMime) {
    return false;
  }

  const extension = path.extname(originalName || filePath || '').toLowerCase();
  const allowedExtensions = EXTENSIONS_BY_TYPE[detectedType];
  if (!allowedExtensions || !allowedExtensions.has(extension)) {
    return false;
  }

  return true;
};

module.exports = {
  isValidUploadedImage,
};
