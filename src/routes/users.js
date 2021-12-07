const express = require('express');
const UserController = require("../app/controllers/userController")
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a Root Dir2');
});

router.get('/users/me', UserController.getMyInfo)

module.exports = router;
