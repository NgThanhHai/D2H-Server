const db = require('./../models');
const UserModel = db.User;
const jwt = require('jsonwebtoken')
const {check, validationResult, sanitize} = require('express-validator/check');
var bcrypt = require('bcrypt')
var apiResponse = require('./../helpers/apiResponse')
var {access_token_secret, access_token_life, refresh_token_secret, refresh_token_life} = require('./../../configs/auth/index');


exports.register = (req, res) => {
    var data = {
        status: 1,
        message: "api"
    };
    return res.status(404).json(data)
}

exports.signUp = function(req, res) {
    var username = req.body.username
    var password = req.body.password

    UserModel.findOne({
         where : {
              username: username
        }
     })
        .then((user, err) =>{
        if(user){
            return apiResponse.conflictResponse(res, "Username already exist")
        }
        if(err){
            return apiResponse.ErrorResponse(res, err)
        }

        bcrypt.hash(password, 10, (err, hash) => {
            var newUser = {
                username: username,
                password: hash,
                mail: `${username}@d2h.com`,
				phone_number: `12312312312`,
				role: `user`
            }

            UserModel.create(newUser)
                .then(data => {
                    let userData = {
						_id : data._id
					}
					const jwtPayload = userData;
					const jwtData = {expiresIn: access_token_life};
					const secret = access_token_secret;
					userData.token = jwt.sign(jwtPayload, secret, jwtData);
					apiResponse.successResponseWithData(res, "Success", userData);
                })
                .catch(err => {
                    apiResponse.unauthorizedResponse(res, "Somethings wrong occurs");
            })
            
        })
    })
}

exports.login = [
	check('username','Username must be specified').exists().isLength({min: 1}),
	check("password",'Password must be specified').exists().isLength({min: 1}),
	(req, res) => {

		try{
			const errors = validationResult(req);
			if(!errors.isEmpty){
				return apiResponse.validationErrorWithData(res, "validation Error", errors.array());
			}
			else{
				UserModel.findOne({
                    where : {
						username: req.body.username
					}
                    })
					.then(user =>{
					if(user){
						bcrypt.compare(req.body.password, user.password, (err, same) => {
							if(same){
								if(!user.isBlocked){
									let userData = {
										user_id : user.user_id
									}
									const jwtPayload = userData;
									const jwtData = {expiresIn: access_token_life};
									const secret = access_token_secret;
									userData.token = jwt.sign(jwtPayload, secret, jwtData);
									return apiResponse.successResponseWithData(res, "Success", userData);
								}
								else{
									return apiResponse.unauthorizedResponse(res, "Account is blocked. Please contact admin");
								}
							}else{
								return apiResponse.unauthorizedResponse(res, "User or password wrong")
							}	
						})
					}
					else{
						return apiResponse.unauthorizedResponse(res, "User or password wrong")
					}
				})
			}
		}catch(err){
			return apiResponse.ErrorResponse(res, err);
		}
	}]
