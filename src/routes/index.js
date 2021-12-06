const express = require('express');
var authRouter = require('./auth');
var userRouter = require('./users');
var courseRouter = require('./course');

var app = express();

app.use("/auth", authRouter)
app.use("/user", userRouter)
app.use("/course", courseRouter)


module.exports = app;
