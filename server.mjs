import express from "express";
import cors from "cors";

import { generateSearch } from "./search.js";
import { searchCompanies } from "./companySearch.js";


const app = express();


app.use(cors());

app.use(express.json());



app.get("/",(req,res)=>{

res.send("AI Export Lead Finder V5.2 Running");

});



app.get("/health",(req,res)=>{

res.json({

status:"ok"

});

});





app.post("/find-leads",(req,res)=>{


const {

product,

country,

type

}=req.body;



// 搜索关键词

const searchData = generateSearch(

product,

country,

type

);



// 企业搜索

const companies = searchCompanies(

product,

country

);





const market = `

📊 市场分析


产品：

${product}


目标市场：

${country}


推荐客户：

✓ ${product}进口商

✓ ${product}分销商

✓ ${product}批发商



`;





const strategy = `

🎯 客户筛选策略


优先：

✓ 官网存在

✓ 有采购需求

✓ 产品相关


开发重点：

✓ 工厂优势

✓ OEM能力

✓ 交付能力



`;






const channels = `

🌍 开发渠道


Google

LinkedIn

Europages

Kompass

行业目录



`;






const mail = `

✉️ AI开发信


Subject:

${product} Cooperation Opportunity



Dear Purchasing Manager,


We are a manufacturer specializing in ${product}.


We provide:

- Factory price

- OEM service

- Stable supply


Looking for cooperation opportunities in ${country}.



Best regards



`;






res.json({


product,

country,


market,


keywords:
searchData.keywords,


channels,


strategy,


mail,


leads:
companies



});



});





app.listen(3000,()=>{


console.log(

"AI Export Lead Finder V5.2 running"

);


});
