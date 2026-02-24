'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'permissionAdds', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    });

    await queryInterface.addColumn('Users', 'permissionRemoves', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'permissionAdds');
    await queryInterface.removeColumn('Users', 'permissionRemoves');
  }
};

