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
	var email = req.body.email
	var phone = req.body.phone
	try {
		UserModel.findOne({
			where : {
				 username: username
		   }
		})
		   .then((user) =>{
		   if(user){
			   return apiResponse.conflictResponse(res, "Username already exist")
		   }else {
				   bcrypt.hash(password, 10, (err, hash) => {
					   var newUser = {
						   username: username,
						   password: hash,
						   mail: email,
						   phone_number: phone,
						   role: `user`
					   }
		   
					   UserModel.create(newUser)
						   .then(data => {
							   let userData = {
								   user_id : data.user_id
							   }
							   const jwtPayload = userData;
							   const jwtData = {expiresIn: access_token_life};
							   const secret = access_token_secret;
							   userData.token = jwt.sign(jwtPayload, secret, jwtData);
							   userData.expire_time = ((new Date()).getTime() + access_token_life*60*60*1000).toLocaleString();
							   userData.user_id = data.user_id;
							   apiResponse.successResponseWithData(res, "Success", userData);
						   })
						   .catch(err => {
							   apiResponse.ErrorResponse(res, err);
					   })
					   
				   })
			   
		   }	   
	   })
	}catch(ex) {
		return apiResponse.ErrorResponse(res, ex)
	}  
}

exports.login = [
	check('username','Username must be specified').exists().isLength({min: 1}),
	check("password",'Password must be specified').exists().isLength({min: 1}),
	(req, res) => {
		var requsername = req.body.username ? req.body.username : null;
		var reqmail = req.body.email  ? req.body.email : null
		var condition = ""
		if(requsername){
			
			condition = { username: requsername} ;
		}else {
			condition = { mail : reqmail } ;
		}
		try{
			const errors = validationResult(req);
			if(!errors.isEmpty){
				return apiResponse.validationErrorWithData(res, "validation Error", errors.array());
			}
			else{
				UserModel.findOne({
                    where : condition
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
