const db = require('./../models');
const CourseUserModel = db.CU;
const TestConfigModel = db.TestConfig;
const TestCodeModel = db.TestCode;
const AssignmentModel = db.Assignment;
const StudentModel = db.Student;
const StatisticModel = db.Statistic;
const TestModel = db.Test;
const imageProcessing = require('./../services/imageProcessingService')
const { countMatchPercentage, diff } = require('./../services/matchingServices')
const { average_score, median_score, count_under_marked_score, count_archive_marked_score, highest_score_archived } = require('./../services/descriptiveStatisticsService')
const auth = require('./../../middlewares/jwt');
var apiResponse = require('./../helpers/apiResponse');
const getPagingData = require('./../helpers/pagingData')
const getPagination = require('./../helpers/pagination')
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const moment = require('moment');
const convertCase = require('../../utils/convertCase');
const test = require('../models/test');

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

                        TestConfigModel.create(TestConfig).then(testconfig => {
                            testconfig.dataValues = convertCase(testconfig.dataValues)
                            test.dataValues.config = testconfig

                            test.dataValues = convertCase(test.dataValues)

                            return apiResponse.successResponseWithData(res, "Create test successfully", test);
                        })
                    })
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

exports.submitTestAnswer = [auth, function (req, res) {
    var userId = req.user.user_id;
    var testId = req.body.test_id;
    var courseId = req.body.course_id;
    var answerCollectionUrl = req.body.url


    try {
        CourseUserModel.findOne({
            where: {
                course_id: courseId,
                user_id: userId
            }
        }).then(course => {
            if (course) {
                TestModel.findOne({
                    where: {
                        test_id: testId
                    },
                    include: [{
                        model: TestConfigModel, as: "test_config",
                        required: true
                    }]
                }).then(async test => {
                    if (test) {
                        switch (test.dataValues.test_config.dataValues.test_answer_type) {
                            case "object": {
                                req.body.results.forEach(testDetails => {
                                    var testDetail = {
                                        test_code: testDetails.test_code,
                                        test_answer: JSON.stringify(testDetails.answer),
                                        image_url: "",
                                        testTestId: test.test_id
                                    }

                                    TestCodeModel.create(testDetail)
                                })

                                return apiResponse.successResponseWithData(res, "Submit answer successfully", req.body.results);
                            }
                            case "image": {
                                const imageProcessTask = []
                                answerCollectionUrl.forEach(assignment => {
                                    imageProcessTask.push(imageProcessing(test.test_id, assignment))
                                })
                                try {
                                    const result = await Promise.all(imageProcessTask)
                                    result.forEach(resolve => {
                                        var testDetail = {
                                            image_url: resolve.url,
                                            test_answer: JSON.stringify(resolve.result.answer),
                                            test_code: resolve.result.code_id,
                                            testTestId: test.test_id
                                        }
                                        
                                        TestCodeModel.create(testDetail)

                                        resolve.test_code = resolve.result.code_id
                                        delete resolve.result.code_id
                                        delete resolve.result.student_id
                                    })
                                    
                                    return apiResponse.successResponseWithData(res, "Submit answer successfully", result);
                                }catch (err) {

                                }
                            }
                            case "csv": {

                            }
                            default: {

                                return apiResponse.conflictResponse(res, "Something wrong happened");
                            }
                        }

                    }
                    else {

                        return apiResponse.conflictResponse(res, "Test not existed");
                    }
                })

            }
            else {
                return apiResponse.conflictResponse(res, "Course not existed");
            }
        })
    } catch (err) {
        return apiResponse.ErrorResponse(res, err)
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
                    TestModel.findAndCountAll({
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
                            if (tests.rows.length > 0) {
                                var testCollection = tests.rows
                                if (createdAt !== undefined) {

                                    var filterTime = moment(createdAt, "DD/MM/YYYY").format("LL").toString();
                                    var testCollection = testCollection.filter(function (t) {
                                        var lookupDate = moment(t.dataValues.createdAt, "DD/MM/YYYY").format("LL").toString();
                                        if (lookupDate === filterTime) { console.log("They are the same") }
                                        return (lookupDate === filterTime)
                                    })

                                }
                                if (status !== undefined) {
                                    var testCollection = testCollection.filter(function (t) {
                                        return status === t.dataValues.status
                                    })
                                }
                                
                                testCollection.forEach(unit => {
                                    unit.dataValues = convertCase(unit.dataValues)
                                    delete unit.dataValues.course_user
                                    unit.test_codes.forEach(answer => {
                                        let objectAnswer = JSON.parse(answer.test_answer)
                                        answer.test_answer = objectAnswer
                                        answer.dataValues = convertCase(answer.dataValues)
                                    })
                                    unit.test_config.dataValues = convertCase(unit.test_config.dataValues)
                                })
                                return apiResponse.successResponseWithPagingData(res, "Success", testCollection, getPagingData(page), tests.count)

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
                    answer.dataValues = convertCase(answer.dataValues)
                })
                tests.dataValues = convertCase(tests.dataValues)
                tests.dataValues.test_config.dataValues = convertCase(tests.dataValues.test_config.dataValues)

                return apiResponse.successResponseWithData(res, "Success", tests)
            } else {
                return apiResponse.successResponse(res, "Test not existed")
            }
        })
    } catch (err) {

        return apiResponse.ErrorResponse(res, err)
    }

}]


exports.getTestStatistics = [auth, function (req, res) {
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

                if (tests.status === "new") {
                    return apiResponse.conflictResponse(res, "Please grade the test first")
                } else {

                    StatisticModel.findOne({
                        where: {
                            testTestId: tests.test_id
                        }
                    }).then(statistic => {
                        if (!statistic) {
                            TestCodeModel.findAll({
                                where: {
                                    testTestId: tests.test_id
                                },
                                include: [{
                                    model: AssignmentModel, as: "assigments",
                                    required: true
                                }]
                            }).then(testcodes => {
                                let scoreCollection = []
                                testcodes.forEach(testcode => {
                                    testcode.assigments.forEach(assigment => {
                                        scoreCollection.push(assigment.dataValues.grade)
                                    })
                                })

                                var body = {
                                    average_score: average_score(scoreCollection),
                                    median_score: median_score(scoreCollection),
                                    noas_under_ten_percent: count_under_marked_score(scoreCollection, 0.1),
                                    noas_under_fifthty_percent: count_under_marked_score(scoreCollection, 0.5),
                                    noas_reach_hundred_percent: count_archive_marked_score(scoreCollection, 1),
                                    score_achived_by_most_assignment: highest_score_archived(scoreCollection)
                                }
                                StatisticModel.create(body).then(statistic => {
                                    statistic.dataValues = convertCase(statistic.dataValues)
                                    return apiResponse.successResponseWithData(res, "Success", statistic)
                                })

                            })
                        }
                        else {
                            return apiResponse.successResponseWithData(res, "Success", statistic)
                        }
                    })

                }

            } else {
                return apiResponse.conflictResponse(res, "Test not existed")
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