'use strict';
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('Units', [
      { businessId: 1, name: 'Piece', symbol: 'pc', baseUnit: 'Piece', operator: '*', operationValue: 1, description: 'Single item', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'Kilogram', symbol: 'kg', baseUnit: 'Kilogram', operator: '*', operationValue: 1, description: 'Weight in kg', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'Liter', symbol: 'L', baseUnit: 'Liter', operator: '*', operationValue: 1, description: 'Volume in liter', isActive: true, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Units', null, {});
  }
};
