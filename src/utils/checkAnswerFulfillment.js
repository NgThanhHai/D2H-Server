module.exports = checkAnswerFulfillment = (obj) => {
    for (const attr in obj) {
        if(obj[attr] == "blank"){
            return false
        }
    }
    return true;
}
