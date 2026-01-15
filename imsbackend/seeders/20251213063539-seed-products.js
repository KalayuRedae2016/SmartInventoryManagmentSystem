'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Products', [
      {
        tenantId: 1,
        name: 'Sample Product 1',
        sku: 'PROD001',
        partNumber: 'PN001',
        serialTracking: false,
        categoryId: 1,
        brandId: 1,
        unitId: 1,
        defaultCostPrice: 50,
        defaultSellingPrice: 100,
        lastPurchaseCost: 50,
        minimumStock: 5,
        preferredCostMethod: 'FIFO',
        barcode: '123456789012',
        images: JSON.stringify(['img1.jpg']),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: 1,
        name: 'Sample Product 2',
        sku: 'PROD002',
        partNumber: 'PN002',
        serialTracking: true,
        categoryId: 1,
        brandId: 1,
        unitId: 1,
        defaultCostPrice: 30,
        defaultSellingPrice: 60,
        lastPurchaseCost: 30,
        minimumStock: 10,
        preferredCostMethod: 'AVERAGE',
        barcode: '987654321098',
        images: JSON.stringify(['img2.jpg']),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Products', null, {});
  }
};
