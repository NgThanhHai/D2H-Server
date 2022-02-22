const axios = require('axios');
const ImageProcessingBasicURL = require('../../utils/constants')

const imageProcessing = (test_id, type, answer, isMC, url) => {
    
    return new Promise(function (resolve, reject) {
        let postBody = JSON.stringify({
            test_id: test_id,
            type: +type,
            test_answer: answer,
            is_mc: isMC,
            url: url
        })
        
        let convertedBody = postBody.replace(/'/g, '"');
        axios({
            method: 'post',
            url: ImageProcessingBasicURL,
            data: convertedBody
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