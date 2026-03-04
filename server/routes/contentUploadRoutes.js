const fs = require('node:fs');
const { isValidUploadedImage } = require('../utils/imageSignature');
const { scanFileForMalware } = require('../security/virusScan');

const registerContentUploadRoutes = (app, deps) => {
  const {
    upload,
    database,
    sanitizeResourceId,
  } = deps;

  const validateUploadedImageOrReject = async (req, res) => {
    const isValid = await isValidUploadedImage({
      filePath: req.file?.path,
      mimeType: req.file?.mimetype,
      originalName: req.file?.originalname,
    });

    if (isValid) {
      const malwareScanResult = await scanFileForMalware(req.file?.path);
      if (malwareScanResult.clean) {
        return true;
      }

      if (req.file?.path) {
        await fs.promises.unlink(req.file.path).catch(() => undefined);
      }

      res.status(400).json({ error: 'Uploaded file failed security scan' });
      return false;
    }

    if (req.file?.path) {
      await fs.promises.unlink(req.file.path).catch(() => undefined);
    }

    res.status(400).json({ error: 'Invalid image signature' });
    return false;
  };

  // Factory: creates an image upload handler for a specific entity type
  const createEntityImageUploadHandler = (entityType, getEntityById, pathPrefix) => {
    return async (req, res) => {
      try {
        const entityId = sanitizeResourceId(req.params.entityId);
        if (!entityId) {
          return res.status(400).json({ error: `Invalid ${entityType} id` });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageIsValid = await validateUploadedImageOrReject(req, res);
        if (!imageIsValid) {
          return;
        }

        const entity = await getEntityById(entityId);
        if (!entity) {
          return res.status(404).json({ error: `${entityType} not found` });
        }

        const imageUrl = `/postimages/${pathPrefix}/${entityId}/images/${req.file.filename}`;

        res.json({
          message: 'Image uploaded successfully',
          imageUrl,
          filename: req.file.filename,
        });
      } catch (error) {
        console.error(`Error uploading ${entityType} image:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  };

  // Factory: creates a temp image upload handler for a specific entity type
  const createTempImageUploadHandler = (pathPrefix) => {
    return async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageIsValid = await validateUploadedImageOrReject(req, res);
        if (!imageIsValid) {
          return;
        }

        const imageUrl = `/postimages/${pathPrefix}/temp/images/${req.file.filename}`;

        res.json({
          message: 'Image uploaded successfully',
          imageUrl,
          filename: req.file.filename,
        });
      } catch (error) {
        console.error(`Error uploading temp ${pathPrefix} image:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  };

  // Blog image endpoints
  app.post('/api/blog/:entityId/images', upload.single('image'),
    createEntityImageUploadHandler('Blog post', (id) => database.getBlogPostById(id), 'blog'));
  app.post('/api/blog/temp/images', upload.single('image'),
    createTempImageUploadHandler('blog'));

  // Press Release image endpoints
  app.post('/api/press-releases/:entityId/images', upload.single('image'),
    createEntityImageUploadHandler('Press release', (id) => database.getPressReleaseById(id), 'press'));
  app.post('/api/press-releases/temp/images', upload.single('image'),
    createTempImageUploadHandler('press'));

  // Media Coverage image endpoints
  app.post('/api/media-coverage/:entityId/images', upload.single('image'),
    createEntityImageUploadHandler('Media coverage', (id) => database.getMediaCoverageById(id), 'media'));
  app.post('/api/media-coverage/temp/images', upload.single('image'),
    createTempImageUploadHandler('media'));

  // Event image endpoints
  app.post('/api/events/:entityId/images', upload.single('image'),
    createEntityImageUploadHandler('Event', (id) => database.getEventById(id), 'events'));
  app.post('/api/events/temp/images', upload.single('image'),
    createTempImageUploadHandler('events'));
};

module.exports = registerContentUploadRoutes;
