import { webSearch }
from "./searchAPI.js";



export async function searchCompanies(product,country){



const keyword =

`${product} importer ${country}`;



const results =

await webSearch(keyword);




return results.map((item,index)=>{


return {


company:

item.title,


country,


type:

index===0

?

"Importer"

:

"Distributor",



website:

item.url,


email:

"待获取",



source:

item.source,


keyword



};


});



}
