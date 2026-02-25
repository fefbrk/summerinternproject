const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const database = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the public directory
app.use('/postimages', express.static(path.join(__dirname, '../public/postimages')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    
    if (req.params.blogPostId || req.body.blogPostId) {
      const blogPostId = req.params.blogPostId || req.body.blogPostId;
      uploadPath = path.join(__dirname, '../public/postimages/blog', blogPostId, 'images');
    } else if (req.params.pressReleaseId || req.body.pressReleaseId) {
      const pressReleaseId = req.params.pressReleaseId || req.body.pressReleaseId;
      uploadPath = path.join(__dirname, '../public/postimages/press', pressReleaseId, 'images');
    } else if (req.params.mediaCoverageId || req.body.mediaCoverageId) {
      const mediaCoverageId = req.params.mediaCoverageId || req.body.mediaCoverageId;
      uploadPath = path.join(__dirname, '../public/postimages/media', mediaCoverageId, 'images');
    } else if (req.params.eventId || req.body.eventId) {
      const eventId = req.params.eventId || req.body.eventId;
      uploadPath = path.join(__dirname, '../public/postimages/events', eventId, 'images');
    } else if (req.originalUrl.includes('/blog/')) {
      uploadPath = path.join(__dirname, '../public/postimages/blog/temp/images');
    } else if (req.originalUrl.includes('/press-releases/')) {
      uploadPath = path.join(__dirname, '../public/postimages/press/temp/images');
    } else if (req.originalUrl.includes('/media-coverage/')) {
      uploadPath = path.join(__dirname, '../public/postimages/media/temp/images');
    } else if (req.originalUrl.includes('/events/')) {
      uploadPath = path.join(__dirname, '../public/postimages/events/temp/images');
    } else {
      uploadPath = path.join(__dirname, '../public/uploads');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Veritabanını başlat
const initializeDatabase = async () => {
  try {
    await database.connect();
    await database.runSchema();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// API Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await database.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password endpoint
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    const user = await database.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    await database.updateUserPassword(id, newPassword);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Kullanıcılar
app.get('/api/users', async (req, res) => {
  try {
    const users = await database.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    // Check if user already exists
    const existingUser = await database.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = {
      id: uuidv4(),
      email,
      name,
      password,
      isAdmin: 0, // Default olarak normal kullanıcı
      createdAt: new Date().toISOString()
    };
    
    await database.createUser(newUser);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Siparişler
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await database.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { userId, items, totalAmount, shippingAddress, customerName, customerEmail } = req.body;
    
    const newOrder = {
      id: uuidv4(),
      userId,
      items,
      totalAmount,
      status: 'received',
      shippingAddress,
      customerName,
      customerEmail,
      createdAt: new Date().toISOString()
    };
    
    const order = await database.createOrder(newOrder);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await database.updateOrderStatus(id, status);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Kurs kayıtları
app.get('/api/registrations', async (req, res) => {
  try {
    const registrations = await database.getAllRegistrations();
    res.json(registrations);
  } catch (error) {
    console.error('Error getting registrations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/registrations', async (req, res) => {
  try {
    const { userId, courseName, registrationData, customerName, customerEmail, customerPhone, shippingAddress, shippingCity, shippingState, shippingZipCode, billingAddress, billingCity, billingState, billingZipCode } = req.body;
    
    const newRegistration = {
      id: uuidv4(),
      userId,
      courseName,
      registrationData,
      status: 'registered',
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZipCode,
      billingAddress,
      billingCity,
      billingState,
      billingZipCode,
      createdAt: new Date().toISOString()
    };
    
    const registration = await database.createRegistration(newRegistration);
    res.json(registration);
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/registrations/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const registration = await database.updateRegistrationStatus(id, status);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json(registration);
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contact Us Routes
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await database.getAllContacts();
    res.json(contacts);
  } catch (error) {
    console.error('Error getting contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { type, name, email, subject, message } = req.body;
    
    const newContact = {
      id: uuidv4(),
      type,
      name,
      email,
      subject,
      message,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    
    const contact = await database.createContact(newContact);
    res.json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/contacts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const contact = await database.updateContactStatus(id, status);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Silme endpoint'leri
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await database.getUserById(id);
    
    // Admin kullanıcısını silmeyi engelle
    if (user && user.isAdmin) {
      return res.status(403).json({ error: 'Admin user cannot be deleted' });
    }
    
    const result = await database.deleteUser(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await database.deleteOrder(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await database.deleteRegistration(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await database.deleteContact(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blog Posts Routes
app.get('/api/blog', async (req, res) => {
  try {
    const blogPosts = await database.getAllBlogPosts();
    res.json(blogPosts);
  } catch (error) {
    console.error('Error getting blog posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blogPost = await database.getBlogPostById(id);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json(blogPost);
  } catch (error) {
    console.error('Error getting blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/blog', async (req, res) => {
  try {
    const { title, content, excerpt, author, publishDate, status, images } = req.body;
    
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
      images: images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const blogPost = await database.createBlogPost(newBlogPost);
    
    // Move images from temp folder to the blog post folder
    const tempDir = path.join(__dirname, '../public/postimages/blog/temp/images');
    const targetDir = path.join(__dirname, '../public/postimages/blog', String(blogPost.id), 'images');
    
    if (fs.existsSync(tempDir)) {
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Move all files from temp to target directory
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        const tempPath = path.join(tempDir, file);
        const targetPath = path.join(targetDir, file);
        fs.renameSync(tempPath, targetPath);
        
        // Update image URLs in the blog post
        if (blogPost.images && Array.isArray(blogPost.images)) {
          blogPost.images = blogPost.images.map(img => {
            if (img.src && img.src.includes('/postimages/blog/temp/images/')) {
              return {
                ...img,
                src: img.src.replace('/postimages/blog/temp/images/', `/postimages/blog/${String(blogPost.id)}/images/`)
              };
            }
            return img;
          });
        }
      }
      
      // Update the blog post with corrected image URLs
      await database.updateBlogPost(blogPost.id, { images: blogPost.images });
    }
    
    res.json(blogPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, author, publishDate, status, images } = req.body;
    
    const existingPost = await database.getBlogPostById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // If publishDate is not provided or is empty, keep the existing one
    const finalPublishDate = publishDate || existingPost.publishDate;
    
    const updatedBlogPost = {
      title,
      content,
      excerpt,
      author,
      publishDate: finalPublishDate,
      status,
      images: images || [],
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
    const { id } = req.params;
    const { status } = req.body;
    
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
    const { id } = req.params;
    
    const result = await database.deleteBlogPost(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Delete the image directory if it exists
    const imageDir = path.join(__dirname, '../public/postimages/blog', id, 'images');
    if (fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }
    
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
    res.json(pressReleases);
  } catch (error) {
    console.error('Error getting press releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/press-releases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pressRelease = await database.getPressReleaseById(id);
    if (!pressRelease) {
      return res.status(404).json({ error: 'Press release not found' });
    }
    res.json(pressRelease);
  } catch (error) {
    console.error('Error getting press release:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/press-releases', async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      author,
      publishDate,
      status,
      images
    } = req.body;

    const newPressRelease = {
      id: Date.now().toString(),
      title,
      content,
      excerpt,
      author,
      publishDate,
      status: status || 'draft',
      images: images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pressRelease = await database.createPressRelease(newPressRelease);

    // Move images from temp folder to the press release folder
    const tempDir = path.join(__dirname, '../public/postimages/press/temp/images');
    const targetDir = path.join(__dirname, '../public/postimages/press', String(pressRelease.id), 'images');
    
    if (fs.existsSync(tempDir)) {
      // Create target directory
      fs.mkdirSync(targetDir, { recursive: true });
      
      // Move files
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        const sourcePath = path.join(tempDir, file);
        const targetPath = path.join(targetDir, file);
        fs.renameSync(sourcePath, targetPath);
      }
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
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
    const { id } = req.params;
    const { title, content, excerpt, author, publishDate, status, images } = req.body;

    const existingPost = await database.getPressReleaseById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Press release not found' });
    }

    const updatedPressRelease = {
      title,
      content,
      excerpt,
      author,
      publishDate,
      status,
      images: images || [],
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
    const { id } = req.params;
    const { status } = req.body;

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
    const { id } = req.params;

    const result = await database.deletePressRelease(id);
    if (!result) {
      return res.status(404).json({ error: 'Press release not found' });
    }

    // Delete associated images
    const imageDir = path.join(__dirname, '../public/postimages/press', id, 'images');
    if (fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }
    
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
    res.json(mediaCoverages);
  } catch (error) {
    console.error('Error getting media coverages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/media-coverage/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mediaCoverage = await database.getMediaCoverageById(id);
    if (!mediaCoverage) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }
    res.json(mediaCoverage);
  } catch (error) {
    console.error('Error getting media coverage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/media-coverage', async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      author,
      publishDate,
      status,
      images
    } = req.body;

    const newMediaCoverage = {
      id: Date.now().toString(),
      title,
      content,
      excerpt,
      author,
      publishDate,
      status: status || 'draft',
      images: images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mediaCoverage = await database.createMediaCoverage(newMediaCoverage);

    // Move images from temp folder to the media coverage folder
    const tempDir = path.join(__dirname, '../public/postimages/media/temp/images');
    const targetDir = path.join(__dirname, '../public/postimages/media', String(mediaCoverage.id), 'images');
    
    if (fs.existsSync(tempDir)) {
      // Create target directory
      fs.mkdirSync(targetDir, { recursive: true });
      
      // Move files
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        const sourcePath = path.join(tempDir, file);
        const targetPath = path.join(targetDir, file);
        fs.renameSync(sourcePath, targetPath);
      }
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
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
    const { id } = req.params;
    const { title, content, excerpt, author, publishDate, status, images } = req.body;

    const existingPost = await database.getMediaCoverageById(id);
    if (!existingPost) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }

    const updatedMediaCoverage = {
      title,
      content,
      excerpt,
      author,
      publishDate,
      status,
      images: images || [],
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
    const { id } = req.params;
    const { status } = req.body;

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
    const { id } = req.params;

    const result = await database.deleteMediaCoverage(id);
    if (!result) {
      return res.status(404).json({ error: 'Media coverage not found' });
    }

    // Delete associated images
    const imageDir = path.join(__dirname, '../public/postimages/media', id, 'images');
    if (fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }
    
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
    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await database.getEventById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, excerpt, startDate, endDate, venueName, venueAddress, venueCity, venueState, venueZipCode, venueCountry, venueWebsite, googleMapsLink, organizerName, organizerWebsite, eventWebsite, status, category, imageUrl } = req.body;
    
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
    const { id } = req.params;
    const { title, description, excerpt, startDate, endDate, venueName, venueAddress, venueCity, venueState, venueZipCode, venueCountry, venueWebsite, googleMapsLink, organizerName, organizerWebsite, eventWebsite, status, category, imageUrl } = req.body;
    
    const existingEvent = await database.getEventById(id);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
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
    const { id } = req.params;
    const { status } = req.body;
    
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
    const { id } = req.params;
    
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

// Blog image upload endpoint
app.post('/api/blog/:blogPostId/images', upload.single('image'), async (req, res) => {
  try {
    const { blogPostId } = req.params;
    
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
    const { pressReleaseId } = req.params;
    
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
    const { mediaCoverageId } = req.params;
    
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
    const { eventId } = req.params;
    
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

// Demo veri yükleme
app.post('/api/load-demo-data', async (req, res) => {
  try {
    const demoUsers = [
      {
        id: '1',
        email: 'admin@klr.com',
        name: 'Admin User',
        password: 'adminklr',
        isAdmin: 1,
        createdAt: '2024-01-15T10:30:00.000Z'
      },
      {
        id: '2',
        email: 'test@example.com',
        name: 'Test User',
        password: 'test123',
        createdAt: '2024-02-20T14:15:00.000Z'
      },
      {
        id: '3',
        email: 'ahmet.yilmaz@gmail.com',
        name: 'Ahmet Yılmaz',
        password: 'ahmet123',
        createdAt: '2024-03-10T09:45:00.000Z'
      },
      {
        id: '4',
        email: 'fatma.kaya@hotmail.com',
        name: 'Fatma Kaya',
        password: 'fatma123',
        createdAt: '2024-04-05T16:20:00.000Z'
      },
      {
        id: '5',
        email: 'mehmet.demir@yahoo.com',
        name: 'Mehmet Demir',
        password: 'mehmet123',
        createdAt: '2024-05-12T11:10:00.000Z'
      },
      {
        id: '6',
        email: 'ayse.ozkan@gmail.com',
        name: 'Ayşe Özkan',
        password: 'ayse123',
        createdAt: '2024-06-18T08:25:00.000Z'
      },
      {
        id: '7',
        email: 'ali.celik@outlook.com',
        name: 'Ali Çelik',
        password: 'ali123',
        createdAt: '2024-07-22T15:40:00.000Z'
      },
      {
        id: '8',
        email: 'zeynep.arslan@gmail.com',
        name: 'Zeynep Arslan',
        password: 'zeynep123',
        createdAt: '2024-08-14T12:55:00.000Z'
      },
      {
        id: '9',
        email: 'john.smith@gmail.com',
        name: 'John Smith',
        password: 'john123',
        createdAt: '2024-09-03T10:15:00.000Z'
      },
      {
        id: '10',
        email: 'maria.garcia@yahoo.com',
        name: 'Maria Garcia',
        password: 'maria123',
        createdAt: '2024-10-07T14:30:00.000Z'
      }
    ];
    
    const demoOrders = [
      {
        id: '1001',
        userId: '2',
        items: [
          { id: 'kibo-10', name: 'KIBO 10 Kit', quantity: 1, price: 229.95, image: '/assets/shop/kibokits/KIBO-10-package.png' },
          { id: 'marker-set', name: 'Marker Extension Set', quantity: 2, price: 19.95, image: '/assets/shop/funextensionsets/Marker-Extension-Set.png' }
        ],
        totalAmount: 269.85,
        status: 'received',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        shippingAddress: {
          name: 'Test User',
          phone: '+1-555-0123',
          email: 'test@example.com',
          address: '123 Main Street, Apt 4B',
          city: 'New York',
          province: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        createdAt: '2025-01-20T14:30:00.000Z'
      },
      {
        id: '1002',
        userId: '3',
        items: [
          { id: 'kibo-15', name: 'KIBO 15 Kit', quantity: 1, price: 329.95, image: '/assets/shop/kibokits/KIBO-15-package.png' }
        ],
        totalAmount: 329.95,
        status: 'preparing',
        customerName: 'Ahmet Yılmaz',
        customerEmail: 'ahmet.yilmaz@gmail.com',
        shippingAddress: {
          name: 'Ahmet Yılmaz',
          phone: '+90-532-123-4567',
          email: 'ahmet.yilmaz@gmail.com',
          address: 'Atatürk Caddesi No:45 Daire:8',
          city: 'İstanbul',
          province: 'İstanbul',
          zipCode: '34000',
          country: 'Turkey'
        },
        createdAt: '2025-01-22T09:15:00.000Z'
      },
      {
        id: '1003',
        userId: '4',
        items: [
          { id: 'kibo-21', name: 'KIBO 21 Kit', quantity: 1, price: 429.95, image: '/assets/shop/kibokits/KIBO-21-package.png' },
          { id: 'building-brick', name: 'Building Brick Extension Set', quantity: 1, price: 39.95, image: '/assets/shop/funextensionsets/KIBO-buildingbrickb.png' }
        ],
        totalAmount: 469.90,
        status: 'shipping',
        customerName: 'Fatma Kaya',
        customerEmail: 'fatma.kaya@hotmail.com',
        shippingAddress: {
          name: 'Fatma Kaya',
          phone: '+90-505-987-6543',
          email: 'fatma.kaya@hotmail.com',
          address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
          city: 'Ankara',
          province: 'Ankara',
          zipCode: '06000',
          country: 'Turkey'
        },
        createdAt: '2025-01-18T16:45:00.000Z'
      },
      {
        id: '1004',
        userId: '5',
        items: [
          { id: 'kibo-18', name: 'KIBO 18 Kit', quantity: 2, price: 379.95, image: '/assets/shop/kibokits/KIBO-18-package.png' }
        ],
        totalAmount: 759.90,
        status: 'delivered',
        customerName: 'Mehmet Demir',
        customerEmail: 'mehmet.demir@yahoo.com',
        shippingAddress: {
          name: 'Mehmet Demir',
          phone: '+90-542-111-2233',
          email: 'mehmet.demir@yahoo.com',
          address: 'Yeni Mahalle Okul Sokak No:67',
          city: 'İzmir',
          province: 'İzmir',
          zipCode: '35000',
          country: 'Turkey'
        },
        createdAt: '2025-01-15T12:20:00.000Z'
      },
      {
        id: '1005',
        userId: '6',
        items: [
          { id: 'expression-module', name: 'Expression Module', quantity: 1, price: 49.95, image: '/assets/shop/funextensionsets/KIBO-expressionmodule.png' },
          { id: 'sound-record', name: 'Sound & Record Module', quantity: 1, price: 59.95, image: '/assets/shop/funextensionsets/KIBO-sound.png' }
        ],
        totalAmount: 109.90,
        status: 'preparing',
        customerName: 'Ayşe Özkan',
        customerEmail: 'ayse.ozkan@gmail.com',
        shippingAddress: {
          name: 'Ayşe Özkan',
          phone: '+90-533-444-5566',
          email: 'ayse.ozkan@gmail.com',
          address: 'Bahçelievler Mahallesi 12. Cadde No:89',
          city: 'Bursa',
          province: 'Bursa',
          zipCode: '16000',
          country: 'Turkey'
        },
        createdAt: '2025-01-25T10:30:00.000Z'
      },
      {
        id: '1006',
        userId: '7',
        items: [
          { id: 'kibo-12', name: 'KIBO 12 Kit', quantity: 1, price: 279.95, image: '/assets/shop/kibokits/KIBO-12-package.png' },
          { id: 'art-module', name: 'Art Module', quantity: 1, price: 29.95, image: '/assets/shop/funextensionsets/KIBO-artmodule.png' }
        ],
        totalAmount: 309.90,
        status: 'received',
        customerName: 'Ali Çelik',
        customerEmail: 'ali.celik@outlook.com',
        shippingAddress: {
          name: 'Ali Çelik',
          phone: '+90-544-777-8899',
          email: 'ali.celik@outlook.com',
          address: 'Merkez Mahallesi Atatürk Bulvarı No:156',
          city: 'Antalya',
          province: 'Antalya',
          zipCode: '07000',
          country: 'Turkey'
        },
        createdAt: '2025-01-28T08:45:00.000Z'
      },
      {
        id: '1007',
        userId: '8',
        items: [
          { id: 'kibo-21', name: 'KIBO 21 Kit', quantity: 1, price: 429.95, image: '/assets/shop/kibokits/KIBO-21-package.png' }
        ],
        totalAmount: 429.95,
        status: 'shipping',
        customerName: 'Zeynep Arslan',
        customerEmail: 'zeynep.arslan@gmail.com',
        shippingAddress: {
          name: 'Zeynep Arslan',
          phone: '+90-555-123-9876',
          email: 'zeynep.arslan@gmail.com',
          address: 'Çankaya Mahallesi Tunalı Hilmi Caddesi No:78',
          city: 'Ankara',
          province: 'Ankara',
          zipCode: '06700',
          country: 'Turkey'
        },
        createdAt: '2025-01-26T13:20:00.000Z'
      },
      {
        id: '1008',
        userId: '9',
        items: [
          { id: 'kibo-15', name: 'KIBO 15 Kit', quantity: 1, price: 329.95, image: '/assets/shop/kibokits/KIBO-15-package.png' },
          { id: 'light-module', name: 'Light Module', quantity: 2, price: 24.95, image: '/assets/shop/funextensionsets/KIBO-lightmodule.png' }
        ],
        totalAmount: 379.85,
        status: 'delivered',
        customerName: 'John Smith',
        customerEmail: 'john.smith@gmail.com',
        shippingAddress: {
          name: 'John Smith',
          phone: '+1-555-987-6543',
          email: 'john.smith@gmail.com',
          address: '456 Oak Avenue, Suite 12',
          city: 'Los Angeles',
          province: 'CA',
          zipCode: '90210',
          country: 'United States'
        },
        createdAt: '2025-01-12T11:15:00.000Z'
      },
      {
        id: '1009',
        userId: '10',
        items: [
          { id: 'kibo-18', name: 'KIBO 18 Kit', quantity: 1, price: 379.95, image: '/assets/shop/kibokits/KIBO-18-package.png' },
          { id: 'sensor-module', name: 'Sensor Module', quantity: 1, price: 34.95, image: '/assets/shop/funextensionsets/KIBO-sensormodule.png' }
        ],
        totalAmount: 414.90,
        status: 'preparing',
        customerName: 'Maria Garcia',
        customerEmail: 'maria.garcia@yahoo.com',
        shippingAddress: {
          name: 'Maria Garcia',
          phone: '+1-555-246-8135',
          email: 'maria.garcia@yahoo.com',
          address: '789 Pine Street, Apt 5C',
          city: 'Miami',
          province: 'FL',
          zipCode: '33101',
          country: 'United States'
        },
        createdAt: '2025-01-29T16:40:00.000Z'
      }
    ];
    
    const demoRegistrations = [
      {
        id: '2001',
        userId: '3',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            address: 'Atatürk Caddesi No:45 Daire:8',
            city: 'İstanbul',
            state: 'İstanbul',
            zipCode: '34000',
            phone: '+90-532-123-4567',
            email: 'ahmet.yilmaz@gmail.com'
          },
          billingInfo: {
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            address: 'Atatürk Caddesi No:45 Daire:8',
            city: 'İstanbul',
            state: 'İstanbul',
            zipCode: '34000',
            phone: '+90-532-123-4567',
            email: 'ahmet.yilmaz@gmail.com'
          }
        },
        status: 'registered',
        customerName: 'Ahmet Yılmaz',
        customerEmail: 'ahmet.yilmaz@gmail.com',
        customerPhone: '+90-532-123-4567',
        shippingAddress: 'Atatürk Caddesi No:45 Daire:8',
        shippingCity: 'İstanbul',
        shippingState: 'İstanbul',
        shippingZipCode: '34000',
        billingAddress: 'Atatürk Caddesi No:45 Daire:8',
        billingCity: 'İstanbul',
        billingState: 'İstanbul',
        billingZipCode: '34000',
        createdAt: '2025-01-21T13:45:00.000Z'
      },
      {
        id: '2002',
        userId: '4',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Fatma',
            lastName: 'Kaya',
            address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
            city: 'Ankara',
            state: 'Ankara',
            zipCode: '06000',
            phone: '+90-505-987-6543',
            email: 'fatma.kaya@hotmail.com'
          },
          billingInfo: {
            firstName: 'Fatma',
            lastName: 'Kaya',
            address: 'Cumhuriyet Mahallesi 15. Sokak No:23',
            city: 'Ankara',
            state: 'Ankara',
            zipCode: '06000',
            phone: '+90-505-987-6543',
            email: 'fatma.kaya@hotmail.com'
          }
        },
        status: 'active',
        customerName: 'Fatma Kaya',
        customerEmail: 'fatma.kaya@hotmail.com',
        customerPhone: '+90-505-987-6543',
        shippingAddress: 'Cumhuriyet Mahallesi 15. Sokak No:23',
        shippingCity: 'Ankara',
        shippingState: 'Ankara',
        shippingZipCode: '06000',
        billingAddress: 'Cumhuriyet Mahallesi 15. Sokak No:23',
        billingCity: 'Ankara',
        billingState: 'Ankara',
        billingZipCode: '06000',
        createdAt: '2025-01-19T11:20:00.000Z'
      },
      {
        id: '2003',
        userId: '5',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Mehmet',
            lastName: 'Demir',
            address: 'Yeni Mahalle Okul Sokak No:67',
            city: 'İzmir',
            state: 'İzmir',
            zipCode: '35000',
            phone: '+90-542-111-2233',
            email: 'mehmet.demir@yahoo.com'
          },
          billingInfo: {
            firstName: 'Mehmet',
            lastName: 'Demir',
            address: 'Yeni Mahalle Okul Sokak No:67',
            city: 'İzmir',
            state: 'İzmir',
            zipCode: '35000',
            phone: '+90-542-111-2233',
            email: 'mehmet.demir@yahoo.com'
          }
        },
        status: 'completed',
        customerName: 'Mehmet Demir',
        customerEmail: 'mehmet.demir@yahoo.com',
        customerPhone: '+90-542-111-2233',
        shippingAddress: 'Yeni Mahalle Okul Sokak No:67',
        shippingCity: 'İzmir',
        shippingState: 'İzmir',
        shippingZipCode: '35000',
        billingAddress: 'Yeni Mahalle Okul Sokak No:67',
        billingCity: 'İzmir',
        billingState: 'İzmir',
        billingZipCode: '35000',
        createdAt: '2025-01-16T15:10:00.000Z'
      },
      {
        id: '2004',
        userId: '6',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'Ayşe',
            lastName: 'Özkan',
            address: 'Bahçelievler Mahallesi 12. Cadde No:89',
            city: 'Bursa',
            state: 'Bursa',
            zipCode: '16000',
            phone: '+90-533-444-5566',
            email: 'ayse.ozkan@gmail.com'
          },
          billingInfo: {
            firstName: 'Ayşe',
            lastName: 'Özkan',
            address: 'Bahçelievler Mahallesi 12. Cadde No:89',
            city: 'Bursa',
            state: 'Bursa',
            zipCode: '16000',
            phone: '+90-533-444-5566',
            email: 'ayse.ozkan@gmail.com'
          }
        },
        status: 'active',
        customerName: 'Ayşe Özkan',
        customerEmail: 'ayse.ozkan@gmail.com',
        customerPhone: '+90-533-444-5566',
        shippingAddress: 'Bahçelievler Mahallesi 12. Cadde No:89',
        shippingCity: 'Bursa',
        shippingState: 'Bursa',
        shippingZipCode: '16000',
        billingAddress: 'Bahçelievler Mahallesi 12. Cadde No:89',
        billingCity: 'Bursa',
        billingState: 'Bursa',
        billingZipCode: '16000',
        createdAt: '2025-01-23T08:30:00.000Z'
      },
      {
        id: '2005',
        userId: '9',
        courseName: 'KIBO Home Robotics Course',
        registrationData: {
          shippingInfo: {
            firstName: 'John',
            lastName: 'Smith',
            address: '456 Oak Avenue, Suite 12',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            phone: '+1-555-987-6543',
            email: 'john.smith@gmail.com'
          },
          billingInfo: {
            firstName: 'John',
            lastName: 'Smith',
            address: '456 Oak Avenue, Suite 12',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            phone: '+1-555-987-6543',
            email: 'john.smith@gmail.com'
          }
        },
        status: 'registered',
        customerName: 'John Smith',
        customerEmail: 'john.smith@gmail.com',
        customerPhone: '+1-555-987-6543',
        shippingAddress: '456 Oak Avenue, Suite 12',
        shippingCity: 'Los Angeles',
        shippingState: 'CA',
        shippingZipCode: '90210',
        billingAddress: '456 Oak Avenue, Suite 12',
        billingCity: 'Los Angeles',
        billingState: 'CA',
        billingZipCode: '90210',
        createdAt: '2025-01-27T14:25:00.000Z'
      }
    ];
    
    // Demo Contact Us verileri
    const demoContacts = [
      {
        id: '3001',
        type: 'general',
        name: 'Mehmet Demir',
        email: 'mehmet.demir@gmail.com',
        subject: 'KIBO Robotik Kiti Hakkında',
        message: 'Merhaba, KIBO 18 kiti hakkında daha fazla bilgi almak istiyorum. Fiyat ve teslimat süresi nedir?',
        status: 'new',
        createdAt: '2024-03-15T11:20:00.000Z'
      },
      {
        id: '3002',
        type: 'support',
        name: 'Ayşe Kaya',
        email: 'ayse.kaya@hotmail.com',
        subject: 'Teknik Destek Talebi',
        message: 'KIBO robotumun sensörleri düzgün çalışmıyor. Nasıl tamir edebilirim?',
        status: 'answered',
        createdAt: '2024-03-18T14:30:00.000Z'
      },
      {
        id: '3003',
        type: 'training',
        name: 'Mustafa Yıldız',
        email: 'mustafa.yildiz@gmail.com',
        subject: 'Eğitim Programları',
        message: 'Öğretmenler için KIBO eğitim programlarınız var mı? Okulumuzda kullanmak istiyoruz.',
        status: 'reviewing',
        createdAt: '2024-03-20T09:45:00.000Z'
      },
      {
        id: '3004',
        type: 'sales',
        name: 'Elif Şahin',
        email: 'elif.sahin@gmail.com',
        subject: 'Toplu Satış Talebi',
        message: 'Okulumuz için 20 adet KIBO 15 kit almak istiyoruz. Toplu alımda indirim var mı?',
        status: 'reviewing',
        createdAt: '2024-11-12T10:15:00.000Z'
      },
      {
        id: '3005',
        type: 'general',
        name: 'Can Özdemir',
        email: 'can.ozdemir@hotmail.com',
        subject: 'Ürün Karşılaştırması',
        message: 'KIBO 15 ile KIBO 18 arasındaki farklar nelerdir? Hangi yaş grubu için daha uygun?',
        status: 'answered',
        createdAt: '2024-12-05T16:30:00.000Z'
      },
      {
        id: '3006',
        type: 'support',
        name: 'Selin Yılmaz',
        email: 'selin.yilmaz@yahoo.com',
        subject: 'Kurulum Sorunu',
        message: 'KIBO yazılımını bilgisayarıma kuramıyorum. Yardım edebilir misiniz?',
        status: 'new',
        createdAt: '2025-01-08T13:45:00.000Z'
      },
      {
        id: '3007',
        type: 'training',
        name: 'Emre Kılıç',
        email: 'emre.kilic@gmail.com',
        subject: 'Öğretmen Eğitimi',
        message: 'KIBO kullanımı konusunda öğretmenlerimize eğitim verebilir misiniz? Ankara\'da bulunuyoruz.',
        status: 'reviewing',
        createdAt: '2025-01-15T09:20:00.000Z'
      },
      {
        id: '3008',
        type: 'general',
        name: 'Deniz Acar',
        email: 'deniz.acar@outlook.com',
        subject: 'Garanti Süresi',
        message: 'KIBO robotlarının garanti süresi ne kadar? Garanti kapsamında neler var?',
        status: 'answered',
        createdAt: '2025-01-20T11:10:00.000Z'
      },
      {
        id: '3009',
        type: 'sales',
        name: 'Burak Tekin',
        email: 'burak.tekin@gmail.com',
        subject: 'Bayi Başvurusu',
        message: 'KIBO ürünlerinin bayisi olmak istiyorum. Başvuru süreci nasıl işliyor?',
        status: 'reviewing',
        createdAt: '2025-01-25T14:55:00.000Z'
      },
      {
        id: '3010',
        type: 'support',
        name: 'Gizem Polat',
        email: 'gizem.polat@hotmail.com',
        subject: 'Yedek Parça Talebi',
        message: 'KIBO robotumun motor parçası bozuldu. Yedek parça temin edebilir miyim?',
        status: 'closed',
        createdAt: '2025-01-28T08:40:00.000Z'
      },
      {
        id: '3011',
        type: 'general',
        name: 'Oğuz Çetin',
        email: 'oguz.cetin@yahoo.com',
        subject: 'Kargo Süresi',
        message: 'Sipariş verdiğim KIBO kit ne zaman elime ulaşır? Kargo takip numarası var mı?',
        status: 'new',
        createdAt: '2025-01-30T12:25:00.000Z'
      },
      {
        id: '3012',
        type: 'training',
        name: 'Pınar Doğan',
        email: 'pinar.dogan@gmail.com',
        subject: 'Online Eğitim',
        message: 'KIBO kullanımı için online eğitim videoları var mı? Türkçe kaynak arıyorum.',
        status: 'answered',
        createdAt: '2025-01-31T15:50:00.000Z'
      }
    ];
    
    // Demo Blog Posts verileri
    const demoBlogPosts = [
      {
        id: '4001',
        title: 'KIBO ile Robotik Eğitimde Yeni Bir Dönem',
        content: 'KIBO robotik setleri, çocukların kodlama ve robotik öğrenirken aynı zamanda yaratıcılıklarını geliştirmelerini sağlar. Bu blog yazısında, KIBO\'nun eğitimdeki önemini ve nasıl kullanıldığını detaylı olarak inceliyoruz.\n\nKIBO, çocukların ekran olmadan kodlama öğrenmelerini sağlayan benzersiz bir robotik eğitim setidir. Çocuklar, ahşap blokları kullanarak robotun hareketlerini programlar ve bu sayede algoritmik düşünme becerilerini geliştirirler.\n\nEğitimciler için KIBO, STEM eğitiminde önemli bir araçtır. Öğrenciler problem çözme, işbirliği ve yaratıcılık becerilerini geliştirirken aynı zamanda eğlenirler.',
        excerpt: 'KIBO robotik setleri ile çocukların kodlama ve robotik öğrenirken yaratıcılıklarını nasıl geliştirebileceklerini keşfedin.',
        author: 'Dr. Ayşe Yılmaz',
        publishDate: '2025-01-15T10:00:00.000Z',
        status: 'published',
        createdAt: '2025-01-10T09:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z'
      },
      {
        id: '4002',
        title: 'STEM Eğitiminde KIBO\'nun Rolü',
        content: 'STEM (Science, Technology, Engineering, Mathematics) eğitimi, 21. yüzyıl becerilerinin temelini oluşturur. KIBO, bu alanlarda çocukların ilgisini çekmek için tasarlanmış mükemmel bir araçtır.\n\nBu yazıda, KIBO\'nun STEM eğitimindeki rolünü ve öğrencilerin bu alanlardaki gelişimine nasıl katkı sağladığını ele alacağız.\n\nKIBO ile öğrenciler:\n- Matematiksel düşünme becerilerini geliştirir\n- Mühendislik tasarım sürecini öğrenir\n- Bilimsel merakı artırır\n- Teknolojiyi anlamlı bir şekilde kullanır\n\nÖğretmenler için KIBO, STEM derslerini daha etkileşimli ve eğlenceli hale getirir.',
        excerpt: 'KIBO\'nun STEM eğitimindeki önemini ve öğrencilerin bu alanlardaki gelişimine nasıl katkı sağladığını öğrenin.',
        author: 'Prof. Mehmet Demir',
        publishDate: '2025-01-20T14:30:00.000Z',
        status: 'published',
        createdAt: '2025-01-18T11:00:00.000Z',
        updatedAt: '2025-01-20T14:30:00.000Z'
      },
      {
        id: '4003',
        title: 'Erken Çocuklukta Kodlama Eğitimi',
        content: 'Erken çocukluk dönemi, çocukların öğrenme ve gelişiminde kritik bir öneme sahiptir. Bu dönemde kazanılan beceriler, çocuğun gelecekteki akademik ve sosyal başarısını etkiler.\n\nKodlama eğitimi, erken çocukluk döneminde şu becerileri geliştirir:\n\n1. Problem Çözme: Çocuklar, problemleri parçalara ayırmayı ve çözüm yolları bulmayı öğrenirler.\n2. Mantıksal Düşünme: Kodlama, mantıksal sıralama ve neden-sonuç ilişkisi kurmayı gerektirir.\n3. Yaratıcılık: Çocuklar, kendi projelerini yaratırken yaratıcılıklarını kullanırlar.\n4. İşbirliği: Grup çalışmalarıyla birlikte çalışma becerisi gelişir.\n\nKIBO, bu becerileri geliştirmek için tasarlanmış yaşa uygun bir robotik eğitim setidir.',
        excerpt: 'Erken çocukluk döneminde kodlama eğitiminin önemini ve KIBO\'nun bu süreçteki rolünü keşfedin.',
        author: 'Dr. Zeynep Arslan',
        publishDate: '2025-01-25T09:15:00.000Z',
        status: 'published',
        createdAt: '2025-01-22T08:00:00.000Z',
        updatedAt: '2025-01-25T09:15:00.000Z'
      },
      {
        id: '4004',
        title: 'KIBO ile Sınıf İçi Etkinlikler',
        content: 'KIBO robotik setleri, sınıf içinde birçok farklı etkinlik için kullanılabilir. Bu yazıda, öğretmenlerin sınıflarında uygulayabileceği pratik KIBO etkinliklerini paylaşacağız.\n\n1. Hikaye Anlatma: Öğrenciler, KIBO\'yu kullanarak kendi hikayelerini canlandırabilirler.\n2. Matematik Oyunları: KIBO ile şekil oluşturma, sayma ve ölçme etkinlikleri yapılabilir.\n3. Sanat Projesi: KIBO\'yu sanat eserleri oluşturmak için kullanmak.\n4. Fen Deneyleri: KIBO ile basit fen deneyleri yapmak.\n\nBu etkinlikler, öğrencilerin hem eğlenmesini hem de öğrenmesini sağlar. Öğretmenler, KIBO\'yu farklı derslerde entegre ederek öğrenmeyi daha etkileyici hale getirebilirler.',
        excerpt: 'Sınıfınızda KIBO ile uygulayabileceğiniz yaratıcı ve eğitici etkinlikleri keşfedin.',
        author: 'Öğr. Fatma Kaya',
        publishDate: '2025-02-01T11:45:00.000Z',
        status: 'draft',
        createdAt: '2025-01-28T13:00:00.000Z',
        updatedAt: '2025-02-01T11:45:00.000Z'
      },
      {
        id: '4005',
        title: 'Ebeveynler İçin KIBO Rehberi',
        content: 'Ebeveynler olarak, çocuklarınızın teknolojiyle sağlıklı bir ilişki kurmasını istersiniz. KIBO, çocuklarınıza teknolojiyi anlamlı bir şekilde kullanmayı öğreten harika bir araçtır.\n\nBu rehberde, ebeveynlerin KIBO\'yu evde nasıl kullanabileceğini ve çocuklarının gelişimine nasıl katkı sağlayacağını anlatacağız.\n\nKIBO ile Evde Eğitim:\n- Aile birlikte projeler yapabilir\n- Çocuğunuzun yaratıcılığını destekleyebilirsiniz\n- Ekran süresini azaltırken kaliteli zaman geçirebilirsiniz\n- Çocuğunuzun problem çözme becerilerini geliştirebilirsiniz\n\nKIBO, çocuklarınıza kodlama ve robotiği sevdirmek için harika bir başlangıç noktasıdır.',
        excerpt: 'Ebeveynler için KIBO rehberi: Çocuğunuzun teknolojiyle sağlıklı ilişki kurmasına yardımcı olun.',
        author: 'Dr. Ali Çelik',
        publishDate: '2025-02-05T16:20:00.000Z',
        status: 'draft',
        createdAt: '2025-02-02T10:00:00.000Z',
        updatedAt: '2025-02-05T16:20:00.000Z'
      }
    ];
    
    // Önce veritabanını temizle (bu işlem zaten admin kullanıcısını oluşturur)
    await database.clearAllData();
    
    // Demo verilerini ekle (admin kullanıcısı hariç)
    for (const user of demoUsers) {
      if (user.email !== 'admin@klr.com') {
        await database.createUser(user);
      }
    }
    
    for (const order of demoOrders) {
      await database.createOrder(order);
    }
    
    for (const registration of demoRegistrations) {
      await database.createRegistration(registration);
    }
    
    for (const contact of demoContacts) {
      await database.createContact(contact);
    }
    
    for (const blogPost of demoBlogPosts) {
      await database.createBlogPost(blogPost);
    }
    
    res.json({ message: 'Demo data loaded successfully' });
  } catch (error) {
    console.error('Error loading demo data:', error);
    res.status(500).json({ error: 'Failed to load demo data' });
  }
});

// User Addresses API
app.get('/api/addresses/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const addresses = await database.getUserAddresses(userId);
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

app.post('/api/addresses', async (req, res) => {
  try {
    const { userId, title, type, address, apartment, district, city, postalCode, province, country, isDefault } = req.body;
    
    const newAddress = {
      id: uuidv4(),
      userId,
      title,
      type,
      isDefault: isDefault ? 1 : 0,
      address,
      apartment,
      district,
      city,
      postalCode,
      province,
      country: country || 'Turkey',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await database.createUserAddress(newAddress);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

app.put('/api/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, address, apartment, district, city, postalCode, province, country, isDefault } = req.body;
    
    const updatedAddress = {
      title,
      type,
      isDefault: isDefault ? 1 : 0,
      address,
      apartment,
      district,
      city,
      postalCode,
      province,
      country: country || 'Turkey',
      updatedAt: new Date().toISOString()
    };

    const result = await database.updateUserAddress(id, updatedAddress);
    res.json(result);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

app.delete('/api/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await database.deleteUserAddress(id);
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// User Payment Methods API
app.get('/api/payment-methods/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const paymentMethods = await database.getUserPaymentMethods(userId);
    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

app.post('/api/payment-methods', async (req, res) => {
  try {
    const { userId, cardTitle, cardNumber, expiryMonth, expiryYear, holderName, isDefault } = req.body;
    
    // Kart tipini belirle
    const getCardType = (cardNumber) => {
      const firstDigit = cardNumber.charAt(0);
      if (firstDigit === '4') return 'visa';
      if (firstDigit === '5') return 'mastercard';
      if (firstDigit === '3') return 'amex';
      return 'unknown';
    };

    const newPaymentMethod = {
      id: uuidv4(),
      userId,
      cardTitle,
      cardLastFour: cardNumber.slice(-4),
      cardType: getCardType(cardNumber),
      expiryMonth,
      expiryYear,
      holderName,
      isDefault: isDefault ? 1 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await database.createUserPaymentMethod(newPaymentMethod);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({ error: 'Failed to create payment method' });
  }
});

app.put('/api/payment-methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cardTitle, cardNumber, expiryMonth, expiryYear, holderName, isDefault } = req.body;
    
    const getCardType = (cardNumber) => {
      const firstDigit = cardNumber.charAt(0);
      if (firstDigit === '4') return 'visa';
      if (firstDigit === '5') return 'mastercard';
      if (firstDigit === '3') return 'amex';
      return 'unknown';
    };

    const updatedPaymentMethod = {
      cardTitle,
      cardLastFour: cardNumber ? cardNumber.slice(-4) : undefined,
      cardType: cardNumber ? getCardType(cardNumber) : undefined,
      expiryMonth,
      expiryYear,
      holderName,
      isDefault: isDefault ? 1 : 0,
      updatedAt: new Date().toISOString()
    };

    // Undefined değerleri temizle
    Object.keys(updatedPaymentMethod).forEach(key => {
      if (updatedPaymentMethod[key] === undefined) {
        delete updatedPaymentMethod[key];
      }
    });

    const result = await database.updateUserPaymentMethod(id, updatedPaymentMethod);
    res.json(result);
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

app.delete('/api/payment-methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await database.deleteUserPaymentMethod(id);
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Tüm verileri temizle
app.post('/api/clear-all-data', async (req, res) => {
  try {
    await database.clearAllData();
    res.json({ message: 'All data cleared successfully' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// Server başlat
app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`SQLite database location: ${database.getDatabasePath()}`);
});