module.exports = sliceAnswer = (obj) => {
    for (let index = Object.keys(obj).length; index > 0; index--) {
        if (obj[index] == "blank") {
            delete obj[index];
        } else {
            return obj
        }
    }

    return obj
}

