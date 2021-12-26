module.exports = (sequelize, Sequelize) => {
    const TestCode = sequelize.define("test_code", {
        test_code_id: {
            field: 'test_code_id',
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        test_code: {
            field: 'test_code',
            type: Sequelize.STRING,
            allowNull: false
        },
        test_answer: {
            field: 'test_answer',
            type: Sequelize.STRING(5000),
        },
        image_url: {
            field: 'image_url',
            type: Sequelize.STRING
        }
    }, {timestamps: true}, {underscored: true});

    return TestCode;
}