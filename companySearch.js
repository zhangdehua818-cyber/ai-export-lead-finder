import {
webSearch
}

from "./modules/searchAPI.js";





export async function searchCompanies(

product,

country

){



const keywords=[


`${product} importer ${country}`,


`${product} distributor ${country}`,


`${product} wholesale buyer ${country}`


];




let companies=[];




for(

const keyword of keywords

){



const results=

await webSearch(keyword);




results.forEach(item=>{


companies.push({

company:item.title,


country,


type:"Importer",


website:item.url,


description:item.snippet,


source:item.source,


keyword


});


});


}






return companies;


}
