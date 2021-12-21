var express = require('express')
const TestController = require("../app/controllers/testController")


var router = express.Router()

router.post("/:courseId", TestController.createTest);
router.get("/get-all-course/:courseId", TestController.getAllTest);
router.get("/get-course/:testId", TestController.getTest);
router.delete("/:testId", TestController.deleteTest);
router.put("/:testId", TestController.updateTest);


module.exports = router;