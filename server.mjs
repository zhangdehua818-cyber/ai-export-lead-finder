import express from "express";
import cors from "cors";


import { analyzeProduct } 
from "./modules/productAI.js";

import { searchCompanies }
from "./modules/companySearch.js";

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
"AI Export Lead Finder Ultimate V1.0"
);

});



app.get("/health",(req,res)=>{

res.json({

status:"ok",

version:"Ultimate V1.0"

});

});





app.post("/find-leads",async(req,res)=>{


const {

product,

country,

type

}=req.body;



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

version:
"Ultimate V1.0",


analysis,


customers,


excel


});



});





app.listen(3000,()=>{


console.log(

"AI Export Lead Finder Ultimate Running"

);


});
