var express = require('express')
const CourseController = require("../app/controllers/courseController")

var router = express.Router()

router.get('/', CourseController.getAllCourses)
router.get('/id/:courseId', CourseController.getCourse)
router.get('/code/:courseCode', CourseController.getCourseByCode)
router.get('/name/:courseName', CourseController.getCourseByName)

router.delete('/:courseId', CourseController.deleteCourses)

router.put('/:courseId', CourseController.updateCourse)

router.post('', CourseController.createCourse)

module.exports = router;