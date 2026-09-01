import {webSearch}

from "./modules/searchAPI.js";



export async function searchCompanies(product,country){



const keyword =

`${product} importer ${country}`;



const results =

await webSearch(keyword);




return results.map(item=>{


return {


company:

item.title,


country,


type:

"Importer",



website:

item.url,



description:

item.snippet,


source:

item.source



};


});



}
