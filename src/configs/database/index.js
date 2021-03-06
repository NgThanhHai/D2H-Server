const mysql = require('mysql')
require('dotenv').config();
initialize();

async function initialize() {
  var con = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    });

  con.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB}\`;`);
} 