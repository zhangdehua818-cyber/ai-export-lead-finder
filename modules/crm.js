// V8 客户管理 CRM


let customers = [];



// 保存客户

export function addCustomer(customer){


const data = {


id: Date.now(),


...customer,


status:"未联系",


createdAt:
new Date().toISOString()


};



customers.push(data);



return data;


}





// 获取客户列表

export function getCustomers(){


return customers;


}





// 更新客户状态

export function updateStatus(id,status){



customers =
customers.map(c=>{


if(c.id===id){


c.status=status;


}


return c;


});



return customers;


}
