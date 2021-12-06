const db = require('./../models');
const CourseModel = db.Course;
const UserModel = db.User;
const CourseUserModel = db.CU;
const auth = require('./../../middlewares/jwt');
var apiResponse = require('./../helpers/apiResponse');
const course = require('../models/course');


exports.getAllCourses = [auth, function (req, res) {
    try {
        CourseModel.findAll(
            {
                include: [{
                    model: UserModel, as: "user",
                    required: true,
                    where: {
                        user_id: req.params.userId
                    }
                }]
            }
        ).then((courses) => {
            if (courses.length > 0) {
                courses.forEach(course => {
                    delete course.dataValues.user
                });
                return apiResponse.successResponseWithData(res, "Success", courses)
            } else {
                return apiResponse.successResponseWithData(res, "Success", [])
            }
        })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)

    }
}]

exports.getCourseByCode = [auth, function (req, res) {

    try {

        CourseModel.findOne(
            {
                include: [{
                    model: UserModel, as: "user",
                    required: true,
                    where: {
                        user_id: req.params.userId
                    }
                }],
                where: {
                    course_code: req.params.courseCode
                }
            })
            .then(course => {
                if (course) {

                    courses.forEach(course => {
                        delete course.dataValues.user
                    });
                    return apiResponse.successResponseWithData(res, "Success", course)
                } else {
                    return apiResponse.successResponse(res, "Course not existed")
                }
            })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
    }
}]

exports.getCourseByName = [auth, function (req, res) {
    try {
        CourseModel.findOne(
            {
                include: [{
                    model: UserModel, as: "user",
                    required: true,
                    where: {
                        user_id: req.params.userId
                    }
                }],
                where: {
                    course_name: req.params.courseName
                }
            })
            .then(course => {
                if (course) {

                    courses.forEach(course => {
                        delete course.dataValues.user
                    });
                    return apiResponse.successResponseWithData(res, "Success", course)
                } else {
                    return apiResponse.successResponse(res, "Course not existed")
                }
            })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
    }
}]

exports.getCourse = [auth, function (req, res) {

    try {
        CourseModel.findOne(
            {
                include: [{
                    model: UserModel, as: "user",
                    required: true,
                    where: {
                        user_id: req.params.userId
                    }
                }],
                where: {
                    course_id: req.params.courseId
                }
            })
            .then(course => {
                if (course) {

                    courses.forEach(course => {
                        delete course.dataValues.user
                    });
                    return apiResponse.successResponseWithData(res, "Success", course)
                } else {
                    return apiResponse.successResponse(res, "Course not existed")
                }
            })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
    }
}]

exports.createCourse = [auth, function (req, res) {
    if (!req.body) {
        return apiResponse.badRequestResponse(res, "Lack of required data")
    }
    try {
        CourseModel.findOne({ where: { course_code: req.body.course_code } }).then(course => {

            if (!course) {

                var Course = {
                    course_name: req.body.course_name,
                    course_code: req.body.course_code
                }


                CourseModel.create(Course).then(result =>
                    CourseUserModel.create({
                        course_id: result.course_id,
                        user_id: req.params.userId,
                    }));




                return apiResponse.successResponse(res, "Create course successfully");
            } else {
                return apiResponse.conflictResponse(res, "Course code already existed");
            }
        })
    } catch (ex) {
        console.log(ex)
        return apiResponse.ErrorResponse(req, ex)
    }
}]

exports.deleteCourses = [auth, function (req, res) {

    try {
        CourseUserModel.findOne(
            {
                where: {
                    course_id: req.params.courseId,
                    user_id : req.params.userId
                }
            })
            .then(course => {
                if(course)
                {
                    CourseModel.destroy({
                        where: {course_id : course.course_id}   
                    })
                    CourseUserModel.destroy({
                        where: {course_id : course.course_id}
                    })
                    return apiResponse.successResponse(res, "Delete course successfully");
                } else {
                    return apiResponse.conflictResponse(res, "Course not existed or you do not have permission to delete");
                }
            })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
    }
}]


exports.updateCourse = [auth, function (req, res) {
    try {
        CourseUserModel.findOne(
            {
                where: {
                    course_id: req.params.courseId,
                    user_id : req.params.userId
                }
            })
            .then(course => {
                if(course)
                {
                    CourseModel.update( req.body, {
                        where: {course_id : course.course_id}   
                    })
                    return apiResponse.successResponse(res, "Update course successfully");
                } else {
                    return apiResponse.conflictResponse(res, "Course not existed or you do not have permission to update");
                }
            })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
    }
}]