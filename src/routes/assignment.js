var express = require('express')
const AssignmentController = require("../app/controllers/assignmentController")


var router = express.Router()

router.get('/', AssignmentController.getAllAssignment)


module.exports = router;