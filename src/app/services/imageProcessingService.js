const axios = require('axios');
const ImageProcessingBasicURL = require('../../utils/constants')

const imageProcessing = (test_id, type, answer, url) => {
    return new Promise(function (resolve, reject) {
        let postBody = JSON.stringify({
            test_id: test_id,
            type: +type,
            test_answer: answer,
            url: url
        })
        axios({
            method: 'post',
            url: ImageProcessingBasicURL,
            data: postBody
        }).then(response => {
            if (!response.data) {
                reject("Error when calling api!")
            } else {
                resolve(response.data)
            }
        });
    });
}

module.exports = imageProcessing