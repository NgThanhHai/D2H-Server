module.exports = (sequelize, Sequelize) => {
    const Course = sequelize.define("Course", {
        course_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        course_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        course_code: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        }
    }, {timestamps: true}, {underscored: true});
    return Course
}