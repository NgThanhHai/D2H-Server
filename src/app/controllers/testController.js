const db = require('./../models');
const CourseUserModel = db.CU;
const TestConfigModel = db.TestConfig;
const TestCodeModel = db.TestCode;
const AssignmentModel = db.Assignment;
const StudentModel = db.Student;
const { performance } = require('perf_hooks');
const imageProcessing = require('./../services/imageProcessingService')
const { countMatchPercentage, diff } = require('./../services/matchingServices')
const auth = require('./../../middlewares/jwt');
var apiResponse = require('./../helpers/apiResponse');
const { Assignment, Course } = require('./../models');
const getPagingData = require('./../helpers/pagingData')
const getPagination = require('./../helpers/pagination')
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const TestModel = db.Test;
const moment = require('moment');

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
    var size = req.query.size
    var page = req.query.page
    var test_name = req.query.name
    var test_code = req.query.code
    var status = req.query.status
    var createdAt = req.query.date
    var nameCondition = test_name ? { test_name: { [Op.like]: `%${test_name}%` } } : null;
    var codeCondition = test_code ? { test_code: { [Op.like]: `%${test_code}%` } } : null;
    const { limit, offset } = getPagination(page, size);


    try {
        CourseUserModel.findOne({
            where: {
                course_id: courseId,
                user_id: userId
            }
        })
            .then(courseuser => {
                if (!courseuser) {
                    return apiResponse.badRequestResponse(res, "Course do not exist or you do not have permission to access")
                }
                else {
                    TestModel.findAll({
                        where: nameCondition
                        ,
                        limit: limit,
                        offset: offset,
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
                            required: true,
                            where: codeCondition
                        }]
                    }).
                        then(tests => {
                            if (tests.length > 0) {
                                
                                if (createdAt !== undefined) {

                                    var tests = tests.filter(function (t) {
                                        var month = t.dataValues.createdAt.getUTCMonth() + 1; //months from 1-12
                                        var day = t.dataValues.createdAt.getUTCDate();
                                        var year = t.dataValues.createdAt.getUTCFullYear();
                                        var lookupDate = year + "/" + month + "/" + day;
                                        return (lookupDate === createdAt)
                                    })

                                }
                                if (status !== undefined){
                                    var tests = tests.filter(function(t) {
                                        return status === t.dataValues.status
                                    })
                                }

                                tests.forEach(test => {

                                    delete test.dataValues.course_user
                                });
                                tests.forEach(unit => {
                                    unit.test_codes.forEach(answer => {
                                        let objectAnswer = JSON.parse(answer.test_answer)
                                        answer.test_answer = objectAnswer
                                    })
                                })

                                return apiResponse.successResponseWithPagingData(res, "Success", tests, getPagingData(page))
                            } else {
                                return apiResponse.successResponse(res, "Test not existed")
                            }
                        }).catch(err => {

                            console.log(err)
                        })
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
                return apiResponse.successResponse(res, "Update course successfully");
            } else {
                return apiResponse.conflictResponse(res, "Course not existed or you do not have permission to update");
            }
        })
    } catch (err) {

        return apiResponse.ErrorResponse(res, err)
    }

}]


exports.submitAssignment = [auth, function (req, res) {

    var testId = req.body.test_id;
    var assignmentCollectionUrl = req.body.url
    TestModel.findOne({
        where: {
            test_id: testId
        }
    }).then(async test => {
        if (test) {
            const imageProcessTask = []
            assignmentCollectionUrl.forEach(assignment => {
                imageProcessTask.push(imageProcessing(test.test_id, assignment))
            })

            try {

                const result = await Promise.all(imageProcessTask)

                result.forEach(resolve => {

                    var assigntmentBody = {
                        image_url: resolve.url,
                        status: "new",
                        answer: JSON.stringify(resolve.result.answer)
                    }

                    AssignmentModel.create(assigntmentBody).then(assignment => {

                        TestCodeModel.findOne({
                            where: {
                                test_code: resolve.result.code_id,
                                testTestId: resolve.test_id
                            }
                        }).then(testcode => {
                            if (testcode) {

                                var result = diff(JSON.parse(assignment.answer), JSON.parse(testcode.test_answer))
                                var grade = countMatchPercentage(result)

                                AssignmentModel.update(
                                    {
                                        grade: grade,
                                        status: "graded"
                                    }, {
                                    where: {
                                        assignment_id: assignment.assignment_id
                                    }
                                }
                                )

                                AssignmentModel.update({ testCodeTestCodeId: testcode.test_code_id }, {
                                    where: {
                                        assignment_id: assignment.assignment_id
                                    }
                                })
                            }
                        })

                        StudentModel.findOne({

                            where: {
                                student_id: resolve.result.student_id
                            }

                        }).then(student => {
                            if (!student) {
                                var student = {
                                    student_id: resolve.result.student_id,
                                    student_name: resolve.result.student_id,
                                    mail: resolve.result.student_id + '@gmail.com'
                                }
                                StudentModel.create(student).then(student => {
                                    AssignmentModel.update({ studentStudentId: student.student_id }, {
                                        where: {
                                            assignment_id: assignment.assignment_id
                                        }
                                    })
                                })
                            } else {
                                AssignmentModel.update({ studentStudentId: student.student_id }, {
                                    where: {
                                        assignment_id: assignment.assignment_id
                                    }
                                })
                            }

                        })
                    })

                })


                return apiResponse.successResponse(res, "Grade test successfully!")

            } catch (err) {
                return apiResponse.badRequestResponse(res, "Something wrong occurs")
            }
        } else {
            return apiResponse.badRequestResponse(res, "Test not exist!")
        }

    })

}]