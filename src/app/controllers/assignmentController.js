const db = require('./../models');
const CourseUserModel = db.CU;
const TestConfigModel = db.TestConfig;
const TestCodeModel = db.TestCode;
const AssignmentModel = db.Assignment;
const TestModel = db.Test;
const StudentModel = db.Student;
const auth = require('./../../middlewares/jwt');
var apiResponse = require('./../helpers/apiResponse');
const getPagingData = require('./../helpers/pagingData')
const getPagination = require('./../helpers/pagination')
const convertCase = require('../../utils/convertCase');
const moment = require('moment');

exports.getAllAssignment = [auth, function (req, res) {
    let testId = req.body.test_id
    let courseId = req.body.course_id
    let testCode = req.body.test_code
    let userId = req.user.user_id
    var size = req.query.size
    var page = req.query.page

    let startGrade = req.query.start_grade ? req.query.start_grade : 0
    let endGrade = req.query.end_grade ? req.query.end_grade : 10

    let startDate = req.query.start_date ? req.query.start_date : null
    let endDate = req.query.end_date ? req.query.end_date : null

    let studentId = req.query.student_id ? req.query.student_id : null

    const { limit, offset } = getPagination(page, size);
    if(!testId || testId === "")
    {
        return apiResponse.badRequestResponse(res, "Test id is required")
    }
    if(!courseId || courseId === "")
    {
        return apiResponse.badRequestResponse(res, "Course id is required")
    }
    try {
        CourseUserModel.findOne({
            where: {
                course_id: courseId,
                user_id: userId
            }
        }).then(courseuser => {
            if (!courseuser) {
                return apiResponse.badRequestResponse(res, "Course do not exist or you do not have permission to access")
            } else {
                TestModel.findOne({
                    where: {
                        test_id : testId
                    },
                    include: [{
                        model: CourseUserModel, as: "course_user",
                        required: true,
                        where: {
                            user_id: userId,
                            course_id: courseId
                        }
                    }]
                }).then( async test => {
                    if (!test) {
                        return apiResponse.conflictResponse(res, "Test do not exist");
                    } else {

                        let testcodes = await TestCodeModel.findAll({
                            where: {
                                testTestId: test.test_id
                            }
                        })
                        if (testcodes.length !== 0) {
                            if(!testCode || testCode === "")
                            {}else {
                                testcodes = testcodes.filter(function (t) {
                                    return t.test_code.toString() === testCode.toString()
                                })
                            }
                            
                            var assignmentsCollection = []
                            for(var index = 0; index < testcodes.length; index++) {
                                let assignments = await AssignmentModel.findAndCountAll({
                                    limit: limit,
                                    offset: offset,
                                    where : {
                                        testCodeTestCodeId: testcodes[index].test_code_id
                                    }
                                })
                                for(var indexAssignment = 0; indexAssignment <  assignments.rows.length; indexAssignment++)
                                {
                                    let assignment = assignments.rows[indexAssignment]
                                    var objectAnswer = JSON.parse(assignment.dataValues.answer);
                                    assignment.dataValues.answer = objectAnswer
                                    assignment.dataValues = convertCase(assignment.dataValues)
                                    assignment.dataValues.test_code = testcodes[index].test_code
                                    delete assignment.dataValues.testCodeTestCodeId
                                    assignment.dataValues.student_id = assignment.dataValues.studentStudentId
                                    delete assignment.dataValues.studentStudentId
                                    assignment.dataValues.grade = assignment.dataValues.grade*10
                                    assignmentsCollection.push(assignment)
                                    
                                }
                            }
                            if (startDate && startDate !== "") {
                                var lowerFilterTime = moment(startDate, "DD/MM/YYYY").format("LL")
                                assignmentsCollection = assignmentsCollection.filter(function (t) {
                                    var lookupDate = moment(t.dataValues.created_at, "DD/MM/YYYY").format("LL")
                                    return (new Date(lookupDate) >= new Date(lowerFilterTime))
                                })
                            }
                            if (endDate && endDate !== "") {
                                var upperFilterTime = moment(endDate, "DD/MM/YYYY").format("LL")
                                assignmentsCollection = assignmentsCollection.filter(function (t) {
                                    var lookupDate = moment(t.dataValues.created_at, "DD/MM/YYYY").format("LL")
                                    return (new Date(lookupDate) <= new Date(upperFilterTime))
                                })

                            }
                            assignmentsCollection = assignmentsCollection.filter(function (t) {
                                return t.grade  >= startGrade && t.grade <= endGrade
                            })
                            if(studentId && studentId !== "")
                            {
                                assignmentsCollection = assignmentsCollection.filter(function (t) {
                                    return t.student_id === studentId.toString()
                                })
                            }
                            return apiResponse.successResponseWithPagingData(res, "success", assignmentsCollection , getPagingData(page), assignmentsCollection.length)

                        } else {
                            return apiResponse.badRequestResponse(res, "Test do not have test code")
                        }
                    }
                })
            }
        })
    }catch(ex) {
        return apiResponse.ErrorResponse(res, ex)
    }

}]


