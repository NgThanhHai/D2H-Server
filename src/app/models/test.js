module.exports = (sequelize, Sequelize) => {
    const Test = sequelize.define("test", {
        test_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        test_name: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.ENUM,
            values: ['new', 'graded', 'closed']
        },
        graded_date: {
            type: Sequelize.DATE(6)
        }
    }, {timestamps: true}, {underscored: true})

    return Test;
}