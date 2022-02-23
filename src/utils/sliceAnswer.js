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

module.exports = sliceAnswer = (obj1, obj2) => {
    if (Object.keys(obj1).length > Object.keys(obj2).length) {
        for (let index = Object.keys(obj1).length; index > Object.keys(obj2).length; index--) {
            delete obj1[index];
        }
    }
    return obj1
}
