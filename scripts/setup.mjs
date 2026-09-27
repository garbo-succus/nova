import fs from 'node:fs/promises';
import {randomInt} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const assets=JSON.parse(await fs.readFile(root+'sources/assets.json'));
const byId=new Map(assets.map(a=>[a.id,a]));
const game=JSON.parse(await fs.readFile(root+'sources/game.json'));
const roots=[];const used=new Map();
const round=v=>Math.round(v*1000)/1000;
const shuffle=xs=>{for(let i=xs.length-1;i>0;i--){const j=randomInt(i+1);[xs[i],xs[j]]=[xs[j],xs[i]];}return xs;};
function piece(id,x=0,z=0,flip=false){const a=byId.get(id);used.set(id,(used.get(id)||0)+1);return {src:`pieces/${id}.gltf`,size:[a.widthMm/1000,a.kind==='card'?.0003:.001,a.heightMm/1000],position:[round(x),null,round(z)],rotation:[flip?Math.PI:0,0,0],fixed:false,children:[]};}
function stack(xs,x,z,parent=roots){let prev;for(const p of xs){p.position=[prev?0:round(x),null,prev?0:round(z)];p.children=[];if(prev)prev.children.push(p);else parent.push(p);prev=p;}return xs[0];}
const map=piece('map',0,-.33);map.fixed=true;roots.push(map);
const tracks=piece('tracks',-.20,.035);roots.push(tracks);
// Four kits are public groups. Players move/privatize a kit using the app.
for(const [i,color] of ['red','blue','green','yellow'].entries()){
 const kit=piece('reference',i%2===0?-.415:.415,i<2?-.43:-.16);roots.push(kit);
 const board=piece(`${color}-board`,0,-.030);kit.children.push(board);
 const income=piece(`${color}-income`,-.085,-.006);income.children.push(piece(`${color}-naval`));board.children.push(income);
 let n=0;for(const a of assets.filter(a=>a.quantity&&a.kind==='counter'&&a.id.startsWith(color+'-')&&!/(income|naval|vp)$/.test(a.id))){stack(Array.from({length:a.quantity},()=>piece(a.id)), -.105+(n%6)*.042,.018+Math.floor(n/6)*.028,kit.children);n++;}
 const vp=piece(`${color}-vp`);if(i===0)stack([vp],-.112,-.041,tracks.children);else{let top=tracks.children[0];while(top.children.length)top=top.children[0];top.children.push(vp);}
}
// Turn zero is prescribed by section 18. End six stages Colonization (3–4 players).
{let top=tracks.children[0];while(top.children.length)top=top.children[0];top.children.push(piece('special-12'));} tracks.children.push(piece('special-13',-.067,-.019));
for(const [i,deck] of ['Civilian','Diplomatic','Military'].entries())stack(shuffle(assets.filter(a=>a.kind==='card'&&a.quantity&&a.id.startsWith(deck)).map(a=>piece(a.id,0,0,true))),-.09+i*.09,.20);
const planets=assets.filter(a=>a.kind==='planet'&&a.quantity).flatMap(a=>Array.from({length:a.quantity},()=>piece(a.id,0,0,true)));stack(shuffle(planets),.26,.20);
let n=0;for(const a of assets.filter(a=>a.quantity&&a.kind==='counter'&&!used.has(a.id))){stack(Array.from({length:a.quantity},()=>piece(a.id)),-.51+(n%10)*.025,.16+Math.floor(n/10)*.026);n++;}
for(let i=0;i<5;i++)roots.push({src:'pieces/die.gltf',size:[.016,.016,.016],position:[.32+i*.028,null,.20],rotation:[Math.PI/2,0,Math.PI/2],fixed:false,children:[]});
// Exact private play area from the published Settlers game; visual only.
roots.push({src:'pieces/private-play-area.gltf',size:[.4,.004,.4],position:[0,null,.665],rotation:[0,0,0],fixed:true,tint:[1,1,1,1],children:[]});
for(const a of assets.filter(a=>a.quantity))if(used.get(a.id)!==a.quantity+(a.id==='reference'?3:0))throw Error(`Quantity mismatch ${a.id}: ${used.get(a.id)} / ${a.quantity}`);
game.title='Nova';game.surfaceSize=[1.2,2.02];game.children=roots;
await fs.writeFile(root+'sources/game.json',JSON.stringify(game,null,2)+'\n');
console.log('Staged four player kits, shuffled decks and planets; hands await trait choices.');
