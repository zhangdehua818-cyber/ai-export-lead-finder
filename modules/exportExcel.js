// V8 Excel导出模块


export function exportLeads(customers){


// 生成CSV格式数据
// 前端可以直接下载


let csv =

"公司,国家,类型,官网,邮箱,评分,状态\n";



customers.forEach(c=>{


csv +=

`${c.company},${c.country},${c.type},${c.website},${c.email},${c.score},${c.status || "未联系"}\n`;


});



return csv;


}
