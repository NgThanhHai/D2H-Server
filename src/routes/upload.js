const express = require('express');
const router = express.Router();
const fileUploader = require('../configs/cloudinary.config');
const upload = require('../configs/configexcel');
var apiResponse = require('../app/helpers/apiResponse');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

router.post('/cloudinary-upload', fileUploader.single('file'), (req, res, next) => {
  console.log(req.file)
  if (!req.file) {
    return apiResponse.ErrorResponse(res, err)
  }
  

  return apiResponse.successResponseWithData(res, "Success", {path: req.file.path})
});

router.post('/cloudinary-upload-multiple', fileUploader.array('file', 12), (req, res, next) => {
  if (!req.file) {
    return apiResponse.ErrorResponse(res, err)
  }
  

  return apiResponse.successResponseWithData(res, "Success", {path: req.file.path})
});

router.post('/cloudinary-upload-excel',  upload.single("file"), (req, res, next) => {
  if (!req.file) {
    return apiResponse.ErrorResponse(res, err)
  }
  cloudinary.uploader.upload(__basedir + "/Result-template.xlsx", 
  { resource_type: "raw" }, 
  function(error, result) {

    return apiResponse.successResponseWithData(res, "Success", {path: result.url})
  });
  
  
  

});

module.exports = router;