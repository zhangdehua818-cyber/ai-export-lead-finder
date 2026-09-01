import db from "./database.js";




export function createUser(email,password){


return new Promise((resolve,reject)=>{


db.run(

`

INSERT INTO users

(email,password,createdAt)

VALUES(?,?,?)

`,

[

email,

password,

new Date().toISOString()

],


function(err){


if(err)

reject(err);


else

resolve(this.lastID);



}


);



});



}







export function findUser(email){


return new Promise(resolve=>{


db.get(

`

SELECT *

FROM users

WHERE email=?

`,

[email],

(err,row)=>{


resolve(row);


}


);


});


}





export function getUserById(id){


return new Promise(resolve=>{


db.get(

`

SELECT *

FROM users

WHERE id=?

`,

[id],

(err,row)=>{


resolve(row);


}


);


});


}
