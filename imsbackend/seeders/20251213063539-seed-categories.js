'use strict';
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('Categories', [
      { businessId: 1, name: 'Electronics', description: 'Electronic devices and gadgets', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'Furniture', description: 'Office and home furniture', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'Stationery', description: 'Office stationery items', isActive: true, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
