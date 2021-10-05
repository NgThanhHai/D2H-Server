var express = require('express')
const AuthController = require("../app/controllers/authController")

var router = express.Router()

router.get('/', function(req, res, next) {
    res.send('respond with a resource');
  });

router.post('/signUp', AuthController.signUp)
router.post('/login', AuthController.login)

module.exports = router;