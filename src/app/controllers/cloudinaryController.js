const auth = require('./../../middlewares/jwt');
const fileUploader = require('./../../configs/cloudinary.config');
var excel = require('exceljs');

module.exports = [auth, async function(req, res) {
    if (!req.file) {
        return apiResponse.ErrorResponse(res, err)
      }else {
        const workbook = new excel.Workbook();
        await workbook.xlsx.load(req.file.data)
      }
      fileUploader.single('file')
    
      return apiResponse.successResponseWithData(res, "Success", {path: req.file.path})
}]