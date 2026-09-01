// V6 客户管理模块


let customers=[];



export function saveCustomer(customer){


customers.push({

...customer,

status:"未联系",

createdAt:new Date()

});


return customers;


}



export function getCustomers(){


return customers;


}
