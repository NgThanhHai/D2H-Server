var express = require('express')
const TestController = require("../app/controllers/testController")


var router = express.Router()

router.post("/create/:courseId", TestController.createTest);
router.get("/get-all-test/:courseId", TestController.getAllTest);
router.get("/get-test/:testId", TestController.getTest);
router.delete("/:testId", TestController.deleteTest);
router.put("/:testId", TestController.updateTest);
router.post("/grade", TestController.submitAssignment)
router.post("/submit-answer", TestController.submitTestAnswer)
router.get("/get-test-statistic/:testId", TestController.getTestStatistics)
router.post("/export-test", TestController.exportTest)
module.exports = router;