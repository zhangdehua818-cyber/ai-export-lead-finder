// V5.1 客户搜索模块

export function generateSearch(product, country, type){

const keywords = [

`${product} importer ${country}`,
`${product} distributor ${country}`,
`${product} wholesaler ${country}`,
`${product} buyer ${country}`

];


const targets = [

{
company:`${country} ${product} Import GmbH`,
country:country,
type:"Importer",
website:"待搜索",
score:"★★★★★"
},


{
company:`Global ${product} Trading`,
country:country,
type:"Distributor",
website:"待搜索",
score:"★★★★☆"
},


{
company:`European ${product} Supply`,
country:country,
type:"Wholesaler",
website:"待搜索",
score:"★★★★☆"
}

];


return {

keywords,
targets

};


}
