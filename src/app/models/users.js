module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("User", {
    user_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
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
    role: {
      type: Sequelize.ENUM,
      values: ['user', 'admin'],
      allowNull: false
    }
  }, { timestamps: true }, {underscored: true});


  return User;
};