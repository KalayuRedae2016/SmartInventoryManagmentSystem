'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('StockTransactions', [
      {
        tenantId: 1,
        warehouseId: 1,
        productId: 1,
        type: 'IN',
        quantity: 100,
        referenceType: 'PURCHASE',
        referenceId: 1,
        performedBy: 1,
        note: 'Initial stock from purchase',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('StockTransactions', null, {});
  }
};
