import http from 'http';
http.createServer((req,res)=>{
res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
res.end('AI Export Lead Finder running');
}).listen(3000);
