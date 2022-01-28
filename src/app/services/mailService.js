const nodemailer = require('nodemailer');

const messageParser = (errorAssigmentCollection) => {
  let message = {}
  message.TestCodeNull = {}
  message.TestCodeWrong = {}
  message.StudentIdNull = {}
  message.StudentIdWrong = {}
  message.TestCodeNull.Number = 0
  message.TestCodeWrong.Number = 0
  message.StudentIdNull.Number = 0
  message.StudentIdWrong.Number = 0 
  message.TestCodeNull.Assignment= []
  message.TestCodeWrong.Assignment= []
  message.StudentIdWrong.Assignment= []
  message.StudentIdNull.Assignment= []

  errorAssigmentCollection.forEach(assignment => {
    switch(assignment.error) {
      case "TestCodeNull":
        message.TestCodeNull.Number += 1
        message.TestCodeNull.Assignment.push(assignment.url) 
        break;
      case "TestCodeWrong":
        message.TestCodeWrong.Number += 1
        message.TestCodeWrong.Assignment.push(assignment.url) 
        break;
      case "StudentIdNull":
        message.StudentIdNull.Number += 1
        message.StudentIdNull.Assignment.push(assignment.url) 
        break;
      case "StudentIdWrong":
        message.StudentIdWrong.Number += 1
        message.StudentIdWrong.Assignment.push(assignment.url) 
        break;
      default:
        // code block
    }
  })
  var returnMessage = "Đã hoàn thành chấm bài. "
  if(message.TestCodeNull.Number > 0)
  {
    var index = 1
    returnMessage += "\nCó " + message.TestCodeNull.Number.toString() + " bài không điền mã đề : "
    message.TestCodeNull.Assignment.forEach(assignment => {
        returnMessage +=  "\n \t" + index + ": " + assignment
        index ++
    })
  }else {
    if(message.TestCodeWrong.Number > 0){
        var index = 1
        returnMessage += "\n Có " + message.TestCodeWrong.Number.toString() + " bài điền sai mã đề : "
        message.TestCodeWrong.Assignment.forEach(assignment => {
            
            returnMessage += "\n \t "+ index + ": " + assignment
            index ++
        })
      }else {
        if(message.StudentIdNull.Number > 0) {
            var index = 1
            returnMessage += "\nCó " + message.StudentIdNull.Number.toString() + " học sinh, sinh viên không điền mã số học sinh sinh viên : "
            message.StudentIdNull.Assignment.forEach(assignment => {
              returnMessage += "\n \t "+ index + ": " + assignment
              index ++
          })
          }else {
            if(message.StudentIdWrong.Number > 0) {
                var index = 1
                returnMessage += "\nCó " + message.StudentIdWrong.Number.toString() + " học sinh, sinh viên điền sai mã số học sinh sinh viên : "
                message.StudentIdWrong.Assignment.forEach(assignment => {
                    returnMessage += "\n \t " + index + ": " + assignment
                    index ++
                })
              }else {
                returnMessage += "\n Tất cả các bài đều hợp lệ! \n Hãy truy cập vào ứng dụng để xem kết quả!"
              }
          }
      }
  }
  return returnMessage
}


const sendMail = (receiverGmail, subject, message) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'doantotnghiep.334.349.366@gmail.com',
          pass: 'D2H334349366'
        }
      });
      
      var mailOptions = {
        from: 'doantotnghiep.334.349.366@gmail.com',
        to: receiverGmail,
        subject: subject,
        text: message.toString()
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}


module.exports = {sendMail, messageParser}