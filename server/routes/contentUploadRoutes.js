const registerContentUploadRoutes = (app, deps) => {
  const {
    upload,
    database,
    sanitizeResourceId,
  } = deps;

// Blog image upload endpoint
app.post('/api/blog/:blogPostId/images', upload.single('image'), async (req, res) => {
  try {
    const blogPostId = sanitizeResourceId(req.params.blogPostId);
    if (!blogPostId) {
      return res.status(400).json({ error: 'Invalid blog post id' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if blog post exists
    const blogPost = await database.getBlogPostById(blogPostId);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/blog/${blogPostId}/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Temporary image upload endpoint (for new blog posts)
app.post('/api/blog/temp/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/blog/temp/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Press Release image upload endpoint
app.post('/api/press-releases/:pressReleaseId/images', upload.single('image'), async (req, res) => {
  try {
    const pressReleaseId = sanitizeResourceId(req.params.pressReleaseId);
    if (!pressReleaseId) {
      return res.status(400).json({ error: 'Invalid press release id' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if press release exists
    const pressRelease = await database.getPressReleaseById(pressReleaseId);
    if (!pressRelease) {
      return res.status(404).json({ error: 'Press release not found' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/press/${pressReleaseId}/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Temporary press release image upload endpoint
app.post('/api/press-releases/temp/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/press/temp/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Media Coverage image upload endpoint
app.post('/api/media-coverage/:mediaCoverageId/images', upload.single('image'), async (req, res) => {
  try {
    const mediaCoverageId = sanitizeResourceId(req.params.mediaCoverageId);
    if (!mediaCoverageId) {
      return res.status(400).json({ error: 'Invalid media coverage id' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if media coverage exists
    const mediaCoverage = await database.getMediaCoverageById(mediaCoverageId);
    if (!mediaCoverage) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/media/${mediaCoverageId}/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Temporary media coverage image upload endpoint
app.post('/api/media-coverage/temp/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/media/temp/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event image upload endpoint
app.post('/api/events/:eventId/images', upload.single('image'), async (req, res) => {
  try {
    const eventId = sanitizeResourceId(req.params.eventId);
    if (!eventId) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Check if event exists
    const event = await database.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/events/${eventId}/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Temporary event image upload endpoint
app.post('/api/events/temp/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create the image URL
    const imageUrl = `/postimages/events/temp/images/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
};

module.exports = registerContentUploadRoutes;
