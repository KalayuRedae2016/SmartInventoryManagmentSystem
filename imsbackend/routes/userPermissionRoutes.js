const express=require("express")
const app = express();
const router=express.Router()

const userController=require("../controllers/userController")
const userPermissionController=require("../controllers/userPermissionController")
const { authenticationJwt,requirePermission,requirePermissionOrSelf} = require('../utils/authUtils');

router.use(function (req, res, next) {
  res.header(
    'Access-Control-Allow-Headers',
    'x-access-token, Origin, Content-Type, Accept'
  );
  next();
});

router.route('/')
  .post(requirePermission('user:update'), userPermissionController.assignPermissionsToUser)
  .delete(requirePermission('user:update'), userPermissionController.removePermissionFromUser);

router.route('/:userId')
  .get(requirePermission('user:view'), userPermissionController.getUserPermissions);

module.exports = router;