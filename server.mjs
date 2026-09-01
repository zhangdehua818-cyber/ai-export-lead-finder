import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());


app.get("/",(req,res)=>{
    res.send("AI Export Lead Finder V3 Running");
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

`${product} wholesaler ${country}`

];



const analysis=`

【市场分析】

产品：
${product}

目标市场：
${country}


【客户画像】

适合开发：

1. ${product}进口商

2. ${product}批发商

3. 行业经销商


【推荐搜索关键词】

${keywords.join("\n")}


【开发策略】

重点突出：

✓ 中国供应链优势

✓ OEM能力

✓ 产品质量

✓ 价格竞争力



【英文开发信】

Subject:
Reliable ${product} Supplier From China


Dear Purchasing Manager,


We are a professional supplier specializing in ${product}.

We are looking for distributors and partners in ${country}.

Our advantages:

- Competitive factory price
- Stable supply
- OEM service


Could we discuss possible cooperation?


Best regards

`;



const leads=[

{
company:`${country} ${product} Trading Company`,
country,
type:type || "Importer",
website:"Searching...",
email:"Contact via website",
score:"★★★★★"
},


{
company:`Global ${product} Distributor`,
country,
type:"Distributor",
website:"Searching...",
email:"Contact via website",
score:"★★★★☆"
}

];



res.json({

product,
country,
analysis,
leads

});


});



app.listen(3000,()=>{

console.log("V3 running");

});
