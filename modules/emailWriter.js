if (value.companyName) {      
return text(value.companyName);    
}
    if (value.title) {      
return text(value.title);    
}
    if (value.value) {      
return text(value.value);    
}
    return "";  
}
  return "";
}
function normalizeProduct(product) {  
const value = text(product);
  if (!value) {    
return "our products";  
}
  if (PRODUCT_MAP[value]) {    
return PRODUCT_MAP[value];  
}
  return value;
}
function normalizeCountry(country) {  
const value = text(country);
  if (!value) {    
return "your market";  
}
  if (COUNTRY_MAP[value]) {    
return COUNTRY_MAP[value];  
}
  return value;
}
function normalizeCompany(company) {  
const value = text(company);
  if (!value) {    
return "your company";  
}
  return value;
}
/*
 * 支持多种调用方式：
 *
 * generateEmail(product, country, company)
 *
 * generateEmail({
 *   product,
 *   country,
 *   company
 * })
 */
export function generateEmail(  
productOrObject,  
country,  
company
) {  
let product;  
let targetCountry;  
let companyName;
  if (    
productOrObject &&
}
