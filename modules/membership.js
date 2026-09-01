export function checkMembership(user){



if(!user){

return {

allow:false,

message:"未登录"

};

}



if(user.vip==="pro"){


return {


allow:true,


limit:100


};


}




return {


allow:true,


limit:user.searchCount || 3


};



}
