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
