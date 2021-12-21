const db = require('./../models');
const CourseUserModel = db.CU;
const auth = require('./../../middlewares/jwt');
var apiResponse = require('./../helpers/apiResponse');
const TestModel = db.Test;

exports.createTest = [auth, function (req, res) {
    var userId = req.user.user_id;
    var courseId = req.params.courseId;
    if (!req.body) {
        return apiResponse.badRequestResponse(res, "Lack of required data")
    } else {
        try {
            CourseUserModel.findOne({
                where: {
                    course_id: courseId,
                    user_id: userId
                }
            }).then(course => {
                if (course) {
                    var Test = {
                        test_name: req.body.test_name,
                        status: "new",
                        graded_date: ``,
                        courseUserCourseUserId: course.course_user_id
                    }
                    TestModel.create(Test)

                    return apiResponse.successResponse(res, "Create test successfully");
                }


                else {
                    return apiResponse.conflictResponse(res, "Course not existed");
                }
            })
        } catch (err) {
            return apiResponse.ErrorResponse(res, err)
        }
    }
}]


exports.getAllTest = [auth, function (req, res) {
    var userId = req.user.user_id;
    var courseId = req.params.courseId;

    try {
        TestModel.findAll({
            include: [{
                model: CourseUserModel, as: "course_user",
                required: true,
                where: {
                    user_id: userId,
                    course_id: courseId
                }
            }]
        }).then(tests => {
            if (tests.length > 0) {
                tests.forEach(test => {
                    delete test.dataValues.course_user
                });
                return apiResponse.successResponseWithData(res, "Success", tests)
            } else {
                return apiResponse.successResponse(res, "Test not existed")
            }
        })
    }
    catch(err) {
        
        return apiResponse.ErrorResponse(res, err)
    }
    

}]

exports.getTest = [auth, function (req, res) {
    var userId = req.user.user_id;
    var testId = req.params.testId;

    try {
        TestModel.findOne({
            include: [{
                model: CourseUserModel, as: "course_user",
                required: true,
                where: {
                    user_id: userId
                }
            }],
            where: {
                test_id: testId
            }
        }).then(tests => {
            if (tests) {
                delete tests.dataValues.course_user
                return apiResponse.successResponseWithData(res, "Success", tests)
            } else {
                return apiResponse.successResponse(res, "Test not existed")
            }
        })
    }catch(err) {
        
        return apiResponse.ErrorResponse(res, err)
    }
    
}]

exports.deleteTest = [auth, function (req, res) {
    var userId = req.user.user_id;
    var testId = req.params.testId;

    try {
        TestModel.findOne({
            include: [{
                model: CourseUserModel, as: "course_user",
                required: true,
                where: {
                    user_id: userId
                }
            }],
            where: {
                test_id: testId
            }
        }).then(tests => {
            if (tests) {
                delete tests.dataValues.course_user
                TestModel.destroy({
                    where: {
                        test_id: testId
                    }
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


exports.updateTest = [auth, function(req,res) {
    var userId = req.user.user_id;
    var testId = req.params.testId;

    try {
        TestModel.findOne({
            include: [{
                model: CourseUserModel, as: "course_user",
                required: true,
                where: {
                    user_id: userId
                }
            }],
            where: {
                test_id: testId
            }
        }).then(tests => {
            if (tests) {
                delete tests.dataValues.course_user
                TestModel.update(req.body, {
                    where: {
                        test_id: testId
                    }
                })
                return apiResponse.successResponse(res, "Update course successfully");x
            } else {
                return apiResponse.conflictResponse(res, "Course not existed or you do not have permission to update");
            }
        })
    } catch (err) {

        return apiResponse.ErrorResponse(res, err)
    }

}]