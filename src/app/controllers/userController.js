var Buffer = require('buffer/').Buffer
const db = require('./../models');
const UserModel = db.User;
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
var apiResponse = require('./../helpers/apiResponse');
const auth = require('./../../middlewares/jwt');
const cloneDeep = require('../../utils/cloneDeep')

var { access_token_secret, access_token_life, refresh_token_secret, refresh_token_life } = require('./../../configs/auth/index');

function parseJwt(token) {
    var base64Payload = token.split('.')[1];
    var payload = Buffer.from(base64Payload, 'base64');
    return JSON.parse(payload.toString());
}

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
                console.log(newUser)

                delete newUser.password
                newUser.email = newUser.mail
                delete newUser.mail
                newUser.phone = newUser.phone_number
                delete newUser.phone_number
                newUser.createdAt = user.dataValues.createdAt
                newUser.updatedAt = user.dataValues.updatedAt
                return apiResponse.successResponseWithData(res, "Success", newUser)
            } else {
                return apiResponse.ErrorResponse(res, "Id not found")
            }
        })
    } catch (ex) {
        return apiResponse.ErrorResponse(res, "Cannot get information")
    }
}]