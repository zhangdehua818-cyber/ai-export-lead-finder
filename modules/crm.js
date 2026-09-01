let customers=[];



export function addCustomer(customer){


customers.push({

id:Date.now(),

...customer,

createdAt:

new Date().toISOString()


});


return customer;


}



export function getCustomers(){


return customers;


}



export function updateCustomer(id,status){


customers =
customers.map(c=>{


if(c.id===id){

c.status=status;

}


return c;


});



return customers;


}
