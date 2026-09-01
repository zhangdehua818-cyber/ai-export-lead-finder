
// V5.2 企业搜索模块


export function searchCompanies(product, country){



const companies=[


{

name:
`${country} ${product} Trading GmbH`,

country,

industry:
`${product} Importer`,

website:
"待获取",

email:
"待获取",

score:
"★★★★★",


reason:
"产品匹配，可能存在采购需求"


},



{

name:
`Global ${product} Distribution`,

country,

industry:
"Distributor",

website:
"待获取",

email:
"待获取",

score:
"★★★★☆",

reason:
"行业相关，适合作为开发目标"


},



{

name:
`European ${product} Supply Co.`,

country,

industry:
"Wholesaler",

website:
"待获取",

email:
"待获取",

score:
"★★★★☆",

reason:
"具备渠道合作可能"


}



];




return companies;



}
