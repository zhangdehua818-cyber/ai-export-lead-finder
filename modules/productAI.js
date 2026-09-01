export function analyzeProduct(product,country){


return {

product,

country,


customerTypes:[

`${product} Importer`,

`${product} Distributor`,

`${product} Wholesaler`

],


keywords:[

`${product} importer ${country}`,

`${product} distributor ${country}`,

`${product} buyer ${country}`

],


summary:

`
产品：
${product}

目标国家：
${country}

推荐客户：

进口商
经销商
批发商

`

};


}
