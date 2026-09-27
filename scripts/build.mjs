import fs from'node:fs/promises';import path from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{zipSync,unzipSync,strToU8}from'fflate';
const root=fileURLToPath(new URL('../',import.meta.url));const out=root+'release/';await fs.mkdir(out+'pieces',{recursive:true});await fs.mkdir(out+'resources',{recursive:true});await fs.mkdir(root+'dist',{recursive:true});
const assets=JSON.parse(await fs.readFile(root+'sources/assets.json'));const template=JSON.parse(await fs.readFile(root+'sources/rectangle.gltf'));const sourceBin=await fs.readFile(root+'sources/rectangle.bin');
for(const a of assets.filter(x=>x.quantity)){
 const w=a.widthMm/1000,h=a.heightMm/1000,t=a.kind==='card'?.0003:.001;
 const model=structuredClone(template),bin=Buffer.from(sourceBin);model.materials[0].pbrMetallicRoughness.baseColorFactor=[0.04,0.05,0.075,1];const positions=new Set(model.meshes.flatMap(m=>m.primitives.map(p=>p.attributes.POSITION)));
 for(const index of positions){const ac=model.accessors[index],view=model.bufferViews[ac.bufferView];const offset=(view.byteOffset||0)+(ac.byteOffset||0);for(let i=0;i<ac.count;i++)for(let axis=0;axis<3;axis++){const off=offset+i*(view.byteStride||12)+axis*4;bin.writeFloatLE(bin.readFloatLE(off)*[w/.0635,t/.0003,h/.09525][axis],off);}for(const name of ['min','max'])if(ac[name])ac[name]=ac[name].map((v,i)=>v*[w/.0635,t/.0003,h/.09525][i]);}
 const geometry=`rectangle-${w.toFixed(6)}-${h.toFixed(6)}-${t}.bin`;model.buffers[0].uri='/resources/'+geometry;await fs.writeFile(out+'resources/'+geometry,bin);
 model.images=[a.id,a.back||a.id].map(id=>({mimeType:'image/avif',uri:'/resources/'+id+'.avif'}));model.textures=[0,1].map(source=>({extensions:{EXT_texture_avif:{source}}}));model.extensionsUsed=['EXT_texture_avif'];model.extensionsRequired=['EXT_texture_avif'];
 await fs.writeFile(out+'pieces/'+a.id+'.gltf',JSON.stringify(model));
}
// Reuse Settlers' private-area geometry, SVG and materials exactly.
const privateArea=JSON.parse(await fs.readFile(root+'sources/private-play-area/model.gltf'));
privateArea.images[0].uri='/resources/private-play-area.svg';privateArea.buffers[0].uri='/resources/private-play-area.bin';
await fs.copyFile(root+'sources/private-play-area/face.svg',out+'resources/private-play-area.svg');
await fs.copyFile(root+'sources/private-play-area/geometry.bin',out+'resources/private-play-area.bin');
await fs.writeFile(out+'pieces/private-play-area.gltf',JSON.stringify(privateArea));
const die=JSON.parse(await fs.readFile(root+'sources/die/die.gltf'));for(const x of [...die.images,...die.buffers])await fs.copyFile(root+'sources/die/'+path.basename(x.uri),out+x.uri.slice(1));await fs.writeFile(out+'pieces/die.gltf',JSON.stringify(die));
const game=JSON.parse(await fs.readFile(root+'sources/game.json'));
// Keep the saved layout and shuffled card order on every rebuild.
const walk=xs=>xs.flatMap(x=>[x,...walk(x.children||[])]);const pieces=walk(game.children);if(pieces.length!==374)throw Error('Expected 374 pieces, got '+pieces.length);
const needed=new Set(pieces.map(x=>x.src));for(const p of [...needed]){const model=JSON.parse(await fs.readFile(out+p));for(const x of [...(model.images||[]),...(model.buffers||[])])if(x.uri&&!x.uri.startsWith('data:'))needed.add(x.uri.replace(/^\//,''));}
const license=await fs.readFile(root+'LICENSE.md');await fs.writeFile(out+'LICENSE.md',license);needed.add('LICENSE.md');
const contents={},files=[];const types={gltf:'model/gltf+json',avif:'image/avif',webp:'image/webp',svg:'image/svg+xml',bin:'application/octet-stream',md:'text/markdown'};
for(const name of [...needed].sort()){const data=await fs.readFile(out+name);contents[name]=data;files.push({path:name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),mediaType:types[name.split('.').at(-1)]||'application/octet-stream'});}
const release=JSON.parse(await fs.readFile(root+'sources/release-schema.json'));release.game=game;release.files=files;contents['release.json']=strToU8(JSON.stringify(release));contents['package.json']=strToU8(JSON.stringify({name:'Nova',main:'release.json'}));
for(const name of ['release.json','package.json'])await fs.writeFile(out+name,contents[name]);
const zipped=zipSync(contents,{level:9});const check=unzipSync(zipped);for(const[name,data]of Object.entries(contents))if(!Buffer.from(check[name]).equals(data))throw Error('ZIP mismatch '+name);
await fs.writeFile(root+'dist/nova.probability.zip',zipped);console.log(JSON.stringify({pieces:pieces.length,files:files.length,bytes:zipped.length}));
