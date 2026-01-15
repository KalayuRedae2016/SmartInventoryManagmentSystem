'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('SaleReturns', [
      {
        tenantId: 1,
        warehouseId: 1,
        saleId: 1,            // existing Sale ID
        customerId: 1,        // existing Customer ID
        returnNumber: 'SR-0001',
        returnDate: new Date(),
        totalAmount: 150.00,
        refundMethod: 'cash',
        status: 'completed',
        note: 'Damaged item returned',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: 1,
        warehouseId: 1,
        saleId: 2,
        customerId: 2,
        returnNumber: 'SR-0002',
        returnDate: new Date(),
        totalAmount: 75.00,
        refundMethod: 'credit_note',
        status: 'completed',
        note: 'Customer changed mind',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('SaleReturns', null, {});
  }
};
