const db = require('./../models');
const CourseUserModel = db.CU;
const TestConfigModel = db.TestConfig;
const TestCodeModel = db.TestCode;
const AssignmentModel = db.Assignment;
const TestModel = db.Test;
const StudentModel = db.Student;
const auth = require('./../../middlewares/jwt');
var apiResponse = require('./../helpers/apiResponse');

exports.getAllAssignment = [auth, function (req, res) {
    let testId = req.body.test_id
    let courseId = req.body.course_id
    let userId = req.user.user_id

    CourseUserModel.findOne({
        where: {
            course_id: courseId,
            user_id: userId
        }
    }).then(courseuser => {
        if(!courseuser) {
            return apiResponse.badRequestResponse(res, "Course do not exist or you do not have permission to access")
        }else {
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
                if(!test) {
                    return apiResponse.badRequestResponse(res, "Test do not exist");
                }else {
                    TestCodeModel.findAll({ 
                        where: {
                            testTestId : testId
                        },
                        include: [{
                            model: AssignmentModel, as: "assigments",
                            required: true,
                            where: {
                                status : "graded"
                            }
                        }]
                    }).then(testcodeCollection => {
                        if(testcodeCollection.length > 0)
                        {
                            testcodeCollection.forEach(testcode => {
                                var testAnswer = JSON.parse(testcode.dataValues.test_answer);
                                testcode.dataValues.test_answer = testAnswer
                                testcode.dataValues.assigments.forEach(assignment => {
                                    var assignmentAnswer = JSON.parse(assignment.dataValues.answer)
                                    assignment.dataValues.answer = assignmentAnswer
                                })
                            })
                            
                            return apiResponse.successResponseWithData(res, "success" ,testcodeCollection)

                        }else {
                            return apiResponse.badRequestResponse(res, "Test do not have test code")
                        }
                    })
                }
            })
        }
    })



}]