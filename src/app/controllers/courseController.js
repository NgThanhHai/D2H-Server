const db = require('./../models');
const CourseModel = db.Course;
const UserModel = db.User;
const CourseUserModel = db.CU;
const auth = require('./../../middlewares/jwt');
var apiResponse = require('./../helpers/apiResponse');
const getPagingData = require('./../helpers/pagingData')
const getPagination = require('./../helpers/pagination')
const Sequelize = require('sequelize');
const Op = Sequelize.Op;


exports.getAllCourses = [auth, function (req, res) {

    var user_id = req.user.user_id
    var size = req.query.size
    var page = req.query.page
    var course_name = req.query.name

    var condition = course_name ? { course_name: { [Op.like]: `%${course_name}%` } } : null;

    const { limit, offset } = getPagination(page, size);
    

    try {
        CourseModel.findAndCountAll(
            {
                where: condition,
                limit: limit,
                offset: offset,
                include: [{
                    model: UserModel, as: "user",
                    required: true,
                    where: {
                        user_id: user_id 
                    }
                }]
            }
        ).then((courses) => {
            if (courses.rows.length > 0) {
                courses.rows.forEach(course => {
                    delete course.dataValues.user
                });
                
                return apiResponse.successResponseWithPagingData(res, "Success", courses.rows, getPagingData( page), courses.count)
            } else {
                return apiResponse.successResponseWithData(res, "Success", [])
            }
        })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)

    }
}]

exports.getCourseByCode = [auth, function (req, res) {

    var user_id = req.user.user_id

    try {

        CourseModel.findOne(
            {
                include: [{
                    model: UserModel, as: "user",
                    required: true,
                    where: {
                        user_id: user_id
                    }
                }],
                where: {
                    course_code: req.params.courseCode
                }
            })
            .then(courses => {
                if (courses) {

                    delete courses.dataValues.user
                    return apiResponse.successResponseWithData(res, "Success", courses)
                } else {
                    return apiResponse.successResponse(res, "Course not existed")
                }
            })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
    }
}]

exports.getCourseByName = [auth, function (req, res) {
    
    var user_id = req.user.user_id
    try {
        CourseModel.findOne(
            {
                include: [{
                    model: UserModel, as: "user",
                    required: true,
                    where: {
                        user_id: user_id
                    }
                }],
                where: {
                    course_name: req.params.courseName
                }
            })
            .then(courses => {
                if (courses) {

                    delete courses.dataValues.user
                    return apiResponse.successResponseWithData(res, "Success", courses)
                } else {
                    return apiResponse.successResponse(res, "Course not existed")
                }
            })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
    }
}]

exports.getCourse = [auth, function (req, res) {

    var user_id = req.user.user_id

    try {
        CourseModel.findOne(
            {
                include: [{
                    model: UserModel, as: "user",
                    required: true,
                    where: {
                        user_id: user_id
                    }
                }],
                where: {
                    course_id: req.params.courseId
                }
            })
            .then(courses => {
                if (courses) {

                    delete courses.dataValues.user
                    return apiResponse.successResponseWithData(res, "Success", courses)
                } else {
                    return apiResponse.successResponse(res, "Course not existed")
                }
            })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
    }
}]

exports.createCourse = [auth, function (req, res) {
    
    var user_id = req.user.user_id

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
                        user_id: user_id,
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
    var user_id = req.user.user_id
    try {
        CourseUserModel.findOne(
            {
                where: {
                    course_id: req.params.courseId,
                    user_id : user_id
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
    var user_id = req.user.user_id
    try {
        CourseUserModel.findOne(
            {
                where: {
                    course_id: req.params.courseId,
                    user_id : user_id
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