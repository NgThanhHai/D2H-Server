const express = require('express');
var authRouter = require('./auth');
var userRouter = require('./users');
var courseRouter = require('./course');
const uploadRouter = require('./upload');

var app = express();

app.use("/auth", authRouter)
app.use("/user", userRouter)
app.use("/course", courseRouter)
app.use("/upload", uploadRouter)

module.exports = app;
