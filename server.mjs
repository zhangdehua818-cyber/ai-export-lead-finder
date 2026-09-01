import express from "express";
import cors from "cors";


const app = express();


app.use(cors());

app.use(express.json());



app.get("/",(req,res)=>{

res.send("AI Export Lead Finder V6 Running");

});



app.get("/health",(req,res)=>{

res.json({

status:"ok",

version:"V6"

});

});




// V6核心接口

app.post("/find-leads",(req,res)=>{


const {

product,

country,

type

}=req.body;



// 产品分析

const productAnalysis = `

📊 产品分析


产品：

${product}


目标市场：

${country}


推荐客户类型：

✓ ${product}进口商

✓ ${product}分销商

✓ ${product}批发商


`;




// 搜索关键词

const keywords=[

`${product} importer ${country}`,

`${product} distributor ${country}`,

`${product} wholesaler ${country}`,

`${product} buyer ${country}`

];




// 模拟企业数据

const customers=[


{

company:
`${country} ${product} Trading GmbH`,

country,

type:"Importer",

website:"待获取",

email:"待获取",

score:"★★★★★",

reason:
"产品匹配度高，可能存在采购需求"


},


{

company:
`Global ${product} Distribution`,

country,

type:"Distributor",

website:"待获取",

email:"待获取",

score:"★★★★☆",

reason:
"行业相关，适合作为潜在客户"


},


{

company:
`European ${product} Supply Co.`,

country,

type:"Wholesaler",

website:"待获取",

email:"待获取",

score:"★★★★☆",

reason:
"具有渠道合作可能"


}


];




// 开发信

const email = `

Subject:
${product} Supplier Cooperation Opportunity


Dear Purchasing Manager,


We are a professional manufacturer specializing in ${product} from China.


Our advantages:

✓ Factory direct price

✓ OEM service

✓ Stable supply


We are looking for reliable partners in ${country}.


Looking forward to cooperation.


Best regards


`;




// 返回

res.json({


version:"V6",


product,

country,


analysis:productAnalysis,


keywords,


channels:

`

Google

LinkedIn

Europages

Industry Directory

`,


strategy:

`

筛选标准：

✓ 官网企业

✓ 有采购能力

✓ 产品匹配

✓ 有渠道价值

`,


email,


customers


});


});





app.listen(3000,()=>{


console.log(

"AI Export Lead Finder V6 Running"

);


});
