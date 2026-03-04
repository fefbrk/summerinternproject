const { resolvePagination, paginateRows } = require('../utils/pagination');
const { moveTempImagesToEntity } = require('../utils/contentImageUtils');

const registerContentRoutes = (app, deps) => {
  const {
    database,
    uuidv4,
    path,
    fs,
    baseImageDir,
    sanitizePlainText,
    sanitizeRichText,
    sanitizeImagesPayload,
    sanitizeUrl,
    sanitizeResourceId,
    blogStatuses,
    eventStatuses,
  } = deps;

  const fsPromises = fs.promises;

  const pathExists = async (targetPath) => {
    try {
      await fsPromises.access(targetPath);
      return true;
    } catch (_error) {
      return false;
    }
  };

  const moveDirectoryFiles = async (sourceDir, targetDir) => {
    await fsPromises.mkdir(targetDir, { recursive: true });
    const files = await fsPromises.readdir(sourceDir);

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      await fsPromises.rename(sourcePath, targetPath);
    }
  };

  const removeDirectoryIfExists = async (targetDir) => {
    if (await pathExists(targetDir)) {
      await fsPromises.rm(targetDir, { recursive: true, force: true });
    }
  };

  const DEFAULT_PUBLIC_PAGE_SIZE = 100;
  const DEFAULT_ADMIN_PAGE_SIZE = 1000;

  const ensureAdminAccess = (req, res) => {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return false;
    }

    return true;
  };

  const sanitizeContentBase = (item) => ({
    ...item,
    title: sanitizePlainText(item.title, 200),
    excerpt: sanitizePlainText(item.excerpt, 600),
    author: sanitizePlainText(item.author, 120),
    content: sanitizeRichText(item.content),
    images: sanitizeImagesPayload(item.images)
  });

  const sanitizeBlogPostForResponse = (post) => sanitizeContentBase(post);
  const sanitizePressReleaseForResponse = (release) => sanitizeContentBase(release);

  const sanitizeMediaCoverageForResponse = (coverage) => ({
    ...sanitizeContentBase(coverage),
    sourceName: sanitizePlainText(coverage.sourceName || '', 200),
    sourceUrl: sanitizeUrl(coverage.sourceUrl || '', 500, { allowRelative: true }),
  });

  const sanitizeEventForResponse = (event) => ({
    ...event,
    title: sanitizePlainText(event.title, 200),
    excerpt: sanitizePlainText(event.excerpt, 600),
    description: sanitizeRichText(event.description),
    venueName: sanitizePlainText(event.venueName, 200),
    venueAddress: sanitizePlainText(event.venueAddress, 300),
    venueCity: sanitizePlainText(event.venueCity, 120),
    venueState: sanitizePlainText(event.venueState, 120),
    venueZipCode: sanitizePlainText(event.venueZipCode, 32),
    venueCountry: sanitizePlainText(event.venueCountry, 120),
    venueWebsite: sanitizeUrl(event.venueWebsite || '', 500, { allowRelative: true }),
    googleMapsLink: sanitizeUrl(event.googleMapsLink || '', 500, { allowRelative: true }),
    organizerName: sanitizePlainText(event.organizerName, 120),
    organizerWebsite: sanitizeUrl(event.organizerWebsite || '', 500, { allowRelative: true }),
    eventWebsite: sanitizeUrl(event.eventWebsite || '', 500, { allowRelative: true }),
    imageUrl: sanitizeUrl(event.imageUrl || '', 500, { allowRelative: true }),
  });

  // Blog Posts Routes
  app.get('/api/blog', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query, DEFAULT_PUBLIC_PAGE_SIZE);
      const blogPosts = await database.getAllBlogPosts(pagination.limit, pagination.offset);
      const publishedBlogPosts = blogPosts.filter((post) => post.status === 'published');
      res.json(publishedBlogPosts.map(sanitizeBlogPostForResponse));
    } catch (error) {
      console.error('Error getting blog posts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/blog', async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) {
        return;
      }

      const pagination = resolvePagination(req.query, DEFAULT_ADMIN_PAGE_SIZE);
      const blogPosts = await database.getAllBlogPosts(pagination.limit, pagination.offset);
      res.json(blogPosts.map(sanitizeBlogPostForResponse));
    } catch (error) {
      console.error('Error getting admin blog posts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/blog/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const blogPost = await database.getBlogPostById(id);
      if (!blogPost || blogPost.status !== 'published') {
        return res.status(404).json({ error: 'Blog post not found' });
      }
      res.json(sanitizeBlogPostForResponse(blogPost));
    } catch (error) {
      console.error('Error getting blog post:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/blog', async (req, res) => {
    try {
      const title = sanitizePlainText(req.body?.title, 200);
      const excerpt = sanitizePlainText(req.body?.excerpt, 600);
      const author = sanitizePlainText(req.body?.author, 120);
      const content = sanitizeRichText(req.body?.content);
      const publishDate = sanitizePlainText(req.body?.publishDate, 64);
      const status = sanitizePlainText(req.body?.status, 40) || 'draft';
      const images = sanitizeImagesPayload(req.body?.images);

      if (!title || !excerpt || !author || !content || !blogStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid blog payload' });
      }

      // If publishDate is not provided or is empty, set it to current date/time
      const finalPublishDate = publishDate || new Date().toISOString();

      const newBlogPost = {
        id: uuidv4(),
        title,
        content,
        excerpt,
        author,
        publishDate: finalPublishDate,
        status,
        images,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const blogPost = await database.createBlogPost(newBlogPost);

      // Move images from temp folder to the blog post folder
      await moveTempImagesToEntity({
        path, fs, baseImageDir,
        folderName: 'blog',
        entity: blogPost,
        updateFn: (id, data) => database.updateBlogPost(id, data),
      });

      res.status(201).json(blogPost);
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/blog/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const title = sanitizePlainText(req.body?.title, 200);
      const excerpt = sanitizePlainText(req.body?.excerpt, 600);
      const author = sanitizePlainText(req.body?.author, 120);
      const content = sanitizeRichText(req.body?.content);
      const publishDate = sanitizePlainText(req.body?.publishDate, 64);
      const status = sanitizePlainText(req.body?.status, 40);
      const images = sanitizeImagesPayload(req.body?.images);

      const existingPost = await database.getBlogPostById(id);
      if (!existingPost) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      const finalPublishDate = publishDate || existingPost.publishDate;
      const finalStatus = status || existingPost.status;

      if (!title || !excerpt || !author || !content || !blogStatuses.has(finalStatus)) {
        return res.status(400).json({ error: 'Invalid blog payload' });
      }

      const updatedBlogPost = {
        title,
        content,
        excerpt,
        author,
        publishDate: finalPublishDate,
        status: finalStatus,
        images,
        updatedAt: new Date().toISOString()
      };

      const blogPost = await database.updateBlogPost(id, updatedBlogPost);
      res.json(blogPost);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/blog/:id/status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const status = sanitizePlainText(req.body?.status, 40);

      if (!blogStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid blog status' });
      }

      const blogPost = await database.updateBlogPostStatus(id, status);
      if (!blogPost) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      res.json(blogPost);
    } catch (error) {
      console.error('Error updating blog post status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/blog/:id', async (req, res) => {
    try {
      const id = sanitizeResourceId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid blog post id' });
      }

      const result = await database.deleteBlogPost(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      // Delete the image directory if it exists
      const imageDir = path.join(baseImageDir, 'blog', id, 'images');
      await removeDirectoryIfExists(imageDir);

      res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Press Releases Routes
  app.get('/api/press-releases', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query, DEFAULT_PUBLIC_PAGE_SIZE);
      const pressReleases = await database.getAllPressReleases(pagination.limit, pagination.offset);
      const publishedPressReleases = pressReleases.filter((release) => release.status === 'published');
      res.json(publishedPressReleases.map(sanitizePressReleaseForResponse));
    } catch (error) {
      console.error('Error getting press releases:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/press-releases', async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) {
        return;
      }

      const pagination = resolvePagination(req.query, DEFAULT_ADMIN_PAGE_SIZE);
      const pressReleases = await database.getAllPressReleases(pagination.limit, pagination.offset);
      res.json(pressReleases.map(sanitizePressReleaseForResponse));
    } catch (error) {
      console.error('Error getting admin press releases:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/press-releases/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const pressRelease = await database.getPressReleaseById(id);
      if (!pressRelease || pressRelease.status !== 'published') {
        return res.status(404).json({ error: 'Press release not found' });
      }
      res.json(sanitizePressReleaseForResponse(pressRelease));
    } catch (error) {
      console.error('Error getting press release:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/press-releases', async (req, res) => {
    try {
      const title = sanitizePlainText(req.body?.title, 200);
      const content = sanitizeRichText(req.body?.content);
      const excerpt = sanitizePlainText(req.body?.excerpt, 600);
      const author = sanitizePlainText(req.body?.author, 120);
      const publishDate = sanitizePlainText(req.body?.publishDate, 64) || new Date().toISOString();
      const status = sanitizePlainText(req.body?.status, 40) || 'draft';
      const images = sanitizeImagesPayload(req.body?.images);

      if (!title || !content || !excerpt || !author || !blogStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid press release payload' });
      }

      const newPressRelease = {
        id: uuidv4(),
        title,
        content,
        excerpt,
        author,
        publishDate,
        status,
        images,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const pressRelease = await database.createPressRelease(newPressRelease);

      // Move images from temp folder to the press release folder
      await moveTempImagesToEntity({
        path, fs, baseImageDir,
        folderName: 'press',
        entity: pressRelease,
        updateFn: (id, data) => database.updatePressRelease(id, data),
      });

      res.status(201).json(pressRelease);
    } catch (error) {
      console.error('Error creating press release:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/press-releases/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const title = sanitizePlainText(req.body?.title, 200);
      const content = sanitizeRichText(req.body?.content);
      const excerpt = sanitizePlainText(req.body?.excerpt, 600);
      const author = sanitizePlainText(req.body?.author, 120);
      const publishDate = sanitizePlainText(req.body?.publishDate, 64);
      const status = sanitizePlainText(req.body?.status, 40);
      const images = sanitizeImagesPayload(req.body?.images);

      const existingPost = await database.getPressReleaseById(id);
      if (!existingPost) {
        return res.status(404).json({ error: 'Press release not found' });
      }

      const finalStatus = status || existingPost.status;

      if (!title || !content || !excerpt || !author || !blogStatuses.has(finalStatus)) {
        return res.status(400).json({ error: 'Invalid press release payload' });
      }

      const updatedPressRelease = {
        title,
        content,
        excerpt,
        author,
        publishDate: publishDate || existingPost.publishDate,
        status: finalStatus,
        images,
        updatedAt: new Date().toISOString()
      };

      const pressRelease = await database.updatePressRelease(id, updatedPressRelease);
      res.json(pressRelease);
    } catch (error) {
      console.error('Error updating press release:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/press-releases/:id/status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const status = sanitizePlainText(req.body?.status, 40);

      if (!blogStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid press release status' });
      }

      const pressRelease = await database.updatePressReleaseStatus(id, status);
      if (!pressRelease) {
        return res.status(404).json({ error: 'Press release not found' });
      }

      res.json(pressRelease);
    } catch (error) {
      console.error('Error updating press release status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/press-releases/:id', async (req, res) => {
    try {
      const id = sanitizeResourceId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid press release id' });
      }

      const result = await database.deletePressRelease(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Press release not found' });
      }

      // Delete associated images
      const imageDir = path.join(baseImageDir, 'press', id, 'images');
      await removeDirectoryIfExists(imageDir);

      res.json({ message: 'Press release deleted successfully' });
    } catch (error) {
      console.error('Error deleting press release:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Media Coverage Routes
  app.get('/api/media-coverage', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query, DEFAULT_PUBLIC_PAGE_SIZE);
      const mediaCoverages = await database.getAllMediaCoverages(pagination.limit, pagination.offset);
      const publishedMediaCoverages = mediaCoverages.filter((coverage) => coverage.status === 'published');
      res.json(publishedMediaCoverages.map(sanitizeMediaCoverageForResponse));
    } catch (error) {
      console.error('Error getting media coverages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/media-coverage', async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) {
        return;
      }

      const pagination = resolvePagination(req.query, DEFAULT_ADMIN_PAGE_SIZE);
      const mediaCoverages = await database.getAllMediaCoverages(pagination.limit, pagination.offset);
      res.json(mediaCoverages.map(sanitizeMediaCoverageForResponse));
    } catch (error) {
      console.error('Error getting admin media coverages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/media-coverage/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const mediaCoverage = await database.getMediaCoverageById(id);
      if (!mediaCoverage || mediaCoverage.status !== 'published') {
        return res.status(404).json({ error: 'Media coverage not found' });
      }
      res.json(sanitizeMediaCoverageForResponse(mediaCoverage));
    } catch (error) {
      console.error('Error getting media coverage:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/media-coverage', async (req, res) => {
    try {
      const title = sanitizePlainText(req.body?.title, 200);
      const content = sanitizeRichText(req.body?.content);
      const excerpt = sanitizePlainText(req.body?.excerpt, 600);
      const sourceName = sanitizePlainText(req.body?.sourceName, 200);
      const sourceUrlRaw = sanitizePlainText(req.body?.sourceUrl, 500);
      const sourceUrl = sanitizeUrl(sourceUrlRaw, 500, { allowRelative: true });
      const author = sanitizePlainText(req.body?.author, 120);
      const publishDate = sanitizePlainText(req.body?.publishDate, 64) || new Date().toISOString();
      const status = sanitizePlainText(req.body?.status, 40) || 'draft';
      const images = sanitizeImagesPayload(req.body?.images);

      if (sourceUrlRaw && !sourceUrl) {
        return res.status(400).json({ error: 'Invalid source URL' });
      }

      if (!title || !content || !excerpt || !author || !blogStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid media coverage payload' });
      }

      const newMediaCoverage = {
        id: uuidv4(),
        title,
        content,
        excerpt,
        sourceName,
        sourceUrl,
        author,
        publishDate,
        status,
        images,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mediaCoverage = await database.createMediaCoverage(newMediaCoverage);

      // Move images from temp folder to the media coverage folder
      await moveTempImagesToEntity({
        path, fs, baseImageDir,
        folderName: 'media',
        entity: mediaCoverage,
        updateFn: (id, data) => database.updateMediaCoverage(id, data),
      });

      res.status(201).json(mediaCoverage);
    } catch (error) {
      console.error('Error creating media coverage:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/media-coverage/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const title = sanitizePlainText(req.body?.title, 200);
      const content = sanitizeRichText(req.body?.content);
      const excerpt = sanitizePlainText(req.body?.excerpt, 600);
      const sourceName = sanitizePlainText(req.body?.sourceName, 200);
      const sourceUrlRaw = sanitizePlainText(req.body?.sourceUrl, 500);
      const sourceUrl = sanitizeUrl(sourceUrlRaw, 500, { allowRelative: true });
      const author = sanitizePlainText(req.body?.author, 120);
      const publishDate = sanitizePlainText(req.body?.publishDate, 64);
      const status = sanitizePlainText(req.body?.status, 40);
      const images = sanitizeImagesPayload(req.body?.images);

      if (sourceUrlRaw && !sourceUrl) {
        return res.status(400).json({ error: 'Invalid source URL' });
      }

      const existingPost = await database.getMediaCoverageById(id);
      if (!existingPost) {
        return res.status(404).json({ error: 'Media coverage not found' });
      }

      const finalStatus = status || existingPost.status;

      if (!title || !content || !excerpt || !author || !blogStatuses.has(finalStatus)) {
        return res.status(400).json({ error: 'Invalid media coverage payload' });
      }

      const updatedMediaCoverage = {
        title,
        content,
        excerpt,
        sourceName: sourceName || existingPost.sourceName || '',
        sourceUrl: sourceUrl || existingPost.sourceUrl || '',
        author,
        publishDate: publishDate || existingPost.publishDate,
        status: finalStatus,
        images,
        updatedAt: new Date().toISOString()
      };

      const mediaCoverage = await database.updateMediaCoverage(id, updatedMediaCoverage);
      res.json(mediaCoverage);
    } catch (error) {
      console.error('Error updating media coverage:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/media-coverage/:id/status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const status = sanitizePlainText(req.body?.status, 40);

      if (!blogStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid media coverage status' });
      }

      const mediaCoverage = await database.updateMediaCoverageStatus(id, status);
      if (!mediaCoverage) {
        return res.status(404).json({ error: 'Media coverage not found' });
      }

      res.json(mediaCoverage);
    } catch (error) {
      console.error('Error updating media coverage status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/media-coverage/:id', async (req, res) => {
    try {
      const id = sanitizeResourceId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid media coverage id' });
      }

      const result = await database.deleteMediaCoverage(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Media coverage not found' });
      }

      // Delete associated images
      const imageDir = path.join(baseImageDir, 'media', id, 'images');
      await removeDirectoryIfExists(imageDir);

      res.json({ message: 'Media coverage deleted successfully' });
    } catch (error) {
      console.error('Error deleting media coverage:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Events Routes
  app.get('/api/events', async (req, res) => {
    try {
      const pagination = resolvePagination(req.query, DEFAULT_PUBLIC_PAGE_SIZE);
      const events = await database.getAllEvents(pagination.limit, pagination.offset);
      const publishedEvents = events.filter((event) => event.status === 'upcoming' || event.status === 'ongoing');
      res.json(publishedEvents.map(sanitizeEventForResponse));
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/events', async (req, res) => {
    try {
      if (!ensureAdminAccess(req, res)) {
        return;
      }

      const pagination = resolvePagination(req.query, DEFAULT_ADMIN_PAGE_SIZE);
      const events = await database.getAllEvents(pagination.limit, pagination.offset);
      res.json(events.map(sanitizeEventForResponse));
    } catch (error) {
      console.error('Error getting admin events:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const event = await database.getEventById(id);
      const publicEventStatuses = new Set(['upcoming', 'ongoing']);
      if (!event || !publicEventStatuses.has(event.status)) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(sanitizeEventForResponse(event));
    } catch (error) {
      console.error('Error getting event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const title = sanitizePlainText(req.body?.title, 200);
      const description = sanitizeRichText(req.body?.description);
      const excerpt = sanitizePlainText(req.body?.excerpt, 600);
      const startDate = sanitizePlainText(req.body?.startDate, 64);
      const endDate = sanitizePlainText(req.body?.endDate, 64);
      const venueName = sanitizePlainText(req.body?.venueName, 200);
      const venueAddress = sanitizePlainText(req.body?.venueAddress, 300);
      const venueCity = sanitizePlainText(req.body?.venueCity, 120);
      const venueState = sanitizePlainText(req.body?.venueState, 120);
      const venueZipCode = sanitizePlainText(req.body?.venueZipCode, 32);
      const venueCountry = sanitizePlainText(req.body?.venueCountry, 120);
      const venueWebsiteRaw = sanitizePlainText(req.body?.venueWebsite, 500);
      const venueWebsite = sanitizeUrl(venueWebsiteRaw, 500, { allowRelative: true });
      const googleMapsLinkRaw = sanitizePlainText(req.body?.googleMapsLink, 500);
      const googleMapsLink = sanitizeUrl(googleMapsLinkRaw, 500, { allowRelative: true });
      const organizerName = sanitizePlainText(req.body?.organizerName, 120);
      const organizerWebsiteRaw = sanitizePlainText(req.body?.organizerWebsite, 500);
      const organizerWebsite = sanitizeUrl(organizerWebsiteRaw, 500, { allowRelative: true });
      const eventWebsiteRaw = sanitizePlainText(req.body?.eventWebsite, 500);
      const eventWebsite = sanitizeUrl(eventWebsiteRaw, 500, { allowRelative: true });
      const status = sanitizePlainText(req.body?.status, 40);
      const category = sanitizePlainText(req.body?.category, 120);
      const imageUrlRaw = sanitizePlainText(req.body?.imageUrl, 500);
      const imageUrl = sanitizeUrl(imageUrlRaw, 500, { allowRelative: true });

      if (venueWebsiteRaw && !venueWebsite) {
        return res.status(400).json({ error: 'Invalid venue website URL' });
      }

      if (googleMapsLinkRaw && !googleMapsLink) {
        return res.status(400).json({ error: 'Invalid Google Maps URL' });
      }

      if (organizerWebsiteRaw && !organizerWebsite) {
        return res.status(400).json({ error: 'Invalid organizer website URL' });
      }

      if (eventWebsiteRaw && !eventWebsite) {
        return res.status(400).json({ error: 'Invalid event website URL' });
      }

      if (imageUrlRaw && !imageUrl) {
        return res.status(400).json({ error: 'Invalid image URL' });
      }

      if (!title || !description || !excerpt || !startDate || !endDate || !venueName || !venueAddress || !venueCity || !venueState || !venueZipCode || !venueCountry || !organizerName || !eventWebsite || !eventStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid event payload' });
      }

      const newEvent = {
        id: uuidv4(),
        title,
        description,
        excerpt,
        startDate,
        endDate,
        venueName,
        venueAddress,
        venueCity,
        venueState,
        venueZipCode,
        venueCountry,
        venueWebsite,
        googleMapsLink,
        organizerName,
        organizerWebsite,
        eventWebsite,
        status,
        category,
        imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const event = await database.createEvent(newEvent);
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/events/:id', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const title = sanitizePlainText(req.body?.title, 200);
      const description = sanitizeRichText(req.body?.description);
      const excerpt = sanitizePlainText(req.body?.excerpt, 600);
      const startDate = sanitizePlainText(req.body?.startDate, 64);
      const endDate = sanitizePlainText(req.body?.endDate, 64);
      const venueName = sanitizePlainText(req.body?.venueName, 200);
      const venueAddress = sanitizePlainText(req.body?.venueAddress, 300);
      const venueCity = sanitizePlainText(req.body?.venueCity, 120);
      const venueState = sanitizePlainText(req.body?.venueState, 120);
      const venueZipCode = sanitizePlainText(req.body?.venueZipCode, 32);
      const venueCountry = sanitizePlainText(req.body?.venueCountry, 120);
      const venueWebsiteRaw = sanitizePlainText(req.body?.venueWebsite, 500);
      const venueWebsite = sanitizeUrl(venueWebsiteRaw, 500, { allowRelative: true });
      const googleMapsLinkRaw = sanitizePlainText(req.body?.googleMapsLink, 500);
      const googleMapsLink = sanitizeUrl(googleMapsLinkRaw, 500, { allowRelative: true });
      const organizerName = sanitizePlainText(req.body?.organizerName, 120);
      const organizerWebsiteRaw = sanitizePlainText(req.body?.organizerWebsite, 500);
      const organizerWebsite = sanitizeUrl(organizerWebsiteRaw, 500, { allowRelative: true });
      const eventWebsiteRaw = sanitizePlainText(req.body?.eventWebsite, 500);
      const eventWebsite = sanitizeUrl(eventWebsiteRaw, 500, { allowRelative: true });
      const status = sanitizePlainText(req.body?.status, 40);
      const category = sanitizePlainText(req.body?.category, 120);
      const imageUrlRaw = sanitizePlainText(req.body?.imageUrl, 500);
      const imageUrl = sanitizeUrl(imageUrlRaw, 500, { allowRelative: true });

      if (venueWebsiteRaw && !venueWebsite) {
        return res.status(400).json({ error: 'Invalid venue website URL' });
      }

      if (googleMapsLinkRaw && !googleMapsLink) {
        return res.status(400).json({ error: 'Invalid Google Maps URL' });
      }

      if (organizerWebsiteRaw && !organizerWebsite) {
        return res.status(400).json({ error: 'Invalid organizer website URL' });
      }

      if (eventWebsiteRaw && !eventWebsite) {
        return res.status(400).json({ error: 'Invalid event website URL' });
      }

      if (imageUrlRaw && !imageUrl) {
        return res.status(400).json({ error: 'Invalid image URL' });
      }

      const existingEvent = await database.getEventById(id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (!title || !description || !excerpt || !startDate || !endDate || !venueName || !venueAddress || !venueCity || !venueState || !venueZipCode || !venueCountry || !organizerName || !eventWebsite || !eventStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid event payload' });
      }

      const updatedEvent = {
        title,
        description,
        excerpt,
        startDate,
        endDate,
        venueName,
        venueAddress,
        venueCity,
        venueState,
        venueZipCode,
        venueCountry,
        venueWebsite,
        googleMapsLink,
        organizerName,
        organizerWebsite,
        eventWebsite,
        status,
        category,
        imageUrl,
        updatedAt: new Date().toISOString()
      };

      const event = await database.updateEvent(id, updatedEvent);
      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/events/:id/status', async (req, res) => {
    try {
      const id = sanitizePlainText(req.params.id, 64);
      const status = sanitizePlainText(req.body?.status, 40);

      if (!eventStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid event status' });
      }

      const event = await database.updateEventStatus(id, status);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(event);
    } catch (error) {
      console.error('Error updating event status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/events/:id', async (req, res) => {
    try {
      const id = sanitizeResourceId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid event id' });
      }

      const result = await database.deleteEvent(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

module.exports = registerContentRoutes;
