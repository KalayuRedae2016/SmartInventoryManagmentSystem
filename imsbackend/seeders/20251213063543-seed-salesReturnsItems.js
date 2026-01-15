'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('SaleReturnItems', [
      {
        saleReturnId: 1,     // linked to SR-0001
        tenantId: 1,
        warehouseId: 1,
        productId: 1,        // existing Product ID
        quantity: 2,
        unitPrice: 50.00,
        total: 100.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        saleReturnId: 1,     // SR-0001
        tenantId: 1,
        warehouseId: 1,
        productId: 2,
        quantity: 1,
        unitPrice: 50.00,
        total: 50.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        saleReturnId: 2,     // SR-0002
        tenantId: 1,
        warehouseId: 1,
        productId: 3,
        quantity: 1,
        unitPrice: 75.00,
        total: 75.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('SaleReturnItems', null, {});
  }
};
