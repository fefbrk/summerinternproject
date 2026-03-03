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

// Blog Posts Routes
app.get('/api/blog', async (req, res) => {
  try {
    const blogPosts = await database.getAllBlogPosts();
    const sanitizedBlogPosts = blogPosts.map((post) => ({
      ...post,
      title: sanitizePlainText(post.title, 200),
      excerpt: sanitizePlainText(post.excerpt, 600),
      author: sanitizePlainText(post.author, 120),
      content: sanitizeRichText(post.content),
      images: sanitizeImagesPayload(post.images)
    }));
    res.json(sanitizedBlogPosts);
  } catch (error) {
    console.error('Error getting blog posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/blog/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const blogPost = await database.getBlogPostById(id);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json({
      ...blogPost,
      title: sanitizePlainText(blogPost.title, 200),
      excerpt: sanitizePlainText(blogPost.excerpt, 600),
      author: sanitizePlainText(blogPost.author, 120),
      content: sanitizeRichText(blogPost.content),
      images: sanitizeImagesPayload(blogPost.images)
    });
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
    const tempDir = path.join(baseImageDir, 'blog', 'temp', 'images');
    const targetDir = path.join(baseImageDir, 'blog', String(blogPost.id), 'images');
    
    if (await pathExists(tempDir)) {
      await moveDirectoryFiles(tempDir, targetDir);

      if (blogPost.images && Array.isArray(blogPost.images)) {
        blogPost.images = blogPost.images.map((img) => {
          if (img.src && img.src.includes('/postimages/blog/temp/images/')) {
            return {
              ...img,
              src: img.src.replace('/postimages/blog/temp/images/', `/postimages/blog/${String(blogPost.id)}/images/`)
            };
          }

          return img;
        });

        const updatedBlogPost = await database.updateBlogPost(blogPost.id, { images: blogPost.images });
        if (updatedBlogPost) {
          blogPost.images = updatedBlogPost.images;
        }
      }
    }
    
    res.json(blogPost);
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
    const pressReleases = await database.getAllPressReleases();
    res.json(pressReleases.map((release) => ({
      ...release,
      title: sanitizePlainText(release.title, 200),
      excerpt: sanitizePlainText(release.excerpt, 600),
      author: sanitizePlainText(release.author, 120),
      content: sanitizeRichText(release.content),
      images: sanitizeImagesPayload(release.images)
    })));
  } catch (error) {
    console.error('Error getting press releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/press-releases/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const pressRelease = await database.getPressReleaseById(id);
    if (!pressRelease) {
      return res.status(404).json({ error: 'Press release not found' });
    }
    res.json({
      ...pressRelease,
      title: sanitizePlainText(pressRelease.title, 200),
      excerpt: sanitizePlainText(pressRelease.excerpt, 600),
      author: sanitizePlainText(pressRelease.author, 120),
      content: sanitizeRichText(pressRelease.content),
      images: sanitizeImagesPayload(pressRelease.images)
    });
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
      id: Date.now().toString(),
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
    const tempDir = path.join(baseImageDir, 'press', 'temp', 'images');
    const targetDir = path.join(baseImageDir, 'press', String(pressRelease.id), 'images');
    
    if (await pathExists(tempDir)) {
      await moveDirectoryFiles(tempDir, targetDir);
      await removeDirectoryIfExists(tempDir);
      
      // Update image URLs in the press release
      if (pressRelease.images && Array.isArray(pressRelease.images)) {
        pressRelease.images = pressRelease.images.map(img => {
          if (img.src && img.src.includes('/postimages/press/temp/images/')) {
            return {
              ...img,
              src: img.src.replace('/postimages/press/temp/images/', `/postimages/press/${String(pressRelease.id)}/images/`)
            };
          }
          return img;
        });
      }
      
      // Update the press release with corrected image URLs
      await database.updatePressRelease(pressRelease.id, { images: pressRelease.images });
    }

    res.json(pressRelease);
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
    const mediaCoverages = await database.getAllMediaCoverages();
    res.json(mediaCoverages.map((coverage) => ({
      ...coverage,
      title: sanitizePlainText(coverage.title, 200),
      excerpt: sanitizePlainText(coverage.excerpt, 600),
      sourceName: sanitizePlainText(coverage.sourceName || '', 200),
      sourceUrl: sanitizePlainText(coverage.sourceUrl || '', 500),
      author: sanitizePlainText(coverage.author, 120),
      content: sanitizeRichText(coverage.content),
      images: sanitizeImagesPayload(coverage.images)
    })));
  } catch (error) {
    console.error('Error getting media coverages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/media-coverage/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const mediaCoverage = await database.getMediaCoverageById(id);
    if (!mediaCoverage) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }
    res.json({
      ...mediaCoverage,
      title: sanitizePlainText(mediaCoverage.title, 200),
      excerpt: sanitizePlainText(mediaCoverage.excerpt, 600),
      sourceName: sanitizePlainText(mediaCoverage.sourceName || '', 200),
      sourceUrl: sanitizePlainText(mediaCoverage.sourceUrl || '', 500),
      author: sanitizePlainText(mediaCoverage.author, 120),
      content: sanitizeRichText(mediaCoverage.content),
      images: sanitizeImagesPayload(mediaCoverage.images)
    });
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
    const sourceUrl = sanitizePlainText(req.body?.sourceUrl, 500);
    const author = sanitizePlainText(req.body?.author, 120);
    const publishDate = sanitizePlainText(req.body?.publishDate, 64) || new Date().toISOString();
    const status = sanitizePlainText(req.body?.status, 40) || 'draft';
    const images = sanitizeImagesPayload(req.body?.images);

    if (!title || !content || !excerpt || !author || !blogStatuses.has(status)) {
      return res.status(400).json({ error: 'Invalid media coverage payload' });
    }

    const newMediaCoverage = {
      id: Date.now().toString(),
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
    const tempDir = path.join(baseImageDir, 'media', 'temp', 'images');
    const targetDir = path.join(baseImageDir, 'media', String(mediaCoverage.id), 'images');
    
    if (await pathExists(tempDir)) {
      await moveDirectoryFiles(tempDir, targetDir);
      await removeDirectoryIfExists(tempDir);
      
      // Update image URLs in the media coverage
      if (mediaCoverage.images && Array.isArray(mediaCoverage.images)) {
        mediaCoverage.images = mediaCoverage.images.map(img => {
          if (img.src && img.src.includes('/postimages/media/temp/images/')) {
            return {
              ...img,
              src: img.src.replace('/postimages/media/temp/images/', `/postimages/media/${String(mediaCoverage.id)}/images/`)
            };
          }
          return img;
        });
      }
      
      // Update the media coverage with corrected image URLs
      await database.updateMediaCoverage(mediaCoverage.id, { images: mediaCoverage.images });
    }

    res.json(mediaCoverage);
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
    const sourceUrl = sanitizePlainText(req.body?.sourceUrl, 500);
    const author = sanitizePlainText(req.body?.author, 120);
    const publishDate = sanitizePlainText(req.body?.publishDate, 64);
    const status = sanitizePlainText(req.body?.status, 40);
    const images = sanitizeImagesPayload(req.body?.images);

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
    const events = await database.getAllEvents();
    res.json(events.map((event) => ({
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
      organizerName: sanitizePlainText(event.organizerName, 120)
    })));
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const id = sanitizePlainText(req.params.id, 64);
    const event = await database.getEventById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({
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
      organizerName: sanitizePlainText(event.organizerName, 120)
    });
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
    const venueWebsite = sanitizePlainText(req.body?.venueWebsite, 500);
    const googleMapsLink = sanitizePlainText(req.body?.googleMapsLink, 500);
    const organizerName = sanitizePlainText(req.body?.organizerName, 120);
    const organizerWebsite = sanitizePlainText(req.body?.organizerWebsite, 500);
    const eventWebsite = sanitizePlainText(req.body?.eventWebsite, 500);
    const status = sanitizePlainText(req.body?.status, 40);
    const category = sanitizePlainText(req.body?.category, 120);
    const imageUrl = sanitizePlainText(req.body?.imageUrl, 500);

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
    res.json(event);
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
    const venueWebsite = sanitizePlainText(req.body?.venueWebsite, 500);
    const googleMapsLink = sanitizePlainText(req.body?.googleMapsLink, 500);
    const organizerName = sanitizePlainText(req.body?.organizerName, 120);
    const organizerWebsite = sanitizePlainText(req.body?.organizerWebsite, 500);
    const eventWebsite = sanitizePlainText(req.body?.eventWebsite, 500);
    const status = sanitizePlainText(req.body?.status, 40);
    const category = sanitizePlainText(req.body?.category, 120);
    const imageUrl = sanitizePlainText(req.body?.imageUrl, 500);
    
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
