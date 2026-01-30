const express=require("express")
const app = express();
const router=express.Router();
const authoController=require("../controllers/authoController")
const unitController=require("../controllers/unitController")

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
      .post(unitController.createUnit)
      .get(unitController.getAllUnits)
      .delete(unitController.deleteAllUnits);
  
router.route('/:unitId')
  .get(unitController.getUnit)
  .patch(unitController.updateUnit)
  .delete(unitController.deleteUnit);


module.exports=router