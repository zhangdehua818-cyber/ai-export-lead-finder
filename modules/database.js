import sqlite3 from "sqlite3";


const db = new sqlite3.Database(
"./database/app.db"
);



db.serialize(()=>{


// 用户表

db.run(`

CREATE TABLE IF NOT EXISTS users(

id INTEGER PRIMARY KEY AUTOINCREMENT,

email TEXT UNIQUE,

password TEXT,

vip TEXT DEFAULT 'free',

expire TEXT,

searchCount INTEGER DEFAULT 3,

createdAt TEXT

)

`);



// 客户线索表

db.run(`

CREATE TABLE IF NOT EXISTS leads(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER,

company TEXT,

country TEXT,

website TEXT,

email TEXT,

score INTEGER,

status TEXT,

createdAt TEXT

)

`);




// 订单表

db.run(`

CREATE TABLE IF NOT EXISTS orders(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER,

plan TEXT,

amount INTEGER,

status TEXT,

createdAt TEXT

)

`);



});



export default db;
