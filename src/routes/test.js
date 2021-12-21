var express = require('express')
const TestController = require("../app/controllers/testController")


var router = express.Router()

router.post("/:courseId", TestController.createTest);

module.exports = router;