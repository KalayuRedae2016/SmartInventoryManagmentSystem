'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Permissions', [
      { businessId: 1, name: 'Create Product', key: 'product:create', module: 'product', createdAt: new Date(), updatedAt: new Date() },
      { businessId: 1, name: 'View Product', key: 'product:view', module: 'product', createdAt: new Date(), updatedAt: new Date() },
      { businessId: 1, name: 'Add Stock', key: 'stock:add', module: 'stock', createdAt: new Date(), updatedAt: new Date() },
      { businessId: 1, name: 'View Reports', key: 'report:view', module: 'report', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface) { await queryInterface.bulkDelete('Permissions', null, {}); }
};