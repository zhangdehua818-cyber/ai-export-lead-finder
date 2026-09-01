export function exportLeads(customers){



let csv =

"公司,国家,类型,官网,邮箱,评分,状态\n";



customers.forEach(c=>{


csv +=

`${c.company},${c.country},${c.type},${c.website},${c.email},${c.score},${c.status}\n`;


});



return csv;


}
