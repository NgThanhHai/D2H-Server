var apiResponse = require('./../helpers/apiResponse')
var jwt = require('jsonwebtoken')

module.exports = {
    isAdmin : (req, res, next ) =>{
        var token = req.headers['authorization'].split(' ')[1]
        var decoded = jwt.decode(token)
        if(decoded.role == 4){
            next()
        }
        else{
            return apiResponse.forbiddenResponse(res)
        }
    }
}