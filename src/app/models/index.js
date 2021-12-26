const { decodeBase64 } = require("bcryptjs");
const Sequelize = require("sequelize");
require('dotenv').config();
const sequelize = new Sequelize(process.env.DB, process.env.USER, process.env.PASSWORD, {
  host: process.env.DATABASE_HOST,
  logging: false,
  operatorsAliases: false,
  dialect: "mysql",
  dialectModule: require('mysql2'),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});


  const db = {};
  db.Sequelize = Sequelize;
  db.sequelize = sequelize;
  
  db.User = require("./users")(sequelize, Sequelize);
  db.Course = require("./course")(sequelize, Sequelize);
  db.CU = require("./courseuser")(sequelize, Sequelize);
  
  db.TestConfig = require("./testconfig")(sequelize, Sequelize);
  db.Statistic = require("./statistic")(sequelize, Sequelize);
  
  db.Assignment = require("./assignment")(sequelize, Sequelize);
  db.Student = require("./student")(sequelize, Sequelize);
  db.TestCode = require("./testcode")(sequelize, Sequelize);
  db.Test = require("./test")(sequelize, Sequelize);
  
  // relationship between course and user
  db.User.belongsToMany(db.Course, {
      through: "course_user",
      as : "course",
      foreignKey: "user_id"
    });
  
  db.Course.belongsToMany(db.User, {
    through: "course_user",
    as: "user",
    foreignKey: "course_id"
  })
  
  // relationship between course_user and test
  db.CU.hasMany(db.Test)
  db.Test.belongsTo(db.CU)
  // relationship between test_config and test
  db.Test.hasOne(db.TestConfig)
  db.TestConfig.belongsTo(db.Test)
  
  //relationship between test and statistic
  db.Test.hasOne(db.Statistic)
  db.Statistic.belongsTo(db.Test)
  
  // relationship between test and test_code
  db.Test.hasMany(db.TestCode)
  db.TestCode.belongsTo(db.Test)
  
  //relationship between test_code and assigment between
  db.TestCode.hasMany(db.Assignment)
  db.Assignment.belongsTo(db.TestCode)
  
  //relationship between assigment and student
  db.Assignment.belongsTo(db.Student)
  db.Student.hasMany(db.Assignment)
  




module.exports = db;