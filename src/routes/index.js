const express = require('express');
var authRouter = require('./auth');
var userRouter = require('./users');
var courseRouter = require('./course');
const uploadRouter = require('./upload');
const testRouter = require('./test');

var app = express();

app.use("/auth", authRouter)
app.use("/user", userRouter)
app.use("/course", courseRouter)
app.use("/upload", uploadRouter)
app.use("/test", testRouter)

module.exports = app;
