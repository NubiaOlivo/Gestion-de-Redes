const sql = require('mssql');
require('dotenv').config();

const config = {
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
server: process.env.DB_SERVER,
database: process.env.DB_DATABASE,
port: parseInt(process.env.DB_PORT || '1433', 10),
options: {
encrypt: false,
trustServerCertificate: true,
useUTC: false
},
pool: {
max: 10,
min: 0,
idleTimeoutMillis: 30000
}
};

const poolPromise = new sql.ConnectionPool(config)
.connect()
.then(pool => {
console.log('Conectado a SQL Server');
return pool;
})
.catch(err => console.log('DB Connection Error: ', err));

module.exports = { sql, poolPromise };