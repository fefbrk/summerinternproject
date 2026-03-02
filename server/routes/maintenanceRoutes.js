const registerMaintenanceRoutes = (app, deps) => {
  const {
    database,
    demoEndpointsEnabled,
    ensureDefaultAdminUser,
  } = deps;

  app.post('/api/clear-all-data', async (req, res) => {
    try {
      if (!demoEndpointsEnabled) {
        return res.status(404).json({ error: 'Endpoint not available' });
      }

      await database.clearAllData();
      await ensureDefaultAdminUser();
      res.json({ message: 'All data cleared successfully' });
    } catch (error) {
      console.error('Error clearing data:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });
};

module.exports = registerMaintenanceRoutes;
