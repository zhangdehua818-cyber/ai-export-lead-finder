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
"AI Export Lead Finder V9 Running"
);


});





app.get("/health",(req,res)=>{


res.json({

status:"ok",

version:"V9"

});


});







app.post("/find-leads",async(req,res)=>{


const {


product,

country,

type


}=req.body;





// 产品分析

const productInfo =

analyzeProduct(

product,

country

);







// 企业搜索

let companies =

await searchCompanies(

product,

country

);







// 企业增强

let customers = [];





for(const company of companies){



const score =

scoreCompany(company);





const contact =

await findContact(

company.company,

company.website,

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





addCustomer(customer);



customers.push(customer);



}







const excel =

exportLeads(

customers

);







res.json({



version:"V9",



productInfo,



customers,



excel



});





});







app.listen(3000,()=>{


console.log(

"AI Export Lead Finder V9 Running"

);


});
