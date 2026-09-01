import {
SEARCH_CONFIG
}
from "./apiConfig.js";





export async function webSearch(keyword){



// ======================
// 真实API入口
// ======================



if(
SEARCH_CONFIG.provider==="bing"
){

return await bingSearch(keyword);


}



if(
SEARCH_CONFIG.provider==="google"
){

return await googleSearch(keyword);


}




if(
SEARCH_CONFIG.provider==="serp"
){

return await serpSearch(keyword);


}




// 当前测试模式

return demoSearch(keyword);



}







// Demo数据

function demoSearch(keyword){


return [

{

title:

`${keyword} GmbH`,

url:

"https://company-example.com",

snippet:

"Importer distributor buyer",

source:

"demo"

},


{

title:

`${keyword} Trading Ltd`,

url:

"https://trading-example.com",

snippet:

"Wholesale importer",

source:

"demo"

}


];


}






// Bing接口预留

async function bingSearch(keyword){


return [];


}





// Google接口预留

async function googleSearch(keyword){


return [];


}





// Serp接口预留

async function serpSearch(keyword){


return [];


}
