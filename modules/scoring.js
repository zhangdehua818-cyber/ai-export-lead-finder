// V6 客户评分模块


export function scoreCompany(company){


let score = 0;


if(company.industry)
score += 30;


if(company.website)
score += 30;


if(company.type)
score += 20;


score +=20;



let level="★★★☆☆";


if(score>=80)
level="★★★★★";

else if(score>=60)
level="★★★★☆";



return {


score,

level,


reason:

`
行业匹配：
${company.industry || "未知"}

官网信息：
${company.website || "未知"}

综合判断：
适合作为开发目标

`


};



}
