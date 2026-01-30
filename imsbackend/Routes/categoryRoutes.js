const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const categoryController=require("../controllers/categoryController")

app.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


// Protect all routes after this middleware
// router.use(authoController.authenticationJwt);

// router.use(authoController.requiredRole('admin',"staff"));

router.route('/')
      .post(categoryController.createCategory)
      .get(categoryController.getAllCategories)
      .delete(categoryController.deleteAllCategories)
  

router.route('/:categoryId')
  .get(categoryController.getCategoryById)
  .patch(categoryController.updateCategoryById)
  .delete(categoryController.deleteCategoryById);


module.exports=router