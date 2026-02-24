'use strict';

module.exports = {
  async up(queryInterface) {
    const [businesses] = await queryInterface.sequelize.query(
      'SELECT id FROM Businesses ORDER BY id ASC LIMIT 1;'
    );
    if (!businesses || businesses.length === 0) {
      throw new Error('No business found. Seed Businesses first.');
    }
    const businessId = businesses[0].id;

    const [existingRows] = await queryInterface.sequelize.query(
      `SELECT code FROM Warehouses WHERE businessId = ${Number(businessId)};`
    );
    const existingCodes = new Set((existingRows || []).map(row => row.code));

    const now = new Date();
    const rows = [
      {
        businessId,
        name: 'Main Warehouse',
        code: 'MAIN',
        location: 'Addis Ababa',
        managerName: 'Abel Tesfaye',
        phone: '+251911111111',
        email: 'main@demoims.com',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        businessId,
        name: 'Secondary Warehouse',
        code: 'SEC',
        location: 'Adama',
        managerName: 'Sara Kebede',
        phone: '+251922222222',
        email: 'secondary@demoims.com',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ].filter(row => !existingCodes.has(row.code));

    if (rows.length) {
      await queryInterface.bulkInsert('Warehouses', rows);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Warehouses', null, {});
  }
};
