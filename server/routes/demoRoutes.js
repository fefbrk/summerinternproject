const crypto = require('crypto');
const demoData = require('../fixtures/demo-data.json');

const registerDemoRoutes = (app, deps) => {
  const {
    database,
    hashPassword,
    ensureDefaultAdminUser,
    demoEndpointsEnabled,
    adminEmail,
  } = deps;

  // Demo veri yükleme
  app.post('/api/load-demo-data', async (req, res) => {
    try {
      if (!demoEndpointsEnabled) {
        return res.status(404).json({ error: 'Endpoint not available' });
      }

      const demoPassword = () => crypto.randomBytes(12).toString('base64url');

      // Build users with dynamic passwords and admin email
      const demoUsers = demoData.users.map((user) => ({
        ...user,
        email: user.isAdmin ? adminEmail : user.email,
        password: demoPassword(),
      }));

      // Önce veritabanını temizle (bu işlem zaten admin kullanıcısını oluşturur)
      await database.clearAllData();

      const safeDemoUsers = demoUsers.map((user) => ({
        ...user,
        password: hashPassword(String(user.password || crypto.randomBytes(12).toString('base64url')))
      }));

      // Demo verilerini ekle (admin kullanıcısı hariç)
      for (const user of safeDemoUsers) {
        if (!user.isAdmin) {
          await database.createUser(user);
        }
      }

      await ensureDefaultAdminUser();

      for (const order of demoData.orders) {
        await database.createOrder(order);
      }

      for (const registration of demoData.registrations) {
        await database.createRegistration(registration);
      }

      for (const contact of demoData.contacts) {
        await database.createContact(contact);
      }

      for (const blogPost of demoData.blogPosts) {
        await database.createBlogPost(blogPost);
      }

      res.json({ message: 'Demo data loaded successfully' });
    } catch (error) {
      console.error('Error loading demo data:', error);
      res.status(500).json({ error: 'Failed to load demo data' });
    }
  });
};

module.exports = registerDemoRoutes;
