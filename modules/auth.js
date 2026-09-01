import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";


const SECRET="AI_EXPORT_V3_SECRET";



export async function encryptPassword(password){


return await bcrypt.hash(

password,

10

);


}




export async function comparePassword(password,hash){


return await bcrypt.compare(

password,

hash

);


}





export function createToken(user){


return jwt.sign(

{

id:user.id,

email:user.email,

vip:user.vip

},

SECRET,

{

expiresIn:"7d"

}

);


}




export function verifyToken(token){


try{


return jwt.verify(

token,

SECRET

);


}

catch(e){

return null;

}


}
