const db = require('./../models');
const CourseUserModel = db.CU;
const TestConfigModel = db.TestConfig;
const TestCodeModel = db.TestCode;
const AssignmentModel = db.Assignment;
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
                    TestModel.create(Test).then(test => {
                        var TestConfig = {
                            test_answer_type: req.body.result_type,
                            is_multiple_choice: req.body.multiple_choice,
                            total_number_of_question: req.body.number_of_question,
                            paper_type: req.body.paper_type,
                            testTestId: test.test_id
                        }

                        TestConfigModel.create(TestConfig)

                        req.body.results.forEach(testDetails => {


                            var testDetail = {
                                test_code: testDetails.test_code,
                                test_answer: JSON.stringify(testDetails.answer),
                                image_url: testDetails.url,
                                testTestId: test.test_id
                            }

                            TestCodeModel.create(testDetail)
                        })

                    })

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
            }],
            include: [{
                model: TestConfigModel, as: "test_config",
                required: true
            }, {
                model: TestCodeModel, as: "test_codes",
                required: true
            }]
        }).then(tests => {
            if (tests.length > 0) {
                tests.forEach(test => {
                    delete test.dataValues.course_user
                });
                console.log(tests.dataValues)
                tests.forEach( unit => {
                    unit.test_codes.forEach(answer => {
                    let objectAnswer = JSON.parse(answer.test_answer)
                    answer.test_answer = objectAnswer
                })})
                return apiResponse.successResponseWithData(res, "Success", tests)
            } else {
                return apiResponse.successResponse(res, "Test not existed")
            }
        })
    }
    catch (err) {

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
            include: [{
                model: TestConfigModel, as: "test_config",
                required: true,
                where: {
                    testTestId: testId
                }
            }, {
                model: TestCodeModel, as: "test_codes",
                required: true,
                where: {
                    testTestId: testId
                }
            }],
            where: {
                test_id: testId
            }
        }).then(tests => {
            if (tests) {
                delete tests.dataValues.course_user

                tests.dataValues.test_codes.forEach(answer => {
                    let objectAnswer = JSON.parse(answer.test_answer)
                    answer.test_answer = objectAnswer
                })

                return apiResponse.successResponseWithData(res, "Success", tests)
            } else {
                return apiResponse.successResponse(res, "Test not existed")
            }
        })
    } catch (err) {

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
                AssignmentModel.destroy({
                    include: [{
                        model: TestCodeModel, as: "test_codes",
                        required: true,
                        where: {
                            testTestId: testId
                        }
                    }]
                })                    
                TestCodeModel.destroy({
                    where: {
                        testTestId: testId
                    }
                })
                TestConfigModel.destroy({
                    where: {
                        testTestId: testId
                    }
                })
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


exports.updateTest = [auth, function (req, res) {
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
                var TestConfig = {
                    test_answer_type: req.body.result_type,
                    is_multiple_choice: req.body.multiple_choice,
                    total_number_of_question: req.body.number_of_question,
                    paper_type: req.body.paper_type
                }

                TestConfigModel.update(TestConfig, {
                    where: {
                        testTestId: testId
                    }

                })

                req.body.results.forEach(testDetails => {

                    var testDetail = {
                        test_code: testDetails.test_code,
                        test_answer: JSON.stringify(testDetails.answer),
                        image_url: testDetails.url,
                    }

                    TestCodeModel.update(testDetail, {
                        where: {
                            testTestId: testId
                        }
                    })
                })

                var Test = {
                    test_name: req.body.test_name
                }
                TestModel.update(Test, {
                    where: {
                        test_id: testId
                    }
                })
                return apiResponse.successResponse(res, "Update course successfully"); x
            } else {
                return apiResponse.conflictResponse(res, "Course not existed or you do not have permission to update");
            }
        })
    } catch (err) {

        return apiResponse.ErrorResponse(res, err)
    }

}]