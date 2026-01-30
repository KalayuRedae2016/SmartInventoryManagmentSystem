const express=require("express")
const app = express();
const router=express.Router()

const authoController=require("../controllers/authoController")
const roleController=require("../controllers/roleController")

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});


// Protect all routes after this middleware

// router.use(authoController.authenticationJwt);

router.route('/')
      .post(roleController.createRole)
      .get(roleController.getAllRoles)
      // .delete(roleController.deleteAllRoles)

router.route('/:roleId')
  .get(roleController.getRoleById)
  .patch(roleController.updateRole)
  .delete(roleController.deleteRole);
  
router.route('/toggleStatus/:roleId')
  .patch(roleController.changeRoleStatus);

module.exports=router