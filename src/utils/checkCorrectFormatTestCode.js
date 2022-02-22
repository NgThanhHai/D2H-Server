module.exports = checkCorrectFormatTestCode = (str) => {
    if(/^\d+$/.test(str) && str.length == 3)
    {
        return true
    }else {
        return false
    }
}
