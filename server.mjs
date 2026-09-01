import express from "express";
import cors from "cors";

import { generateSearch } from "./search.js";


const app = express();


app.use(cors());

app.use(express.json());



app.get("/",(req,res)=>{

res.send("AI Export Lead Finder V5.1 Running");

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




// 调用搜索模块

const searchData = generateSearch(

product,

country,

type

);





const market = `

📊 市场分析


产品：

${product}


目标国家：

${country}



推荐客户：

✓ ${product}进口商

✓ ${product}批发商

✓ ${product}经销商



`;






const strategy = `

🎯 客户筛选策略


优先寻找：

1. 有采购页面的网站

2. 有进口业务的企业

3. 同行业分销商


开发重点：

✓ 中国供应链

✓ OEM能力

✓ 价格优势

✓ 稳定交付



`;





const channels = `

🌍 推荐开发渠道


Google

LinkedIn

Europages

Kompass

行业协会网站



`;






const mail = `

✉️ AI开发信


Subject:

${product} Supplier Cooperation Opportunity



Dear Purchasing Manager,


We are a professional manufacturer specializing in ${product}.


We provide:

- Factory direct price

- OEM service

- Stable supply


We are looking for partners in ${country}.


Looking forward to cooperation.



Best regards



`;






const leads = searchData.targets.map(item=>{


return {

company:item.company,

country:item.country,

type:item.type,

website:item.website,

email:"待获取",

score:item.score


};


});





res.json({


product,

country,


market,


keywords:searchData.keywords,


channels,


strategy,


mail,


leads



});




});






app.listen(3000,()=>{


console.log(

"AI Export Lead Finder V5.1 running"

);


});
