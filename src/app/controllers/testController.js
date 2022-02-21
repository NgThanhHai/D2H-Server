const db = require('./../models');
const CourseUserModel = db.CU;
const TestConfigModel = db.TestConfig;
const TestCodeModel = db.TestCode;
const AssignmentModel = db.Assignment;
const StudentModel = db.Student;
const TestModel = db.Test;
const UserModel = db.User;
var concat = require('concat-stream')
var request = require('request').defaults({ encoding: null });;
var excel = require('exceljs');
const imageProcessing = require('./../services/imageProcessingService')
const { countMatchPercentage, diff } = require('./../services/matchingServices')
const { average_score, median_score, count_under_marked_score, count_archive_marked_score, highest_score_archived, score_in_range } = require('./../services/descriptiveStatisticsService')
const auth = require('./../../middlewares/jwt');
var apiResponse = require('./../helpers/apiResponse');
const getPagingData = require('./../helpers/pagingData')
const getPagination = require('./../helpers/pagination')
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const axios = require('axios');
const Buffer = require('buffer');
const moment = require('moment');
const fileUploader = require('./../../configs/cloudinary.config');
const convertCase = require('../../utils/convertCase');
const checkMultipleChoice = require('../../utils/checkMultipleChoice');
const detectError = require('./../services/detectErrorAssignmentService')
const { performance } = require('perf_hooks');
const { sendMail, messageParser } = require('./../services/mailService');
const cloneDeep = require('../../utils/cloneDeep')
const { copyFileSync } = require('fs');
const { resolve } = require('path');
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// let workQueue = new Queue('work', REDIS_URL);

