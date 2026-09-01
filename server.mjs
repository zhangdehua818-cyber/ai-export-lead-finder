import express from "express";
import cors from "cors";


import {
encryptPassword,
comparePassword,
createToken
}
from "./modules/auth.js";


import {
createUser,
findUser
}
from "./modules/users.js";


import {
checkMembership
}
from "./modules/membership.js";


import {
analyzeProduct
}
from "./modules/productAI.js";


import {
searchCompanies
}
from "./companySearch.js";


import {
scoreCompany
}
from "./modules/scoring.js";


import {
findContact
}
from "./modules/emailFinder.js";


import {
generateEmail
}
from "./modules/emailWriter.js";


import {
addCustomer
}
from "./modules/crm.js";


import {
exportLeads
}
from "./modules/exportExcel.js";



import {
verifyToken
}
from "./modules/auth.js";



const app = express();



app.use(cors());

app.use(express.json());



// 首页

app.get("/",(req,res)=>{


res.send(

"AI外贸客户开发助手 V3.0 SaaS Running"

);


});




// 健康检测

app.get("/health",(req,res)=>{


res.json({

status:"ok",

version:"V3.0"

});


});





// 注册

app.post("/register",async(req,res)=>{


const {

email,

password

}=req.body;



try{


const hash =

await encryptPassword(password);



const id =

await createUser(

email,

hash

);



res.json({

success:true,

id

});



}catch(e){



res.json({

success:false,

message:"注册失败，邮箱可能已存在"

});


}



});






// 登录

app.post("/login",async(req,res)=>{


const {

email,

password

}=req.body;



const user =

await findUser(email);



if(!user){


return res.json({

success:false,

message:"用户不存在"

});


}




const ok =

await comparePassword(

password,

user.password

);




if(!ok){


return res.json({

success:false,

message:"密码错误"

});


}




const token =

createToken(user);



res.json({

success:true,

token,

user:{

email:user.email,

vip:user.vip

}


});



});







// 获取客户

app.post("/find-leads",async(req,res)=>{


const {

token,

product,

country

}=req.body;





const user =

verifyToken(token);



if(!user){


return res.json({

message:"请登录"

});


}






const permission =

checkMembership(user);



if(!permission.allow){


return res.json(permission);


}




const analysis =

analyzeProduct(

product,

country

);




const companies =

await searchCompanies(

product,

country

);




let customers=[];



for(const company of companies){



const score =

scoreCompany(company);




const contact =

await findContact(

company,

country

);




const email =

generateEmail(

product,

country,

company.company

);





const customer={



...company,



...contact,



score:score.level,



scoreNumber:score.score,



reason:score.reason,



emailTemplate:email,



status:"未联系"



};




addCustomer(customer);



customers.push(customer);



}




const excel =

exportLeads(customers);



res.json({

version:"V3.0",

analysis,

customers,

excel,

remaining:

permission.limit-1


});



});






app.listen(3000,()=>{


console.log(

"AI Export Lead Finder V3 Running"

);


});
