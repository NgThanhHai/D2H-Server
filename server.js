const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const db = require('./src/app/models/index')
const indexRouter = require('./src/routes/index');
var apiResponse = require('./src/app/helpers/apiResponse');
const dotenv = require('dotenv').config();
if (dotenv.error) {
    throw dotenv.error;
}
//init createServer
const app = express();
const port = process.env.PORT || 3000

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'app/public')));


app.listen(port, () => console.log(`Server listen on port ${port}!`));


app.use('/api', indexRouter);

app.use("*", function(req, res) {
  return apiResponse.notFoundResponse(res, "Page not found");
})
app.use(express.static("public"))

// error handler
app.use(function(err, req, res, next) {
  if(err.name == "UnauthorizedError"){
    return apiResponse.unauthorizedResponse(res, err.message)
}
});


db.sequelize.sync();

module.exports = app;
