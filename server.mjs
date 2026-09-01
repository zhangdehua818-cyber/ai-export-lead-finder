import express from "express";


const app = express();


app.use(express.json());

app.use(express.static("."));



const PORT = process.env.PORT || 3000;



// 模拟海外客户数据库

const customers = [

{
company:"SolarTech Manufacturing Inc",
country:"USA",
type:"进口商",
website:"www.solartech.com",
contact:"Sales Manager",
email:"sales@solartech.com",
reason:"该公司采购工业零件，与CNC加工产品高度匹配"
},


{
company:"Global Energy Components Ltd",
country:"Germany",
type:"分销商",
website:"www.globalenergy.de",
contact:"Purchasing Team",
email:"contact@globalenergy.de",
reason:"欧洲工业设备供应链企业，可能采购金属加工件"
},


{
company:"Precision Parts Solutions",
country:"USA",
type:"制造商",
website:"www.precisionparts.com",
contact:"John Smith",
email:"john@precisionparts.com",
reason:"主营精密机械零件，有外包加工需求"
},


{
company:"Euro Machine Supply",
country:"UK",
type:"进口商",
website:"www.euromachine.co.uk",
contact:"Procurement",
email:"buy@euromachine.co.uk",
reason:"机械配件进口商，符合目标客户画像"
},


{
company:"North America Industrial Group",
country:"Canada",
type:"批发商",
website:"www.naindustrial.ca",
contact:"Purchasing Department",
email:"info@naindustrial.ca",
reason:"工业产品采购渠道商"
}



];




// 搜索接口

app.post("/search",(req,res)=>{


const {
product,
country,
type
}=req.body;



console.log(
"搜索:",
product,
country,
type
);



// 简单筛选

let result=customers.filter(item=>{


return item.country===country 
||
item.type===type;


});



// 如果不足，返回全部

if(result.length<2){

result=customers;

}



res.json(result);



});





app.listen(PORT,()=>{


console.log(

`AI Export Lead Finder running on port ${PORT}`

);


});
