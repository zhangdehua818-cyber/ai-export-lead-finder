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
目标市场：
${country}

产品：
${product}

推荐寻找：

1. 进口商

2. 经销商

3. 批发商

`

};


}
