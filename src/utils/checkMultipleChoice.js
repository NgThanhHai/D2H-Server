module.exports = isMultipleChoice = (obj) => {
    for (const attr in obj) {

        if(Object.keys(obj[attr]).length > 1){
            return true
        }
    }
    return false;
}
