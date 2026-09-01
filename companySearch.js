export function searchCompanies(product, country){


return [

{
company:
`${country} ${product} Trading GmbH`,

country:country,

type:"Importer",

website:"待获取",

email:"待获取",

score:"★★★★★",

reason:
"产品匹配，可能存在采购需求"

},


{
company:
`Global ${product} Distribution`,

country:country,

type:"Distributor",

website:"待获取",

email:"待获取",

score:"★★★★☆",

reason:
"行业相关，适合作为开发目标"

},


{
company:
`European ${product} Supply Co.`,

country:country,

type:"Wholesaler",

website:"待获取",

email:"待获取",

score:"★★★★☆",

reason:
"具备渠道合作可能"

}

];


}
