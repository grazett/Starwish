import {baseAsset,basePoses,characterCanvas,colors,garment,garments,resolveOutfitPose,type ColorId,type Garment,type Outfit,type Direction,type Motion} from './catalog';
import {registeredClothPixels,registeredJeansPixels,isUnderlayerFabric,bodyTemplateRows,tailorToBody,type BodyRow} from './registration';
export type WardrobeImages=Map<string,HTMLImageElement>;
export async function loadWardrobeImages():Promise<WardrobeImages>{
 const sources=[...new Set([baseAsset,...Object.values(basePoses).flatMap(frames=>frames??[]),...garments.flatMap(g=>[...(g.src?[g.src]:[]),...(g.repairSrc?[g.repairSrc]:[]),...(g.thumbnail?[g.thumbnail]:[]),...Object.values(g.poses??{}).flatMap(frames=>frames??[])])])];
 return new Map(await Promise.all(sources.map(async src=>{const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error(`素材未加载：${src}`));image.src=src;});
  if(!garments.some(g=>g.thumbnail===src)&&(image.naturalWidth!==characterCanvas.width||image.naturalHeight!==characterCanvas.height))throw new Error(`素材画布不一致：${src}`);
  return [src,image] as const;})));
}
const tintCache=new WeakMap<HTMLImageElement,Map<ColorId,HTMLCanvasElement>>();
const boundsCache=new WeakMap<HTMLImageElement,readonly [number,number,number,number]>();
function alphaBounds(image:HTMLImageElement):readonly [number,number,number,number]{
 const cached=boundsCache.get(image);if(cached)return cached;
 const scratch=document.createElement('canvas');scratch.width=image.naturalWidth;scratch.height=image.naturalHeight;
 const ctx=scratch.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,scratch.width,scratch.height).data;
 let left=scratch.width,top=scratch.height,right=-1,bottom=-1;
 for(let y=0;y<scratch.height;y++)for(let x=0;x<scratch.width;x++)if(pixels[(y*scratch.width+x)*4+3]>64){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 const bounds:readonly [number,number,number,number]=right<left?[0,0,1,1]:[left,top,right-left+1,bottom-top+1];boundsCache.set(image,bounds);return bounds;
}
export function tinted(image:HTMLImageElement,color:ColorId,registeredSource?:HTMLCanvasElement):CanvasImageSource{
 if(color==='original')return registeredSource??image;
 let cache=tintCache.get(image);if(!cache){cache=new Map();tintCache.set(image,cache);}const prior=cache.get(color);if(prior)return prior;
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const ctx=canvas.getContext('2d')!;ctx.drawImage(registeredSource??image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
 const item=garments.find(g=>(g.src&&image.src.endsWith(g.src))||(g.thumbnail&&image.src.endsWith(g.thumbnail)));
 const hex=colors.find(c=>c.id===color)!.hex;const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 for(let i=0;i<pixels.data.length;i+=4){if(!pixels.data[i+3])continue;
  const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width);
  // 长袖素材带有手部遮挡像素，换色只处理布料，保留袖口以下的肤色。
  if(!registeredSource&&!image.src.includes('/complete/')&&image.src.endsWith('/top-cream.png')&&y>=646&&(x<288||x>450))continue;
  // 新素材袖口/裙摆保留少量用于遮挡的手脚像素，换色不能染到皮肤。
  if(!registeredSource&&!image.src.includes('/complete/')&&item?.preserveSkin&&image.naturalWidth===738&&((y>615&&(x<290||x>449))||y>815)){
   const [r,g,b]=pixels.data.slice(i,i+3);if(r>120&&r>g*1.1&&g>b*1.15)continue;
  }
  const lum=.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2];
  const catFabric=item?.id==='cat-hoodie';
  const darkFabric=catFabric||item?.id==='sailor-top';
  if(lum<(darkFabric?23:65))continue;
  // 猫咪图案和字样保留原色；深色布料也能正常更换配色。
  if(catFabric&&x>295&&x<445&&y>470&&y<625&&(lum>170||(pixels.data[i]>115&&pixels.data[i]>pixels.data[i+1]*1.5)))continue;
  const light=darkFabric ? .4+lum/180 : .25+lum/245;
  for(let channel=0;channel<3;channel++)pixels.data[i+channel]=Math.min(255,Math.round(rgb[channel]*light));
 }ctx.putImageData(pixels,0,0);cache.set(color,canvas);return canvas;
}
function drawItem(ctx:CanvasRenderingContext2D,images:WardrobeImages,item:Garment,color:ColorId){
 if(!item.src)return;const source=tinted(images.get(item.src)!,item.id==='bare-feet'?'original':color,repairedWearable(images,item));
 if(item.baseFeet){ctx.drawImage(source,0,841,738,231,0,841,738,231);return;}
 if(item.bodyHem&&!item.repairSrc){ctx.save();ctx.beginPath();ctx.rect(0,0,738,item.bodyHem);ctx.rect(0,item.bodyHem,290,1072-item.bodyHem);ctx.rect(449,item.bodyHem,289,1072-item.bodyHem);ctx.clip();ctx.drawImage(source,0,0);ctx.restore();return;}
 ctx.drawImage(source,0,0);
}
const wearableCache=new WeakMap<HTMLImageElement,HTMLCanvasElement>();
const templateCache=new WeakMap<HTMLImageElement,BodyRow[]>();
function repairedWearable(images:WardrobeImages,item:Garment){
 if(item.id==='blue-jeans'){
  const image=images.get(item.src!)!,prior=wearableCache.get(image);if(prior)return prior;
  const canvas=document.createElement('canvas');canvas.width=738;canvas.height=1072;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,738,1072);pixels.data.set(registeredJeansPixels(pixels.data,738,1072));ctx.putImageData(pixels,0,0);
  wearableCache.set(image,canvas);return canvas;
 }
 if(!item.src||!item.repairSrc)return;
 const image=images.get(item.src)!,prior=wearableCache.get(image);if(prior)return prior;
 // Complete cloth is a single layer. Never combine incompatible outlines from two
 // illustrations or reintroduce the hair/skin fragments in the extracted PNG.
 const source=images.get(item.repairSrc)!;
 const canvas=document.createElement('canvas');canvas.width=738;canvas.height=1072;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
 ctx.drawImage(source,0,0);
 const input=ctx.getImageData(0,0,738,1072);
 const bodyImage=images.get(garment('hair-shoulder-bob').src!)!;
 let template=templateCache.get(bodyImage);
 if(!template){ctx.clearRect(0,0,738,1072);ctx.drawImage(bodyImage,0,0);template=bodyTemplateRows(ctx.getImageData(0,0,738,1072).data,738,1072);templateCache.set(bodyImage,template);}
 const cloth=registeredClothPixels(input.data,738,1072,item.id);
 input.data.set(tailorToBody(cloth,738,1072,item.id,template));ctx.clearRect(0,0,738,1072);ctx.putImageData(input,0,0);
 wearableCache.set(image,canvas);return canvas;
}
const bodyCache=new WeakMap<HTMLImageElement,Map<string,HTMLCanvasElement>>();
function bodyUnderlay(base:HTMLImageElement,mode:'base'|'top'|'dress'):CanvasImageSource{
 if(mode==='base')return base;
 let versions=bodyCache.get(base);if(!versions){versions=new Map();bodyCache.set(base,versions);}
 const prior=versions.get(mode);if(prior)return prior;
 const canvas=document.createElement('canvas');canvas.width=738;canvas.height=1072;
 const ctx=canvas.getContext('2d')!;ctx.drawImage(base,0,0);const pixels=ctx.getImageData(0,0,738,1072);
 // The supplied body contains a white tank and shorts. Hide their neutral cloth
 // and seams in the covered torso instead of letting them protrude at armholes
 // or hips. Skin, hair, face, arms and legs retain their original coordinates.
 for(let y=410;y<(mode==='dress'?687:590);y++)for(let x=280;x<461;x++){
  const at=(y*738+x)*4;
  if(isUnderlayerFabric(pixels.data[at],pixels.data[at+1],pixels.data[at+2]))pixels.data[at+3]=0;
 }
 ctx.putImageData(pixels,0,0);versions.set(mode,canvas);return canvas;
}
export function renderOutfit(ctx:CanvasRenderingContext2D,images:WardrobeImages,outfit:Outfit){
 ctx.clearRect(0,0,738,1072);ctx.imageSmoothingEnabled=false;
 // 底模只有内搭；所有换装层共用原始画布坐标。换鞋前不保留旧鞋轮廓。
 const hair=garment(outfit.items.hair.id),base=images.get(hair.src!)!;
 const underlayMode=outfit.mode==='dress'?'dress':garment(outfit.items.top.id).src?'top':'base';
 ctx.drawImage(bodyUnderlay(base,underlayMode),0,0,738,841,0,0,738,841);
 const slots=outfit.mode==='dress'?['dress','shoes'] as const:['bottom','top','shoes'] as const;
 for(const slot of slots)drawItem(ctx,images,garment(outfit.items[slot].id),outfit.items[slot].color);
 ctx.drawImage(hairForeground(base,hair),0,0);
 drawItem(ctx,images,garment(outfit.items.head.id),outfit.items.head.color);
}
const foregroundCache=new WeakMap<HTMLImageElement,HTMLCanvasElement>();
function hairForeground(base:HTMLImageElement,hair:Garment){
 const prior=foregroundCache.get(base);if(prior)return prior;
 const canvas=document.createElement('canvas');canvas.width=738;canvas.height=1072;
 const ctx=canvas.getContext('2d')!;ctx.drawImage(base,0,0);const pixels=ctx.getImageData(0,0,738,1072);
 // Warm arm shadows can share the hair palette. Exclude the arms and their pixel
 // outlines using a skin-core mask before extracting front locks, rather than
 // pasting those brown skin pixels over a dark/coloured sleeve.
 const skin=new Uint8Array(738*1072);
 for(let y=414;y<690;y++)for(let x=205;x<530;x++){
  if(x>326&&x<412)continue;
  const at=(y*738+x)*4,[r,g,b,a]=pixels.data.slice(at,at+4);
  if(a<128||r<220||g<148||b<80||r<g*1.15||g<b*1.18)continue;
  for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++)skin[(y+dy)*738+x+dx]=1;
 }
 for(let y=400;y<1072;y++)for(let x=0;x<738;x++){
  const i=(y*738+x)*4;if(pixels.data[i+3]<128){pixels.data[i+3]=0;continue;}
  const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
  const inHair=y<414||hair.hairFront?.some(([left,top,w,h])=>x>=left&&x<left+w&&y>=top&&y<top+h);
  // The central waist belongs to the body, never to a front hair lock. In particular,
  // dark tank/shorts outlines must not be pasted back over a newly selected top.
  const bodyWaist=hair.id!=='hair-single-braid'&&y>=570&&x>=280&&x<=460;
  const tieRegion=hair.id==='hair-single-braid'?x>=282&&x<=334&&y>=564&&y<=603:hair.id==='hair-double-braids'&&y>=510&&y<=565&&(x<275||x>468);
  const hairTie=tieRegion&&r>120&&g<95&&b>=g*.8&&b<g*1.6&&r>b*1.4;
  if(!inHair||bodyWaist||skin[y*738+x]||(!hairTie&&(r>=220||g>=165||b>=135||r<g*1.08||g<b*1.02)))pixels.data[i+3]=0;
 }
 ctx.putImageData(pixels,0,0);foregroundCache.set(base,canvas);return canvas;
}
export function renderOutfitPose(ctx:CanvasRenderingContext2D,images:WardrobeImages,outfit:Outfit,direction:Direction,motion:Motion,frame=0){
 const resolved=resolveOutfitPose(outfit,direction,motion);
 if(!resolved.supported)return {supported:false,missing:resolved.missing};
 if(direction==='front'&&motion==='idle'){renderOutfit(ctx,images,outfit);return {supported:true,missing:[]};}
 ctx.clearRect(0,0,738,1072);ctx.imageSmoothingEnabled=false;
 const baseFrames=resolved.base!,base=images.get(baseFrames[frame%baseFrames.length]);
 if(!base)throw new Error('方向动作基础帧未加载');ctx.drawImage(base,0,0);
 for(const layer of resolved.layers){const frames=layer.frames!;if(!frames.length)continue;
  const source=images.get(frames[frame%frames.length]);if(!source)throw new Error(`方向动作服饰帧未加载：${layer.item.id}`);
  ctx.drawImage(tinted(source,outfit.items[layer.slot].color),0,0);
 }return {supported:true,missing:[]};
}
export function renderThumbnail(ctx:CanvasRenderingContext2D,images:WardrobeImages,item:Garment){
 ctx.clearRect(0,0,160,128);ctx.imageSmoothingEnabled=false;
 if(item.repairSrc){
  // Preview the same registered layer that is worn, not a separately fitted picture.
  const source=repairedWearable(images,item)!,[x,y,w,h]=item.bounds,scale=Math.min(140/w,108/h);
  ctx.drawImage(source,x,y,w,h,(160-w*scale)/2,(128-h*scale)/2,w*scale,h*scale);return;
 }
 if(!item.src){
  if(item.thumbnail){const [x,y,w,h]=item.bounds,scale=Math.min(140/w,108/h);ctx.drawImage(images.get(item.thumbnail)!,x,y,w,h,(160-w*scale)/2,(128-h*scale)/2,w*scale,h*scale);}return;
 }
 if(item.thumbnail){
  const image=images.get(item.thumbnail??item.src)!;
  const [x,y,w,h]=alphaBounds(image),scale=Math.min(140/w,108/h);
  ctx.drawImage(image,x,y,w,h,(160-w*scale)/2,(128-h*scale)/2,w*scale,h*scale);return;
 }
 const [x,y,w,h]=item.bounds,scale=Math.min(140/w,108/h);
 ctx.drawImage(images.get(item.src)!,x,y,w,h,(160-w*scale)/2,(128-h*scale)/2,w*scale,h*scale);
}
