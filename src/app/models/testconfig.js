module.exports = (sequelize, Sequelize) => {
    const TestConfig = sequelize.define("test_config", {
        test_config_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        is_multiple_choice: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
        },
        total_number_of_question: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        paper_type: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    }, {timestamps: true}, {underscored: true});
    
    return TestConfig;
}