module.exports = (sequelize, Sequelize) => {
    const Statistic = sequelize.define("statistic", {
        statistic_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        average_score: {
            type: Sequelize.FLOAT
        },
        median_score: {
            type: Sequelize.FLOAT
        },
        noas_under_ten_percent: {
            type: Sequelize.INTEGER
        },
        noas_under_fifthty_percent: {
            type: Sequelize.INTEGER
        },
        noas_reach_hundred_percent: {
            type: Sequelize.INTEGER
        },
        score_achived_by_most_assignment: {
            type: Sequelize.FLOAT
        }
    }, {timestamps: true}, {underscored: true});

    return Statistic;
};