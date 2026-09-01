import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());


app.get("/",(req,res)=>{
    res.send("AI Export Lead Finder V4 Running");
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



const keywords=[

`${product} importer ${country}`,

`${product} distributor ${country}`,

`${product} wholesaler ${country}`,

`${product} supplier ${country}`

];



const result={


market:`

目标市场：
${country}


产品：
${product}


适合开发客户：

✓ ${product}进口商

✓ ${product}批发商

✓ ${product}经销商

✓ 行业采购公司


`,


search:


keywords.join("\n"),



channels:`

推荐开发渠道：

1. Google

2. LinkedIn

3. Europages

4. Kompass


`,


strategy:`

客户筛选标准：

✓ 有官网

✓ 有采购页面

✓ 有进口需求

✓ 产品匹配


开发重点：

✓ 中国供应链优势

✓ OEM能力

✓ 价格优势

✓ 交付能力


`,


mail:`

Subject:
${product} Supplier Cooperation Opportunity


Dear Purchasing Manager,


We are a professional manufacturer specializing in ${product}.


We are looking for distributors and partners in ${country}.


Our advantages:

- Factory direct price
- OEM service
- Stable supply


Would you like to discuss cooperation?


Best regards


`,


leads:[

{
company:`${country} ${product} Importer`,
country,
type:type || "Importer",
website:"需要进一步搜索",
email:"待获取",
score:"★★★★★"
},

{
company:`${country} ${product} Distributor`,
country,
type:"Distributor",
website:"需要进一步搜索",
email:"待获取",
score:"★★★★☆"
}

]


};



res.json(result);



});




app.listen(3000,()=>{

console.log("V4 running");

});
