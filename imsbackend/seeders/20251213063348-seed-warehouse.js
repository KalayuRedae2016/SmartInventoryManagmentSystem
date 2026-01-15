'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Warehouses', [
      {
        businessId: 1,
        name: 'Main Warehouse',
        code: 'MAIN',
        location: 'Addis Ababa',
        managerName: 'Abel Tesfaye',
        phone: '+251911111111',
        email: 'main@demoims.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        businessId: 1,
        name: 'Secondary Warehouse',
        code: 'SEC',
        location: 'Adama',
        managerName: 'Sara Kebede',
        phone: '+251922222222',
        email: 'secondary@demoims.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Warehouses', null, {});
  }
};
