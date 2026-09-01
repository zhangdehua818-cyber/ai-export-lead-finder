import db from "./database.js";



export function createOrder(userId,plan,amount){


return new Promise(resolve=>{


db.run(

`

INSERT INTO orders

(user_id,plan,amount,status,createdAt)

VALUES(?,?,?,?,?)

`,

[

userId,

plan,

amount,

"pending",

new Date().toISOString()

],


function(){


resolve(this.lastID);


}


);



});



}






export function upgradeVIP(userId){


return new Promise(resolve=>{


db.run(

`

UPDATE users

SET vip='pro'

WHERE id=?

`,

[userId],

()=>{


resolve(true);


}


);



});


}
