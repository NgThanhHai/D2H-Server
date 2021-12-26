module.exports = (sequelize, Sequelize) => {
    const Assignment = sequelize.define("assigment", {
        assignment_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        answer: {
            type: Sequelize.STRING(5000)
        },
        grade: {
            type: Sequelize.FLOAT
        },
        status: {
            type: Sequelize.ENUM,
            values: ['new', 'graded']
        },
        image_url: {
            type: Sequelize.STRING
        }
    }, {timestamps: true}, {underscored: true})
    return Assignment;
}