const axios = require('axios');
const ImageProceesingURL = require('../../utils/constants')
const db = require('./../models');
const { countMatchPercentage, diff } = require('./../services/matchingServices')
const AssignmnetModel = db.Assignment;
const TestCodeModel = db.TestCode;
const TestModel = db.Test;
const StudentModel = db.Student;

const processImage = function (test_id, url) {

    return new Promise((resolve, reject) => {

        var postBody = JSON.stringify({
            test_id: test_id,
            url: url
        })

        axios({
            method: 'post',
            url: ImageProceesingURL,
            data: postBody
        }).then(response => {
            if (!response.data)
            {
                reject("Error when calling api!")
            }else {

                resolve(response.data)
            }
        })
        
    })
}

module.exports = processImage