// V9 企业搜索模块

import { webSearch } from "./modules/searchAPI.js";



export async function searchCompanies(product, country){



const keywords = [

`${product} importer ${country}`,

`${product} distributor ${country}`,

`${product} wholesaler ${country}`,

`${product} buyer ${country}`

];



// 调用搜索接口

const results = await webSearch(

keywords[0]

);





return results.map((item,index)=>{


return {


company:

item.title || `${country} ${product} Company`,



country,


type:

index===0

?

"Importer"

:

"Distributor",



website:

item.url || "待获取",



email:

"待获取",



keyword:

keywords[0],



source:

item.source || "AI Search"



};



});



}
