const express = require('express');
const router = express.Router();
const fileUploader = require('../configs/cloudinary.config');
var apiResponse = require('../app/helpers/apiResponse');
router.post('/cloudinary-upload', fileUploader.single('file'), (req, res, next) => {
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

module.exports = router;