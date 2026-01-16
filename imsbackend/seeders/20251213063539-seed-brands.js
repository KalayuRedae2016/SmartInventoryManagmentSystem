'use strict';
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('Brands', [
      { businessId: 1, name: 'Apple', country: 'USA', description: 'Electronics brand', image: '', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'Samsung', country: 'South Korea', description: 'Electronics brand', image: '', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'IKEA', country: 'Sweden', description: 'Furniture brand', image: '', isActive: true, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Brands', null, {});
  }
};
