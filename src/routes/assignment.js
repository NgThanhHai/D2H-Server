var express = require('express')
const AssignmentController = require("../app/controllers/assignmentController")


var router = express.Router()

router.post('/', AssignmentController.getAllAssignment)
router.post('/single-assignment', AssignmentController.getAssignment)


module.exports = router;