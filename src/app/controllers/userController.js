
const db = require('./../models');
const UserModel = db.User;
const jwt = require('jsonwebtoken');
var apiResponse = require('./../helpers/apiResponse');
const auth = require('./../../middlewares/jwt');
const cloneDeep = require('../../utils/cloneDeep')



exports.getMyInfo = [auth, function (req, res) {

    var token = req.headers['authorization'].split(' ')[1]
    var decoded = jwt.decode(token)
    try {
        UserModel.findOne( { 
            where: {
                user_id : decoded.user_id
            }

        }).then(user => {
            if (user) {
                const newUser = cloneDeep(user.dataValues)

                delete newUser.password
                newUser.email = newUser.mail
                delete newUser.mail
                newUser.phone = newUser.phone_number
                delete newUser.phone_number
                newUser.created_at = user.dataValues.createdAt
                newUser.updated_at = user.dataValues.updatedAt
                delete newUser.createdAt
                delete newUser.updatedAt
                return apiResponse.successResponseWithData(res, "Success", newUser)
            } else {
                return apiResponse.ErrorResponse(res, "Id not found")
            }
        })
    } catch (ex) {
        return apiResponse.ErrorResponse(res, "Cannot get information")
    }
}]