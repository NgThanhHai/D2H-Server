module.exports = (sequelize, Sequelize) => {
    const CU = sequelize.define("course_user", {
      course_user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      }
    }, {timestamps: true}, {underscored: true});
  
    
  return CU;
  };