exports.createTest = [auth, function (req, res) {
    var userId = req.user.user_id;
    var courseId = req.params.courseId;
    var answerCollectionUrl = req.body.url
    if (!courseId || courseId === "") {
        return apiResponse.badRequestResponse(res, "Course id is required")
    }

    if (!req.body) {
        return apiResponse.badRequestResponse(res, "Lack of required data")
    } else {
        try {
            CourseUserModel.findOne({
                where: {
                    course_id: courseId,
                    user_id: userId
                }
            }).then(async course => {
                if (course) {
                    var Test = {
                        test_name: req.body.test_name,
                        status: "new",
                        graded_date: ``,
                        courseUserCourseUserId: course.course_user_id
                    }
                    TestModel.create(Test).then(async test => {
                        var TestConfig = {
                            test_answer_type: req.body.result_type,
                            is_multiple_choice: req.body.multiple_choice || false,
                            total_number_of_question: req.body.number_of_question ? req.body.number_of_question : 0,
                            paper_type: req.body.paper_type,
                            testTestId: test.test_id
                        }

                        var testconfig = await TestConfigModel.create(TestConfig)
                        testconfig.dataValues = convertCase(testconfig.dataValues)
                        test.dataValues.config = testconfig
                        test.dataValues = convertCase(test.dataValues)

                        switch (testconfig.dataValues.test_answer_type) {
                            case "object": {
                                test.dataValues.results = []
                                for (var i = 0; i < req.body.results.length; i++) {
                                    var testDetail = {
                                        test_code: req.body.results[i].test_code,
                                        test_answer: JSON.stringify(req.body.results[i].answer),
                                        image_url: "",
                                        testTestId: test.test_id
                                    }

                                    var testcode = await TestCodeModel.create(testDetail)
                                    test.dataValues.results.push(testcode)
                                }
                                for (var index = 0; index < test.dataValues.results.length; index++) {
                                    test.dataValues.results[index].dataValues.test_answer = JSON.parse(test.dataValues.results[index].dataValues.test_answer)
                                    test.dataValues.results[index].dataValues = convertCase(test.dataValues.results[index].dataValues)
                                }
                                return apiResponse.successResponseWithData(res, "Create test successfully", test);
                            }
                            case "image": {
                                const imageProcessTask = []
                                answerCollectionUrl.forEach(assignment => {
                                    imageProcessTask.push(imageProcessing(test.test_id, Number(testconfig.paper_type), "", assignment))
                                })
                                try {
                                    const result = await Promise.all(imageProcessTask)
                                    var isMC = false
                                    var numberOfQuestion = 0
                                    for (var i = 0; i < result.length; i++) {
                                        let resolve = result[i]
                                        var testDetail = {
                                            image_url: resolve.url,
                                            test_answer: JSON.stringify(resolve.result.answer),
                                            test_code: resolve.result.code_id,
                                            testTestId: test.test_id
                                        }
                                        if (checkMultipleChoice(resolve.result.answer)) {
                                            isMC = true
                                        }
                                        TestCodeModel.create(testDetail)

                                        resolve.test_code = resolve.result.code_id
                                        delete resolve.result.code_id
                                        delete resolve.result.student_id

                                        numberOfQuestion = Object.keys(resolve.result.answer).length
                                    }
                                    var TestConfig = {
                                        is_multiple_choice: isMC,
                                        total_number_of_question: numberOfQuestion
                                    }

                                    TestConfigModel.update(TestConfig, {
                                        where: {
                                            testTestId: test.test_id
                                        }
                                    })
                                    test.dataValues.results = result
                                    test.dataValues.config.is_multiple_choice = isMC
                                    test.dataValues.config.total_number_of_question = numberOfQuestion
                                    return apiResponse.successResponseWithData(res, "Create test successfully", test);
                                } catch (err) {
                                    return apiResponse.ErrorResponse(res, err)
                                }
                            }
                            case "csv": {
                                try {
                                    const workbook = new excel.Workbook();
                                    var isMC = false
                                    var numberOfQuestion = 0
                                    var returnTestCode = []
                                    var getExcel = function (req) {
                                        var dummy = req
                                        return new Promise((resolve, reject) => {
                                            request.get({ url: answerCollectionUrl[0] }, async function (err, buff) {

                                                await workbook.xlsx.load(buff.body)
                                                var worksheet = workbook.worksheets[0]
                                                for (var j = 0; j < worksheet.rowCount; j++) {
                                                    var row = worksheet.getRow(j + 1)
                                                    var rowNumber = j + 1
                                                    if (rowNumber > 1) {
                                                        var test_anwser = {}
                                                        for (var index = 4; index < row.getCell(2).value + 4; index++) {
                                                            var temp = []
                                                            if ((row.getCell(index).value).length > 1) {
                                                                for (var letter = 0; letter < (row.getCell(index).value).length; letter++) {
                                                                    if ((row.getCell(index).value)[letter] == "A" || (row.getCell(index).value)[letter] == "B"
                                                                        || (row.getCell(index).value)[letter] == "C" || (row.getCell(index).value)[letter] == "D"
                                                                        || (row.getCell(index).value)[letter] == "a" || (row.getCell(index).value)[letter] == "b"
                                                                        || (row.getCell(index).value)[letter] == "c" || (row.getCell(index).value)[letter] == "d") {
                                                                        temp.push((row.getCell(index).value)[letter])
                                                                    }
                                                                }
                                                            } else {
                                                                temp.push(row.getCell(index).value)
                                                            }
                                                            test_anwser[(index - 3).toString()] = temp
                                                        }

                                                        var testDetail = {
                                                            test_code: row.getCell(1).value,
                                                            test_answer: JSON.stringify(test_anwser),
                                                            image_url: answerCollectionUrl[0],
                                                            testTestId: test.test_id
                                                        }

                                                        let testcode = await TestCodeModel.create(testDetail)
                                                        testcode.dataValues = convertCase(testcode.dataValues)
                                                        returnTestCode.push(testcode)
                                                        isMC = row.getCell(3).value
                                                        numberOfQuestion = row.getCell(2).value
                                                    }
                                                }
                                                var TestConfig = {
                                                    is_multiple_choice: isMC,
                                                    total_number_of_question: numberOfQuestion
                                                }
                                                TestConfigModel.update(TestConfig, {
                                                    where: {
                                                        testTestId: dummy.test_id
                                                    }
                                                })
                                                dummy.results = JSON.parse(JSON.stringify(returnTestCode))
                                                dummy.config.is_multiple_choice = isMC
                                                dummy.config.total_number_of_question = numberOfQuestion

                                                resolve(dummy)
                                            })
                                        })
                                    }

                                    async function callApi(dummy) {
                                        try {
                                            const result = await getExcel(dummy);
                                            return result

                                        } catch (error) {
                                            console.error('ERROR:');
                                            console.error(error);
                                        }
                                    }

                                    let dummy = JSON.parse(JSON.stringify(test))
                                    var result = await callApi(dummy)
                                    result.results.forEach(testcode => {
                                        testcode.test_answer = JSON.parse(testcode.test_answer)
                                    })
                                    return apiResponse.successResponseWithData(res, "Create test successfully", result);
                                } catch (err) {
                                    return apiResponse.ErrorResponse(res, err)
                                }

                            }
                            default: {
                                return apiResponse.conflictResponse(res, "Something wrong happened");
                            }
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

                                    var isMC = false
                                    var numberOfQuestion = 0
                                    result.forEach(resolve => {
                                        var testDetail = {
                                            image_url: resolve.url,
                                            test_answer: JSON.stringify(resolve.result.answer),
                                            test_code: resolve.result.code_id,
                                            testTestId: test.test_id
                                        }
                                        if (checkMultipleChoice(resolve.result.answer)) {
                                            isMC = true
                                        }
                                        TestCodeModel.create(testDetail)

                                        resolve.test_code = resolve.result.code_id
                                        delete resolve.result.code_id
                                        delete resolve.result.student_id

                                        numberOfQuestion = Object.keys(resolve.result.answer).length
                                    })
                                    var TestConfig = {
                                        is_multiple_choice: isMC,
                                        total_number_of_question: numberOfQuestion
                                    }

                                    TestConfigModel.update(TestConfig, {
                                        where: {
                                            testTestId: testId
                                        }
                                    })
                                    return apiResponse.successResponseWithData(res, "Submit answer successfully", result);
                                } catch (err) {
                                    return apiResponse.ErrorResponse(res, err)
                                }
                            }
                            case "csv": {
                                var file = request("https://res.cloudinary.com/haiii/raw/upload/v1644415093/excel/config_ieyspl.xlsx")
                                const workbook = new excel.Workbook();
                                file.pipe(concat({ encoding: 'buffer' }, async function (buf) {
                                    await workbook.xlsx.load(buf)

                                    var worksheet = worksheet.worksheets[0]
                                    worksheet.eachRow(function (row, rowNumber) {
                                        console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
                                        // var testDetail = {
                                        //     test_code: testDetails.test_code,
                                        //     test_answer: JSON.stringify(testDetails.answer),
                                        //     image_url: "",
                                        //     testTestId: test.test_id
                                        // }

                                        // TestCodeModel.create(testDetail)
                                    });
                                }))
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
    var conditionName = req.query.name
    var status = req.query.status
    const { limit, offset } = getPagination(page, size);

    var startDate = req.query.start_date ? req.query.start_date : null
    var endDate = req.query.end_date ? req.query.end_date : null
    if (!courseId || courseId === "") {
        return apiResponse.badRequestResponse(res, "Course id is required")
    }
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
                        where: { courseUserCourseUserId: courseuser.dataValues.course_user_id }
                        ,
                        limit: limit,
                        offset: offset,
                        include: [{
                            model: TestConfigModel, as: "test_config"
                        }, {
                            model: TestCodeModel, as: "test_codes"
                        }]
                    }).
                        then(tests => {
                            if (tests.rows.length > 0) {
                                var testCollection = tests.rows
                                if (!conditionName || conditionName === "") {

                                } else {
                                    testCollection = testCollection.filter(function (t) {
                                        return (t.dataValues.test_name.includes(conditionName))
                                    })
                                }

                                if (startDate && startDate !== "") {
                                    var lowerFilterTime = moment(startDate, "DD/MM/YYYY").format("LL")
                                    testCollection = testCollection.filter(function (t) {
                                        var lookupDate = moment(t.dataValues.createdAt, "DD/MM/YYYY").format("LL")
                                        return (new Date(lookupDate) >= new Date(lowerFilterTime))
                                    })
                                }
                                if (endDate && endDate !== "") {
                                    var upperFilterTime = moment(endDate, "DD/MM/YYYY").format("LL")
                                    testCollection = testCollection.filter(function (t) {
                                        var lookupDate = moment(t.dataValues.createdAt, "DD/MM/YYYY").format("LL")
                                        return (new Date(lookupDate) <= new Date(upperFilterTime))
                                    })

                                }
                                if (status !== undefined && status !== "") {
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
                                return apiResponse.successResponseWithPagingData(res, "Success", testCollection, getPagingData(page), testCollection.length)

                            } else {
                                return apiResponse.successResponseWithData(res, "Test not existed", [])
                            }
                        }).catch(err => {

                            return apiResponse.ErrorResponse(res, err)
                        })
                }
            })
    }
    catch (err) {

        return apiResponse.ErrorResponse(res, err)
    }
}]

exports.getTest = [auth, async function (req, res) {
    var userId = req.user.user_id;
    var testId = req.params.testId;
    if (!testId || testId === "") {
        return apiResponse.badRequestResponse(res, "Test id is required")
    }
    try {
        let courseuser = await CourseUserModel.findAll({
            where: {
                user_id: userId
            }
        })
        if (!courseuser) {
            return apiResponse.badConflictResponse(res, "User not exist")
        }

        let courseuserCollection = []
        for (let index = 0; index < courseuser.length; index++) {
            courseuserCollection.push(courseuser[index].course_user_id)
        }

        TestModel.findOne({
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
            if (!courseuserCollection.includes(tests.dataValues.courseUserCourseUserId)) {
                return apiResponse.conflictResponse(res, "User not have access to this test")
            }
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
                return apiResponse.conflictResponse(res, "Test not existed")
            }
        })
    } catch (err) {

        return apiResponse.ErrorResponse(res, err)
    }
}]

exports.getTestStatistics = [auth, async function (req, res) {
    var userId = req.user.user_id;
    var testId = req.params.testId;
    var step = req.query.step
    if (!testId || testId === "") {
        return apiResponse.badRequestResponse(res, "Test id is required")
    }
    try {
        let courseuser = await CourseUserModel.findAll({
            where: {
                user_id: userId
            }
        })
        if (!courseuser) {
            return apiResponse.badConflictResponse(res, "User not exist")
        }

        let courseuserCollection = []
        for (let index = 0; index < courseuser.length; index++) {
            courseuserCollection.push(courseuser[index].course_user_id)
        }
        TestModel.findOne({
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
            if (!courseuserCollection.includes(tests.dataValues.courseUserCourseUserId)) {
                return apiResponse.conflictResponse(res, "User not have access to this test")
            }
            if (tests) {

                if (tests.status === "new") {
                    return apiResponse.conflictResponse(res, "Please grade the test first")
                } else {

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
                                scoreCollection.push(assigment.dataValues.grade * 10)
                            })
                        })

                        let sir = {}

                        for (let index = 0; index < 10; index = +index + +step) {
                            let upper = +index + +step
                            let lower = +index
                            let label = +lower + "_" + +upper
                            if (+upper == +10) {
                                upper = 11
                            }
                            sir[label] = score_in_range(scoreCollection, lower, upper)
                        }



                        var body = {
                            test_id: tests.test_id,
                            total_assignments: scoreCollection.length,
                            average_score: average_score(scoreCollection),
                            median_score: median_score(scoreCollection),
                            noas_under_ten_percent: count_under_marked_score(scoreCollection, 1),
                            noas_under_fifthty_percent: count_under_marked_score(scoreCollection, 5),
                            noas_reach_hundred_percent: count_archive_marked_score(scoreCollection, 10),
                            score_achived_by_most_assignment: highest_score_archived(scoreCollection),
                            score_at_good: score_in_range(scoreCollection, 8, 11),
                            score_at_rather: score_in_range(scoreCollection, 6.5, 8),
                            score_at_medium: score_in_range(scoreCollection, 5, 6.5),
                            score_at_weak: score_in_range(scoreCollection, 0, 5),
                            score_in_range: sir
                        }
                        return apiResponse.successResponseWithData(res, "Success", body)
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

exports.deleteTest = [auth, async function (req, res) {
    var userId = req.user.user_id;
    var testId = req.params.testId;
    if (!testId || testId === "") {
        return apiResponse.badRequestResponse(res, "Test id is required")
    }
    try {
        let courseuser = await CourseUserModel.findAll({
            where: {
                user_id: userId
            }
        })
        if (!courseuser) {
            return apiResponse.badConflictResponse(res, "User not exist")
        }

        let courseuserCollection = []
        for (let index = 0; index < courseuser.length; index++) {
            courseuserCollection.push(courseuser[index].course_user_id)
        }
        TestModel.findOne({
            where: {
                test_id: testId
            }
        }).then(tests => {
            if (!courseuserCollection.includes(tests.dataValues.courseUserCourseUserId)) {
                return apiResponse.conflictResponse(res, "User not have access to this test")
            }
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


exports.updateTest = [auth, async function (req, res) {
    var userId = req.user.user_id;
    var testId = req.params.testId;
    if (!testId || testId === "") {
        return apiResponse.badRequestResponse(res, "Test id is required")
    }
    try {
        let courseuser = await CourseUserModel.findAll({
            where: {
                user_id: userId
            }
        })
        if (!courseuser) {
            return apiResponse.badConflictResponse(res, "User not exist")
        }

        let courseuserCollection = []
        for (let index = 0; index < courseuser.length; index++) {
            courseuserCollection.push(courseuser[index].course_user_id)
        }
        TestModel.findOne({
            where: {
                test_id: testId
            }
        }).then(tests => {
            if (!courseuserCollection.includes(tests.dataValues.courseUserCourseUserId)) {
                return apiResponse.conflictResponse(res, "User not have access to this test")
            }
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


exports.submitAssignment = [auth, async function (req, res) {
    var userId = req.user.user_id
    var testId = req.body.test_id;
    var assignmentCollectionUrl = req.body.url
    if (!testId || testId === "") {
        return apiResponse.badRequestResponse(res, "Test id is required")
    }
    if (!assignmentCollectionUrl || assignmentCollectionUrl.length === 0) {
        return apiResponse.badRequestResponse(res, "Assignment URL is required")
    }
    var startTime = performance.now();
    try {
        let courseuser = await CourseUserModel.findAll({
            where: {
                user_id: userId
            }
        })
        if (!courseuser) {
            return apiResponse.badConflictResponse(res, "User not exist")
        }

        let courseuserCollection = []
        for (let index = 0; index < courseuser.length; index++) {
            courseuserCollection.push(courseuser[index].course_user_id)
        }

        TestModel.findOne({
            where: {
                test_id: testId
            },
            include: [{
                model: TestConfigModel, as: "test_config",
                required: true,
                where: {
                    testTestId: testId
                }
            }]
        }).then(async test => {
            if (!courseuserCollection.includes(test.dataValues.courseUserCourseUserId)) {
                return apiResponse.conflictResponse(res, "User not have access to this test")
            }
            if (test) {
                // let testcodes = await TestCodeModel.findAll({
                //     where: {
                //         testTestId: test.test_id
                //     }
                // })
                // let test_answer = {}
                // for (let testcode_index = 0; testcode_index < testcodes.length; testcode_index++) {
                //     test_answer[testcodes[testcode_index].test_code] = JSON.parse(testcodes[testcode_index].test_answer)
                // }
                const imageProcessTask = []
                assignmentCollectionUrl.forEach(assignment => {
                    //imageProcessTask.push(imageProcessing(test.test_id, test.test_config.paper_type, test_answer, assignment))
                    imageProcessTask.push(imageProcessing(test.test_id, test.test_config.paper_type, "", assignment))
                })
                res.status(200).json({success: true, message: "Request grade test successfully, the result will be send to your email"})
                res.end()
                try {

                    let result = await Promise.all(imageProcessTask)
                    var errorAssignmentCollection = []
                    let assignment_id = ""
                    for (var index = 0; index < result.length; index++) {
                        let resolve = result[index]
                        if (detectError(resolve) != "") {
                            var errorAssignment = resolve
                            errorAssignment.error = detectError(resolve)
                            errorAssignmentCollection.push(errorAssignment)
                        } else {
                            var assigntmentBody = {
                                image_url: resolve.url,
                                status: "new",
                                answer: JSON.stringify(resolve.result.answer)
                            }

                            let assignment = await AssignmentModel.create(assigntmentBody)
                            assignment_id = assignment.assignment_id
                            TestCodeModel.findOne({
                                where: {
                                    test_code: resolve.result.code_id,
                                    testTestId: resolve.test_id
                                }
                            }).then(testcode => {
                                if (testcode) {
                                    var tempAssignmentAnswer = JSON.parse(assignment.answer)
                                    var tempTestAnswer = JSON.parse(testcode.test_answer)

                                    if (Object.keys(tempAssignmentAnswer).length > Object.keys(tempTestAnswer).length) {
                                        for (var i = Object.keys(tempAssignmentAnswer).length; i >= Object.keys(tempTestAnswer).length + 1; i--) {
                                            var property = i + ""
                                            delete tempAssignmentAnswer[property]
                                        }
                                    }

                                    var result = diff(tempAssignmentAnswer, tempTestAnswer)
                                    var grade = countMatchPercentage(result)
                                    AssignmentModel.update({
                                        testCodeTestCodeId: testcode.test_code_id,
                                        grade: grade,
                                        status: "graded"
                                    }, {
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

                        }

                        if (+index === result.length - 1) {

                            TestModel.update({
                                status: 'graded',
                                graded_date: new Date()
                            }, {
                                where: {
                                    test_id: test.test_id
                                }
                            })

                            UserModel.findOne({
                                where: {
                                    user_id: userId
                                }
                            }).then(user => {
                                if (!user) { }
                                else {
                                    var message = messageParser(errorAssignmentCollection)
                                    sendMail(user.dataValues.mail, "Submit Assigment Completed", message)
                                }
                            })

                            // if (result.length == 1) {
                            //     if (errorAssignmentCollection.length === 0) {
                            //         var endTime = performance.now();
                            //         console.log(`Call to diff function took ${endTime - startTime} milliseconds`);
                            //         return apiResponse.successResponseWithData(res, "Grade test successfully!", { assignment_id: assignment_id })
                            //     } else {
                            //         switch (errorAssignmentCollection[0].error) {
                            //             case "TestCodeNull":
                            //                 return apiResponse.conflictResponseWithData(res, "Test code not found", resolve.draw_image);
                            //             case "TestCodeWrong":
                            //                 return apiResponse.conflictResponseWithData(res, "Wrong test code", resolve.draw_image)
                            //             case "StudentIdNull":
                            //                 return apiResponse.conflictResponseWithData(res, "Student id not found", resolve.draw_image)
                            //             case "StudentIdWrong":
                            //                 return apiResponse.conflictResponseWithData(res, "Student id wrong", resolve.draw_image)
                            //             default:
                            //                 return apiResponse.conflictResponseWithData(res, "Something wrong occurs", resolve.draw_image)
                            //         }
                            //     }

                            // } else {

                            //     var endTime = performance.now();
                            //     console.log(`Call to diff function took ${endTime - startTime} milliseconds`);
                            //     return apiResponse.successResponse(res, "Grade test successfully!")
                            // }
                        }
                    }
                } catch (err) {
                    console.log(err)
                    UserModel.findOne({
                        where: {
                            user_id: userId
                        }
                    }).then(user => {
                        if (!user) { }
                        else {
                            sendMail(user.dataValues.mail, "Grade test failed, please try again!", "")
                        }
                    })
                }
            } else {
                return apiResponse.badRequestResponse(res, "Test not exist!")
            }

        })

    } catch (ex) {
        return apiResponse.ErrorResponse(res, ex)
    }

}]



exports.exportTest = [auth, async function (req, res) {
    var testIdCollection = req.body.test_id
    var startDate = req.body.start_date ? req.body.start_date : null
    var endDate = req.body.end_date ? req.body.end_date : null
    var startGrade = req.body.start_grade ? req.body.start_grade : 0
    var endGrade = req.body.end_grade ? req.body.end_grade : 10
    // var userId = req.user.user_id
    if (!testIdCollection || testIdCollection.length === 0) {
        return apiResponse.badRequestResponse(res, "Test id is required")
    }
    try {
        const workbook = new excel.Workbook();
        if (testIdCollection.length > 0) {
            for (var testIndex = 0; testIndex < testIdCollection.length; testIndex++) {
                var test = await TestModel.findOne({
                    where: {
                        test_id: testIdCollection[testIndex]
                    }
                })
                if (!test) {
                    continue;
                } else {

                    const worksheet = workbook.addWorksheet(test.dataValues.test_name + " " + testIndex);
                    worksheet.columns = [
                        { header: 'Number', key: 'no' },
                        { header: 'Test Code', key: 'test_code' },
                        { header: 'Test Code Answer', key: 'test_answer' },
                        { header: 'Test Code Image', key: 'image_url_test_code' },
                        { header: 'Student Id', key: 'student_id' },
                        { header: 'Assignment Image', key: 'image_url_assignment' },
                        { header: 'Student Answer', key: 'student_answer' },
                        { header: 'Grade', key: 'grade' }
                    ];

                    let data = await TestCodeModel.findAll({
                        where: {
                            testTestId: test.dataValues.test_id
                        },

                    })
                    let rows = []
                    if (data.length > 0) {
                        let count = 0

                        if (startDate && endDate) {
                            var upperFilterTime = moment(endDate, "DD/MM/YYYY").format("LL")
                            var lowerFilterTime = moment(startDate, "DD/MM/YYYY").format("LL")
                        }

                        for (var i = 0; i < data.length; i++) {
                            let assignment = await AssignmentModel.findAll({
                                where: {
                                    testCodeTestCodeId: data[i].test_code_id
                                }
                            })
                            assignment = assignment.filter(function (t) {
                                return t.grade * 10 >= startGrade && t.grade * 10 <= endGrade
                            })
                            if (upperFilterTime && lowerFilterTime) {
                                assignment = assignment.filter(function (t) {
                                    var lookupDate = moment(t.dataValues.createdAt, "DD/MM/YYYY").format("LL")
                                    return (lookupDate <= upperFilterTime && lookupDate >= lowerFilterTime)
                                })
                            }
                            for (var j = 0; j < assignment.length; j++) {
                                count++
                                var row = {
                                    no: count,
                                    test_code: data[i].test_code,
                                    test_answer: data[i].test_answer,
                                    image_url_test_code: data[i].image_url,
                                    student_id: assignment[j].studentStudentId,
                                    image_url_assignment: assignment[j].image_url,
                                    student_answer: assignment[j].answer,
                                    grade: assignment[j].grade * 10
                                }
                                rows.push(row)
                            }
                        }

                    } else {
                        continue;
                    }

                    rows.forEach(row => {
                        worksheet.addRow(row);
                    })
                    worksheet.getRow(1).eachCell((cell) => {
                        cell.font = { bold: true };
                    });

                }

            }
            var fileName = 'export_test_grade.xlsx';

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
            workbook.xlsx.write(res).then(function () {
                res.end();
            });
        } else {
            return apiResponse.badRequestResponse(res, "No test to export")
        }
    } catch (ex) {
        return apiResponse.ErrorResponse(res, ex)
    }
}]


exports.getAllTestStatistics = [auth, async function (req, res) {
    var userId = req.user.user_id;
    var courseId = req.params.courseId;
    var step = req.query.step
    var size = req.query.size
    var page = req.query.page
    var conditionName = req.query.name
    var status = req.query.status
    const { limit, offset } = getPagination(page, size);

    var startDate = req.query.start_date ? req.query.start_date : null
    var endDate = req.query.end_date ? req.query.end_date : null
    if (!courseId || courseId === "") {
        return apiResponse.badRequestResponse(res, "Course id is required")
    }

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
                        where: { courseUserCourseUserId: courseuser.dataValues.course_user_id }
                        ,
                        limit: limit,
                        offset: offset,
                        include: [{
                            model: TestConfigModel, as: "test_config"
                        }, {
                            model: TestCodeModel, as: "test_codes"
                        }]
                    }).
                        then(async tests => {
                            if (tests.rows.length > 0) {
                                var testCollection = tests.rows
                                if (!conditionName || conditionName === "") {

                                } else {
                                    testCollection = testCollection.filter(function (t) {
                                        return (t.dataValues.test_name.includes(conditionName))
                                    })
                                }

                                if (startDate && startDate !== "") {
                                    var lowerFilterTime = moment(startDate, "DD/MM/YYYY").format("LL")
                                    testCollection = testCollection.filter(function (t) {
                                        var lookupDate = moment(t.dataValues.createdAt, "DD/MM/YYYY").format("LL")
                                        return (new Date(lookupDate) >= new Date(lowerFilterTime))
                                    })
                                }
                                if (endDate && endDate !== "") {
                                    var upperFilterTime = moment(endDate, "DD/MM/YYYY").format("LL")
                                    testCollection = testCollection.filter(function (t) {
                                        var lookupDate = moment(t.dataValues.createdAt, "DD/MM/YYYY").format("LL")
                                        return (new Date(lookupDate) <= new Date(upperFilterTime))
                                    })

                                }
                                if (status !== undefined && status !== "") {
                                    var testCollection = testCollection.filter(function (t) {
                                        return status === t.dataValues.status
                                    })
                                }

                                let testStatistics = []

                                for (let test_index = 0; test_index < testCollection.length; test_index++) {
                                    let unit = testCollection[test_index]
                                    let testcodes = await TestCodeModel.findAll({
                                        where: {
                                            testTestId: unit.dataValues.test_id
                                        },
                                        include: [{
                                            model: AssignmentModel, as: "assigments",
                                            required: true
                                        }]
                                    })
                                    let scoreCollection = []
                                    testcodes.forEach(testcode => {
                                        testcode.assigments.forEach(assigment => {
                                            scoreCollection.push(assigment.dataValues.grade * 10)
                                        })
                                    })

                                    let sir = {}

                                    for (let index = 0; index < 10; index = +index + +step) {
                                        let upper = +index + +step
                                        let lower = +index
                                        let label = +lower + "_" + +upper
                                        if (+upper == +10) {
                                            upper = 11
                                        }
                                        sir[label] = score_in_range(scoreCollection, lower, upper)
                                    }



                                    var body = {
                                        test_id: unit.dataValues.test_id,
                                        test_name: unit.dataValues.test_name,
                                        total_assignments: scoreCollection.length,
                                        average_score: average_score(scoreCollection),
                                        median_score: median_score(scoreCollection),
                                        noas_under_ten_percent: count_under_marked_score(scoreCollection, 1),
                                        noas_under_fifthty_percent: count_under_marked_score(scoreCollection, 5),
                                        noas_reach_hundred_percent: count_archive_marked_score(scoreCollection, 10),
                                        score_achived_by_most_assignment: highest_score_archived(scoreCollection),
                                        score_at_good: score_in_range(scoreCollection, 8, 11),
                                        score_at_rather: score_in_range(scoreCollection, 6.5, 8),
                                        score_at_medium: score_in_range(scoreCollection, 5, 6.5),
                                        score_at_weak: score_in_range(scoreCollection, 0, 5),
                                        score_in_range: sir
                                    }
                                    testStatistics.push(body)

                                }

                                return apiResponse.successResponseWithData(res, "Export statistic successfully", testStatistics)

                            } else {
                                return apiResponse.conflictResponse(res, "Test not existed")
                            }
                        })
                }
            })

    } catch (err) {

        return apiResponse.ErrorResponse(res, err)
    }

}]