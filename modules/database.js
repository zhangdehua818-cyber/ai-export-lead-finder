import sqlite3 from "sqlite3";


const db = new sqlite3.Database(
"./app.db"
);



db.serialize(()=>{


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
