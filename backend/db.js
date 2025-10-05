// db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ram@3010',
  database: 'needfeed',
  waitForConnections: true,
  connectionLimit: 10,   // max 10 simultaneous connections
  queueLimit: 0
});

// Use promise-based API for easier async/await queries
const db = pool.promise();

module.exports = db;
