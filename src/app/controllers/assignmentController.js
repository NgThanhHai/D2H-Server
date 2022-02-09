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

exports.getAllAssignment = [auth, function (req, res) {
    let testId = req.body.test_id
    let courseId = req.body.course_id
    let userId = req.user.user_id
    let testCode = req.body.test_code
    var size = req.query.size
    var page = req.query.page

    const { limit, offset } = getPagination(page, size);
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
                    include: [{
                        model: CourseUserModel, as: "course_user",
                        required: true,
                        where: {
                            user_id: userId,
                            course_id: courseId
                        }
                    }]
                }).then(test => {
                    if (!test) {
                        return apiResponse.conflictResponse(res, "Test do not exist");
                    } else {
                        TestCodeModel.findOne({
                            where: {
                                testTestId: testId,
                                test_code: testCode
                            }
                        }).then(testcode => {
                            if (testcode) {
    
                                AssignmentModel.findAndCountAll({
                                    limit: limit,
                                    offset: offset,
                                    where : {
                                        testCodeTestCodeId: testcode.test_code_id
                                    }
                                }).then(assignments => {
                                    assignments.rows.forEach(assignment => {
                                        var objectAnswer = JSON.parse(assignment.dataValues.answer);
                                        assignment.dataValues.answer = objectAnswer
                                        assignment.dataValues = convertCase(assignment.dataValues)
                                    })
                                    return apiResponse.successResponseWithPagingData(res, "success", assignments.rows, getPagingData(page), assignments.count)
                                })
    
    
                            } else {
                                return apiResponse.badRequestResponse(res, "Test do not have test code")
                            }
                        })
                    }
                })
            }
        })
    }catch(ex) {
        return apiResponse.ErrorResponse(res, ex)
    }

}]