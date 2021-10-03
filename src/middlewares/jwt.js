const jwt = require('express-jwt')
const secret = require('./../configs/auth/index')

const authenticate = jwt({
    secret: secret.secret,
    algorithms: ['HS256']
});

module.exports = authenticate