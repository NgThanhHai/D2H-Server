module.exports = (sequelize, Sequelize) => {
    const Student = sequelize.define("student", {
        
        student_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        student_id: {
            type: Sequelize.STRING,
            allowNull: false, 
            primaryKey: true,
        },
        mail: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate : {
                isEmail: true
            }
        },
        phone_number: {
            type: Sequelize.STRING
        },
    }, {timestamps: true}, {underscored: true});

    return Student;
}