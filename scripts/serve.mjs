import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../release/', import.meta.url));
const port = Number(process.env.PORT || 45944);
const types = {'.json':'application/json','.gltf':'model/gltf+json','.avif':'image/avif','.webp':'image/webp','.svg':'image/svg+xml','.bin':'application/octet-stream'};
createServer(async (req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','no-cache');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/compact\//,'/');
    const file=resolve(root,'.'+path);
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end();}
}).listen(port,'127.0.0.1',()=>console.log(`Nova template: http://127.0.0.1:${port}/compact/`));
