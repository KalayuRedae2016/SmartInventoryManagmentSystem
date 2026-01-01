# Inventory managment systems

# 1) Creating Model and Migration for the first time
a) Create new table(Ex:User)
# npx sequelize-cli model:generate --name User --attributes name:string,
# it creates a model/user.js and an migration/xxx-createUser.js migration file
or Create Model using manually make sure tablename should be (smaller and plural)
and create miggration using npx sequelize-cli migration:generate --name create-users

b) Run migration
# npx sequelize-cli db:migrate

# 2)  Updating the Model (Adding/Changing Fields) Model and Migration
a) Edit the model with newFields (Ex:adding phoneNumber to user)
   # phoneNumber: {type: DataTypes.STRING,allowNull: true}

b) Create a new migration for this change
# npx sequelize-cli migration:generate --name add-phoneNumber-to-user

c) edit the new generated file:
# // in up()
await queryInterface.addColumn('Users', 'phoneNumber', {
  type: Sequelize.STRING,
  allowNull: true
});
# // in down()
await queryInterface.removeColumn('Users', 'phoneNumber');

d) Run migration
# npx sequelize-cli db:migrate

# 3)  for Mistakes(dev Only)
undo last migrations: npx sequelize-cli db:migrate:undo
undo all migrations: npx sequelize-cli db:migrate:undo:all
edit files and re-run: npx sequelize-cli db:migrate

# P: Database Table and Sequelize Model(user.init()) mismatch
# P: Sequelize queried columns that did not exist
S1: Add missing columns via a Sequelize migration
S2: Remove extra fields from the model if they are not needed.


# Note
1) Model = Defines structure in code (models/)
2) Migration = Applies changes to actual DB (migrations/)
3) Migration files should never be edited once run
4) Always create new migrations for updates
5) Sequelize tracks executed migrations in SequelizeMeta table

# Case A model creation and migration
# 1 create models manually or using cmd for now let's create using manual model creation
      module.exports = (sequelize, DataTypes) => {
        const Product = sequelize.define("Product", {
          name: DataTypes.STRING,
          sku: DataTypes.STRING,
          price: DataTypes.DECIMAL,
        });

        return Product;
      };


# 2 Generate an empty migration files
npx sequelize-cli migration:generate --name create-product-table

# 3 edit migrations file

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Products", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: Sequelize.STRING,
      sku: Sequelize.STRING,
      price: Sequelize.DECIMAL,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Products");
  }
};

# 4 run migrations
npx sequelize-cli db:migrate



# Case B Update model and migration
# 1 Adding columns(update models ) manually
    price: DataTypes.DECIMAL,
    weight: DataTypes.FLOAT,

# 2 Generate an empty migration files
npx sequelize-cli migration:generate --name add-priceandweight-to-product

# 3 edit migrations file
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Products", "price", {
      type: Sequelize.FLOAT,
    });
    await queryInterface.addColumn("Products", "weight", {
      type: Sequelize.FLOAT,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Products", "price");
     await queryInterface.removeColumn("Products", "weight");
  }
};

# 4 run migrations
npx sequelize-cli db:migrate


# Case C Delete model and migration
# 1 remove fields models manually
# 2 Generate an empty migration files
px sequelize-cli migration:generate --name add-weight-to-produc

# 3 edit migrations file
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Products", "weight", {
      type: Sequelize.FLOAT,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Products", "weight");
  }
};

# 4 run migrations
npx sequelize-cli db:migrate



# Creating Multer Instance
<!-- const uploadProfile = createMulterMiddleware(
  "users/profileImages", "user", ["image/jpeg", "image/png"]
).single("profileImage"); // single file from 'profileImage'
router.post("/profile", uploadProfile, controller.updateProfile); -->


<!-- const uploadProductImages = createMulterMiddleware(
  "products/images", "product", ["image/jpeg", "image/png"]
).array("images", 10); // multiple files from 'images', max 10
router.post("/product", uploadProductImages, controller.createProduct); -->


<!-- const uploadProductFiles = createMulterMiddleware(
  "products/files", "product", ["image/jpeg", "image/png", "application/pdf"]
).fields([
  { name: "images", maxCount: 10 },       // multiple images
  { name: "documents", maxCount: 10 }     // multiple documents
]);
router.post("/product", uploadProductFiles, controller.createProduct); -->
