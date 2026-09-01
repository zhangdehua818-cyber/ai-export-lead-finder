export function scoreCompany(company){



let score=60;



if(company.type==="Importer"){

score+=20;

}



if(company.website){

score+=10;

}



if(company.country){

score+=10;

}




let level="★★★☆☆";


if(score>=90)

level="★★★★★";


else if(score>=75)

level="★★★★☆";



return {


score,


level,


reason:

`
产品匹配：
高

客户类型：
${company.type}

建议：
优先开发

`

};



}
