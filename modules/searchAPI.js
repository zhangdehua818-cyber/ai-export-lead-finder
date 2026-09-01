export async function webSearch(keyword){


/*

这里预留真实搜索接口

后续可以接：

Google Custom Search API

Bing Search API

SerpAPI

*/


let results=[


{
title:
`${keyword} GmbH`,

url:
"https://example-company.com",

snippet:
"Importer distributor supplier",

source:
"Search Engine"

},


{
title:
`${keyword} Trading Company`,

url:
"https://example-trading.com",

snippet:
"Wholesale buyer",

source:
"Search Engine"

},


{
title:
`${keyword} Solutions`,

url:
"https://example-solutions.com",

snippet:
"Industrial supplier",

source:
"Search Engine"

}



];



return results;


}
