const createBootstrapService = ({
  database,
  hashPassword,
  isHashedPassword,
  uuidv4,
  adminEmail,
  getDefaultAdminPassword,
  legacyDefaultAdminEmail,
}) => {
  const ensureDefaultAdminUser = async () => {
    const existingAdmin = await database.getUserByEmail(adminEmail);
    if (existingAdmin) {
      return;
    }

    const adminPassword = getDefaultAdminPassword();
    await database.createUser({
      id: uuidv4(),
      email: adminEmail,
      name: 'Admin User',
      password: hashPassword(adminPassword),
      isAdmin: 1,
      createdAt: new Date().toISOString(),
    });

    console.log(`Default admin user created for ${adminEmail}`);
  };

  const migrateLegacyPasswords = async () => {
    const users = await database.getAllUsersWithPasswords();

    for (const user of users) {
      if (!isHashedPassword(user.password)) {
        await database.updateUserPassword(user.id, hashPassword(user.password));
      }
    }
  };

  const removeLegacyDefaultAdminUser = async () => {
    if (adminEmail === legacyDefaultAdminEmail) {
      return;
    }

    const legacyAdmin = await database.getUserByEmail(legacyDefaultAdminEmail);
    if (!legacyAdmin) {
      return;
    }

    const currentAdmin = await database.getUserByEmail(adminEmail);
    if (!currentAdmin || currentAdmin.id === legacyAdmin.id) {
      return;
    }

    await database.run('UPDATE orders SET user_id = ? WHERE user_id = ?', [currentAdmin.id, legacyAdmin.id]);
    await database.run('UPDATE course_registrations SET user_id = ? WHERE user_id = ?', [currentAdmin.id, legacyAdmin.id]);
    await database.run('UPDATE user_addresses SET user_id = ? WHERE user_id = ?', [currentAdmin.id, legacyAdmin.id]);
    await database.run('UPDATE user_payment_methods SET user_id = ? WHERE user_id = ?', [currentAdmin.id, legacyAdmin.id]);
    await database.deleteUser(legacyAdmin.id);

    console.log('Legacy default admin account removed');
  };

  const initializeDatabase = async () => {
    try {
      await database.connect();
      await database.runSchema();
      await migrateLegacyPasswords();
      await ensureDefaultAdminUser();
      await removeLegacyDefaultAdminUser();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  };

  return {
    ensureDefaultAdminUser,
    initializeDatabase,
  };
};

module.exports = createBootstrapService;
