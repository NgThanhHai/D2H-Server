var express = require('express')
const CourseController = require("../app/controllers/courseController")

var router = express.Router()

router.get('/courses/:userId', CourseController.getAllCourses)
router.get('/Courses/:userId/id/:courseId', CourseController.getCourse)
router.get('/Courses/:userId/code/:courseCode', CourseController.getCourseByCode)
router.get('/courses/:userId/name/:courseName', CourseController.getCourseByName)

router.delete('/courses/:userId/:courseId', CourseController.deleteCourses)

router.put('/courses/:userId/:courseId', CourseController.updateCourse)

router.post('/courses/:userId', CourseController.createCourse)

module.exports = router;