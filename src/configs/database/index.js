const mysql = require('mysql')

initialize();

async function initialize() {
  var con = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.USER,
    password: process.env.PASSWORD
    });

  await con.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB}\`;`);
}