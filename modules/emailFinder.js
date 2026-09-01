export async function findContact(company,country){



let domain="";



if(company.website){


domain=

company.website

.replace(

"https://",

""

)

.replace(

"http://",

""

)

.split("/")[0];


}




return {


contactPerson:

"Purchasing Manager",


email:

`purchase@${domain}`,



salesEmail:

`sales@${domain}`,


linkedin:

"待查询",


country



};



}
