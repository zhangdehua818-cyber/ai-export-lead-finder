export function scoreCompany(company){



let score=70;



if(company.type==="Importer"){

score+=15;

}



if(company.website){

score+=10;

}



if(company.country){

score+=5;

}




let level="★★★☆☆";



if(score>=90){

level="★★★★★";

}

else if(score>=80){

level="★★★★☆";

}



return {


score,


level,


reason:

`
客户类型：
${company.type}

匹配度：
较高

建议：
优先开发

`

};



}
