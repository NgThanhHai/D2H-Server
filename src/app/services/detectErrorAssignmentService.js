const detectError = function (assigment) {
    let isTestCodeValid = /^\d+$/.test(assigment.result.code_id);
    let isStudentIdValid = /^\d+$/.test(assigment.result.student_id);
    if(assigment.result.code_id.length  == 0)
    {
        return "TestCodeNull"
    }
    if(!isTestCodeValid)
    {
        return "TestCodeWrong"
    }
    if(assigment.result.student_id.length == 0){
        return "StudentIdNull"
    }
    if(!isStudentIdValid)
    {
        return "StudentIdWrong"
    }  

    return ""
}

module.exports = detectError