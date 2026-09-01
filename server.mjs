import express from "express";
import cors from "cors";


import { analyzeProduct } 
from "./modules/productAI.js";

import { searchCompanies } 
from "./companySearch.js";

import { scoreCompany } 
from "./modules/scoring.js";

import { findContact } 
from "./modules/emailFinder.js";

import { generateEmail } 
from "./modules/emailWriter.js";

import { addCustomer } 
from "./modules/crm.js";

import { exportLeads } 
from "./modules/exportExcel.js";



const app = express();


app.use(cors());

app.use(express.json());



app.get("/",(req,res)=>{

res.send(
"AI Export Lead Finder V8 Running"
);

});



app.get("/health",(req,res)=>{

res.json({

status:"ok",

version:"V8"

});

});





app.post("/find-leads",(req,res)=>{


const {

product,

country,

type

}=req.body;



// 1 产品分析

const productInfo =

analyzeProduct(

product,

country

);




// 2 企业搜索

let companies =

searchCompanies(

product,

country

);





// 3 客户增强

companies = companies.map(company=>{



const score =

scoreCompany(company);



const contact =

findContact(

company.company,

country

);



const email =

generateEmail(

product,

country,

company.company

);



const customer = {


...company,


...contact,


score:

score.level,


scoreNumber:

score.score,


reason:

score.reason,


emailTemplate:

email,


status:

"未联系"



};



// 保存CRM

addCustomer(customer);



return customer;



});





// Excel数据

const excel =

exportLeads(

companies

);





res.json({


version:"V8",


productInfo,


customers:companies,


excel



});



});





app.listen(3000,()=>{


console.log(

"AI Export Lead Finder V8 Running"

);


});