exports.getAssignment = [auth, function (req, res) {
    let testId = req.body.test_id
    let courseId = req.body.course_id
    let testCode = req.body.test_code
    let userId = req.user.user_id
    let assignmentId = req.body.assignment_id
    var size = req.query.size
    var page = req.query.page

    const { limit, offset } = getPagination(page, size);
    if(!testId || testId === "")
    {
        return apiResponse.badRequestResponse(res, "Test id is required")
    }
    if(!courseId || courseId === "")
    {
        return apiResponse.badRequestResponse(res, "Course id is required")
    }
    try {
        CourseUserModel.findOne({
            where: {
                course_id: courseId,
                user_id: userId
            }
        }).then(courseuser => {
            if (!courseuser) {
                return apiResponse.badRequestResponse(res, "Course do not exist or you do not have permission to access")
            } else {
                TestModel.findOne({
                    where: {
                        test_id : testId
                    },
                    include: [{
                        model: CourseUserModel, as: "course_user",
                        required: true,
                        where: {
                            user_id: userId,
                            course_id: courseId
                        }
                    }]
                }).then( async test => {
                    if (!test) {
                        return apiResponse.conflictResponse(res, "Test do not exist");
                    } else {

                        let testcodes = await TestCodeModel.findAll({
                            where: {
                                testTestId: test.test_id
                            }
                        })
                        if (testcodes.length !== 0) {
                            if(!testCode || testCode === "")
                            {}else {
                                testcodes = testcodes.filter(function (t) {
                                    return t.test_code.toString() === testCode.toString()
                                })
                            }
                            var assignmentsCollection = []
                            for(var index = 0; index < testcodes.length; index++) {
                                let assignment = await AssignmentModel.findOne({
                                    limit: limit,
                                    offset: offset,
                                    where : {
                                        testCodeTestCodeId: testcodes[index].test_code_id,
                                        assignment_id: assignmentId
                                    }
                                })
                                
                                    var objectAnswer = JSON.parse(assignment.dataValues.answer);
                                    assignment.dataValues.answer = objectAnswer
                                    assignment.dataValues = convertCase(assignment.dataValues)
                                    assignment.dataValues.test_code = testcodes[index].test_code
                                    delete assignment.dataValues.testCodeTestCodeId
                                    assignment.dataValues.student_id = assignment.dataValues.studentStudentId
                                    delete assignment.dataValues.studentStudentId
                                    assignmentsCollection.push(assignment)
                                
                            }
                            
                            return apiResponse.successResponseWithPagingData(res, "success", assignmentsCollection , getPagingData(page), assignmentsCollection.length)

                        } else {
                            return apiResponse.badRequestResponse(res, "Test do not have test code")
                        }
                    }
                })
            }
        })
    }catch(ex) {
        return apiResponse.ErrorResponse(res, ex)
    }

}]

