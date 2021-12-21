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
                        static: `new`,
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