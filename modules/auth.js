import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";


const SECRET =
"AI_EXPORT_V3_SECRET_KEY";




// 加密密码

export async function encryptPassword(password){


return await bcrypt.hash(

password,

10

);


}




// 验证密码

export async function comparePassword(password,hash){


return await bcrypt.compare(

password,

hash

);


}





// 创建登录Token

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




// 验证Token

export function verifyToken(token){


try{


return jwt.verify(

token,

SECRET

);


}

catch(error){


return null;


}


}
