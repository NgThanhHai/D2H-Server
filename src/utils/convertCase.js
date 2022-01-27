module.exports = convertCase = (obj) => {
    obj.updated_at = obj.updatedAt
    obj.created_at = obj.createdAt
    delete obj.updatedAt
    delete obj.createdAt
    return obj
}