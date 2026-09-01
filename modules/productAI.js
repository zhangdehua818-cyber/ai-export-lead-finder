// V6 产品分析模块


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



analysis:

`
产品：
${product}


目标市场：
${country}


推荐开发对象：

1. 进口商

2. 经销商

3. 批发商


重点：

寻找有采购能力和渠道能力的企业。

`



};


}
