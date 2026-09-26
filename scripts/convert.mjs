import fs from 'node:fs/promises';import path from'node:path';import{fileURLToPath}from'node:url';import sharp from'sharp';
const root=fileURLToPath(new URL('../',import.meta.url));sharp.concurrency(2);const specs=[];
function add(id,file,page,box,quantity=1,back=null,kind='counter',rotation=0){specs.push({id,file,page,box,quantity,back,kind,rotation});}
const cache=(file,page)=>path.join(root,'.cache',file.replace('.pdf','').replace(/[^a-zA-Z0-9-]/g,'_')+'-'+page+'.png');
const decks=['Civilian','Diplomatic','Military'];
for(const [d,deck]of decks.entries()){
 const back=deck==='Civilian'?'Civilian-reverse.pdf':deck+' reverse.pdf';add(deck+'-back',back,1,[0,0,63.5,95.25],0,null,'back');
 for(const type of ['action','development','surprise'])for(let i=0;i<9;i++)add(`${deck}-${type}-${i+1}`,`${deck}-${type}.pdf`,1,[i%3*63.5,Math.floor(i/3)*95.25,63.5,95.25],1,deck+'-back','card');
 // The X-card sheet has one row per deck; verified against the printed deck labels.
 for(let i=0;i<3;i++)add(`${deck}-X-${i+1}`,'X-cards.pdf',1,[i*63.5,[1,2,0][d]*95.25,63.5,95.25],1,deck+'-back','card');
}
const counterFile='Counters-Nova-P&P.pdf';
function counter(id,row,col,quantity=1,page=1){const back=id+'-back';add(id,counterFile,page,[17+col*16,17+row*16,16,16],quantity,back);add(back,counterFile,page+3,[24+(15-col)*16,17+row*16,16,16],0,null,'back');}
for(const[color,index]of ['red','blue','green','yellow'].map((x,i)=>[x,i])){
 const row=index*2;for(const[name,col,qty]of [['capital',0,1],['colony',1,3],['settlement',4,4],['factory',8,5],['fortress',13,3]])counter(color+'-'+name,row,col,qty);
 for(const[name,col,qty]of [['line-fleet',0,8],['escort-fleet',8,6],['attack',14,1],['defense',15,1]])counter(color+'-'+name,row+1,col,qty);
 for(const[name,col]of [['naval',index*3],['income',index*3+1],['vp',index*3+2]])counter(color+'-'+name,8,col);
}
for(let col=12;col<16;col++)counter('tension-'+col,8,col);
for(let col=0;col<16;col++)counter('special-'+col,9,col);
for(let col=0;col<16;col++)counter('technology-'+col,10,col);
for(let col=0;col<5;col++)counter('minor-emblem-'+col,0,col,1,2);
counter('minor-colony',0,5,10,2);counter('combat-station',0,15,1,2);
for(const[id,col,qty]of [['minor-fleet',0,11],['minor-fortress',1,3],['walker',4,3],['stealth',7,3],['orbital',10,1],['missile',11,2],['heavy',13,3]])counter(id,1,col,qty,2);
for(let col=10;col<16;col++)counter('duration-'+(col-9),2,col,1,2);
function planet(id,row,col,qty){const back='planet-back';add(id,counterFile,2,[17+col*19,79+row*16,19,16],qty,back,'planet');}
planet('terran',0,0,9);planet('terran-double',0,9,1);planet('rich',1,0,9);planet('rich-double',1,9,1);planet('asteroids',2,0,13);planet('rich-terran',3,4,4);planet('rich-terran-double',3,8,1);planet('occupied',0,10,6);add('planet-back',counterFile,5,[71,79,19,16],0,null,'back');
for(let i=0;i<4;i++){const id=['red','blue','green','yellow'][i]+'-board';const box=[5.925,15.048+i*55.709,198.149,55.709];add(id,counterFile,3,box,1,id+'-back','board');add(id+'-back',counterFile,6,[5.977,box[1],box[2],box[3]],0,null,'back');}
add('map','Map_Nova.pdf',1,[0,0,457.2,457.2],1,null,'map');
add('reference','Tables_Nova.pdf',1,[0,0,133.35,260.35],1,'reference-back','aid',270);add('reference-back','Tables_Nova.pdf',2,[0,0,133.35,260.35],0,null,'back',270);add('tracks','Tables_Nova.pdf',3,[0,0,133.35,260.35],1,null,'board',270);
await fs.mkdir(root+'sources/assets',{recursive:true});await fs.mkdir(root+'release/resources',{recursive:true});
await Promise.all(Array.from({length:4},async (_,worker)=>{for(let i=worker;i<specs.length;i+=4){const s=specs[i];
 const [x,y,w,h]=s.box;const pixels={left:Math.round(x*12),top:Math.round(y*12),width:Math.round(w*12),height:Math.round(h*12)};
 const png=path.join(root,'sources/assets',s.id+'.png');const existing=path.join(root,'release/resources',s.id+'.avif');s.widthMm=s.rotation?h:w;s.heightMm=s.rotation?w:h;s.pixels=[Math.round(s.widthMm*12),Math.round(s.heightMm*12)];s.asset='sources/assets/'+s.id+'.png';try{const meta=await sharp(existing).metadata();await fs.access(png);if(meta.width===s.pixels[0]&&meta.height===s.pixels[1])continue;}catch{}let pipeline=sharp(cache(s.file,s.page)).extract(pixels);if(s.rotation)pipeline=pipeline.rotate(s.rotation);
 await pipeline.withMetadata({density:304.8}).png().toFile(png);
 const out=path.join(root,'release/resources',s.id+'.avif');await sharp(png).avif({quality:s.kind==='map'?40:45,effort:5,chromaSubsampling:'4:4:4'}).toFile(out);
 s.widthMm=s.rotation?h:w;s.heightMm=s.rotation?w:h;s.pixels=[Math.round(s.widthMm*12),Math.round(s.heightMm*12)];s.asset='sources/assets/'+s.id+'.png';
 if(i%30===0)console.log('Converted',i+1,'/',specs.length);
}}));
await fs.writeFile(root+'sources/assets.json',JSON.stringify(specs,null,2)+'\n');console.log('Physical printed components:',specs.reduce((n,s)=>n+s.quantity,0),'unique images:',specs.length);
