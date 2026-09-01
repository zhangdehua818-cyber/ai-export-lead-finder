let database=[];



export function save(data){


database.push(data);


return data;


}



export function all(){


return database;


}
