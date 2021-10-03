const mysql = require('mysql')
require('dotenv').config();
initialize();

async function initialize() {
  var con = await mysql.createConnection({
    host: process.env.DATABASE_HOST || "127.0.0.1",
    user: process.env.USER || "root",
    password: process.env.PASSWORD || "123456haie",
    });

  await con.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB}\`;`);
} 