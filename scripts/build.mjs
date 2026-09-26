import fs from'node:fs/promises';import path from'node:path';import{fileURLToPath}from'node:url';import{createHash,randomInt}from'node:crypto';import{zipSync,unzipSync,strToU8}from'fflate';
const root=fileURLToPath(new URL('../',import.meta.url));const out=root+'release/';await fs.mkdir(out+'pieces',{recursive:true});await fs.mkdir(out+'resources',{recursive:true});await fs.mkdir(root+'dist',{recursive:true});
const assets=JSON.parse(await fs.readFile(root+'sources/assets.json'));const template=JSON.parse(await fs.readFile(root+'sources/rectangle.gltf'));const sourceBin=await fs.readFile(root+'sources/rectangle.bin');const byId=new Map(assets.map(x=>[x.id,x]));
for(const a of assets.filter(x=>x.quantity)){
 const w=a.widthMm/1000,h=a.heightMm/1000,t=a.kind==='card'?.0003:.001;
 const model=structuredClone(template),bin=Buffer.from(sourceBin);model.materials[0].pbrMetallicRoughness.baseColorFactor=[0.04,0.05,0.075,1];const positions=new Set(model.meshes.flatMap(m=>m.primitives.map(p=>p.attributes.POSITION)));
 for(const index of positions){const ac=model.accessors[index],view=model.bufferViews[ac.bufferView];const offset=(view.byteOffset||0)+(ac.byteOffset||0);for(let i=0;i<ac.count;i++)for(let axis=0;axis<3;axis++){const off=offset+i*(view.byteStride||12)+axis*4;bin.writeFloatLE(bin.readFloatLE(off)*[w/.0635,t/.0003,h/.09525][axis],off);}for(const name of ['min','max'])if(ac[name])ac[name]=ac[name].map((v,i)=>v*[w/.0635,t/.0003,h/.09525][i]);}
 const geometry=`rectangle-${w.toFixed(6)}-${h.toFixed(6)}-${t}.bin`;model.buffers[0].uri='/resources/'+geometry;await fs.writeFile(out+'resources/'+geometry,bin);
 model.images=[a.id,a.back||a.id].map(id=>({mimeType:'image/avif',uri:'/resources/'+id+'.avif'}));model.textures=[0,1].map(source=>({extensions:{EXT_texture_avif:{source}}}));model.extensionsUsed=['EXT_texture_avif'];model.extensionsRequired=['EXT_texture_avif'];
 await fs.writeFile(out+'pieces/'+a.id+'.gltf',JSON.stringify(model));
}
const die=JSON.parse(await fs.readFile(root+'sources/die/die.gltf'));for(const x of [...die.images,...die.buffers])await fs.copyFile(root+'sources/die/'+path.basename(x.uri),out+x.uri.slice(1));await fs.writeFile(out+'pieces/die.gltf',JSON.stringify(die));
const round=v=>Math.round(v*1000)/1000;const roots=[];
function piece(id,x,z,flip=false){const a=byId.get(id);return{src:'pieces/'+id+'.gltf',size:[a.widthMm/1000,a.kind==='card'?.0003:.001,a.heightMm/1000],position:[round(x),null,round(z)],rotation:[flip?Math.PI:0,0,0],fixed:false,children:[]};}
function stack(pieces,x,z){let prev;for(const p of pieces){p.position=[prev?0:round(x),null,prev?0:round(z)];p.children=[];if(prev)prev.children=[p];else roots.push(p);prev=p;}return pieces[0];}
function shuffle(xs){for(let i=xs.length-1;i>0;i--){const j=randomInt(i+1);[xs[i],xs[j]]=[xs[j],xs[i]];}return xs;}
let game;try{game=JSON.parse(await fs.readFile(root+'sources/game.json'));}catch{
 const board=piece('map',-.20,-.16);board.fixed=true;roots.push(board);
 const redBoard=piece('red-board',-.31,.13);roots.push(redBoard);stack(['blue','green','yellow'].map(c=>piece(c+'-board',0,0)),.24,.23);
 const tracks=piece('tracks',-.27,.25);roots.push(tracks);roots.push(piece('reference',.19,.39));
 for(const[d,deck]of ['Civilian','Diplomatic','Military'].entries()){
  let cards=shuffle(assets.filter(a=>a.kind==='card'&&a.id.startsWith(deck)).map(a=>piece(a.id,0,0,true)));
  if(deck==='Civilian'){const hand=[];while(hand.length<6){const i=cards.findIndex(p=>!p.src.includes('-X-'));hand.push(cards.splice(i,1)[0]);}shuffle(cards);stack(hand,-.08,.14);}
  stack(cards,.10+d*.09,-.32);
 }
 const planetPool=[];let home;let colony;let idx=0;for(const a of assets.filter(a=>['counter','planet'].includes(a.kind)&&a.quantity)){
  const all=Array.from({length:a.quantity},()=>piece(a.id,0,0,a.kind==='planet'));
  if(a.kind==='planet'){if(a.id==='rich-terran'){home=all.shift();home.rotation=[0,0,0];}planetPool.push(...all);continue;}
  if(a.id==='red-colony')colony=all.shift();
  if(['special-12','special-13','red-vp'].includes(a.id)){const p=all.shift();p.position=[a.id==='special-12'?-.046:a.id==='special-13'?-.090:-.112,null,-.041];tracks.children.push(p);}
  if(['red-income','red-naval'].includes(a.id)){const p=all.shift();p.position=[-.085,null,-.006];if(redBoard.children.length){p.position=[0,null,0];redBoard.children[0].children.push(p);}else redBoard.children.push(p);}
  if(all.length){stack(all,.095+idx%13*.026,-.19+Math.floor(idx/13)*.034);idx++;}
 }
 stack(shuffle(planetPool),.37,.19);home.position=[.035,null,.14];colony.position=[0,null,0];home.children=[colony];roots.push(home);
 for(let i=0;i<5;i++)roots.push({src:'pieces/die.gltf',size:[.016,.016,.016],position:[.37+i*.024,null,-.32],rotation:[Math.PI/2,0,Math.PI/2],fixed:false,children:[]});
 const schema=JSON.parse(await fs.readFile(root+'sources/game-schema.json'));game={'@probability':schema,title:'Nova',surfaceSize:[1.15,1.05],children:roots};
 await fs.writeFile(root+'sources/game.json',JSON.stringify(game,null,2)+'\n');
}
// Keep the saved layout and shuffled card order on every rebuild.
const walk=xs=>xs.flatMap(x=>[x,...walk(x.children||[])]);const pieces=walk(game.children);if(pieces.length!==370)throw Error('Expected 370 pieces, got '+pieces.length);
const needed=new Set(pieces.map(x=>x.src));for(const p of [...needed]){const model=JSON.parse(await fs.readFile(out+p));for(const x of [...(model.images||[]),...(model.buffers||[])])if(x.uri&&!x.uri.startsWith('data:'))needed.add(x.uri.replace(/^\//,''));}
const license=await fs.readFile(root+'LICENSE.md');await fs.writeFile(out+'LICENSE.md',license);needed.add('LICENSE.md');
const contents={},files=[];const types={gltf:'model/gltf+json',avif:'image/avif',webp:'image/webp',bin:'application/octet-stream',md:'text/markdown'};
for(const name of [...needed].sort()){const data=await fs.readFile(out+name);contents[name]=data;files.push({path:name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),mediaType:types[name.split('.').at(-1)]||'application/octet-stream'});}
const release=JSON.parse(await fs.readFile(root+'sources/release-schema.json'));release.game=game;release.files=files;contents['release.json']=strToU8(JSON.stringify(release));contents['package.json']=strToU8(JSON.stringify({name:'Nova',main:'release.json'}));
for(const name of ['release.json','package.json'])await fs.writeFile(out+name,contents[name]);
const zipped=zipSync(contents,{level:9});const check=unzipSync(zipped);for(const[name,data]of Object.entries(contents))if(!Buffer.from(check[name]).equals(data))throw Error('ZIP mismatch '+name);
await fs.writeFile(root+'dist/nova.probability.zip',zipped);console.log(JSON.stringify({pieces:pieces.length,files:files.length,bytes:zipped.length}));
