import {openingAssets} from './openingImages';
import {walkFrames} from './bedroomScene';
export const corridorDuration=10.6;
export const corridorAssets=openingAssets({closed:'/assets/corridor/elevator-closed.webp',half:'/assets/corridor/elevator-half.webp',open:'/assets/corridor/elevator-open.webp',clean:'/assets/corridor/room-clean.webp',walk:'/assets/bedroom/walk-left.webp',parcel:'/assets/corridor/parcel.webp',stand:'/assets/bedroom/get-up.webp',curious:'/assets/corridor/stand-curious.webp',letter:'/assets/corridor/letter-original.webp'});
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const n=clamp(v);return n*n*(3-2*n);};
export function corridorPose(t:number){
 const exit=clamp((t-2.8)/1.4),walk=clamp((t-4.2)/4.4),focus=ease((t-9)/1.6);
 const x=t<4.2?300+170*exit:470+480*walk,feet=t<4.2?740+75*exit:815-10*walk;
 const opened=ease((t-.8)/2),closing=ease((t-5)/1.5);
 return {x,feet,height:330+40*exit,frame:t<2.8||t>=8.6?1:Math.floor((x-300)/28)%4,
  door:opened*(1-closing),inside:feet<770,question:t>=8.6,zoom:1+.12*focus,pan:70*focus,black:1-ease(t/1),ready:t>=corridorDuration};
}
export function corridorParcelBounds(t:number){
 const p=corridorPose(t),s=1.25*p.zoom;
 return {left:(960-p.pan*1.25+(1080-768)*s)/1920*100,top:(540+(733-512)*s)/1080*100,width:110*s/1920*100,height:102*s/1080*100};
}
function character(ctx:CanvasRenderingContext2D,walk:HTMLImageElement,stand:HTMLImageElement,curious:HTMLImageElement,t:number){
 if(t<2.8||t>=8.6){const p=corridorPose(t),scale=p.height/800,width=360*scale,left=p.x-width/2,top=p.feet-p.height;
  ctx.drawImage(stand,1340,20,360,800,left,top,width,p.height);
  // 只覆盖疑惑表情范围，头发、衣服和站姿始终来自原始站立帧。
  if(t>=8.6)ctx.drawImage(curious,1460*curious.width/stand.width,130*curious.height/stand.height,190*curious.width/stand.width,160*curious.height/stand.height,left+120*scale,top+110*scale,190*scale,160*scale);
  return;}
 const p=corridorPose(t),[sx,sy,sw,sh]=walkFrames[p.frame],width=sw/sh*p.height;
 ctx.save();ctx.translate(p.x,p.feet);ctx.scale(-1,1);
 ctx.drawImage(walk,sx,sy,sw,sh,-width/2,-p.height,width,p.height);ctx.restore();
}
function question(ctx:CanvasRenderingContext2D,x:number,y:number){
 ctx.fillStyle='#663d28';ctx.fillRect(x-25,y-28,50,52);ctx.fillRect(x-8,y+24,12,8);
 ctx.fillStyle='#fff0c9';ctx.fillRect(x-21,y-24,42,44);ctx.fillRect(x-4,y+20,8,8);
 const pattern=['01110','11011','00011','00110','00100','00000','00100'];ctx.fillStyle='#704123';
 pattern.forEach((row,iy)=>[...row].forEach((v,ix)=>{if(v==='1')ctx.fillRect(x-10+ix*4,y-17+iy*4,4,4);}));
}
export function renderCorridor(ctx:CanvasRenderingContext2D,images:HTMLImageElement[],t:number,clock:number,clicked=false,clickProgress=0){
 const [closed,half,open,clean,walk,parcel,stand,curious]=images,p=corridorPose(t);
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,1920,1080);
 ctx.save();ctx.translate(960-p.pan*1.25,540);ctx.scale(1.25*p.zoom,1.25*p.zoom);ctx.translate(-768,-512);
 ctx.drawImage(closed,0,0,1536,1024);
 // 清理图仅贡献水印所在外框区域，原走廊其他像素不改变。
 ctx.drawImage(clean,clean.width*1400/1536,clean.height*950/1024,clean.width*136/1536,clean.height*74/1024,1400,950,136,74);
 ctx.save();ctx.beginPath();ctx.rect(185,286,229,470);ctx.clip();
 ctx.drawImage(open,185,286,229,470,185,286,229,470);
 // 半开素材补充中间轿厢细节，门板本身始终连续滑动。
 if(p.door<.5){ctx.globalAlpha=1-p.door*2;ctx.drawImage(half,277,293,67,456,277,293,67,456);ctx.globalAlpha=1;}
 if(p.inside)character(ctx,walk,stand,curious,t);
 const gap=p.door<.5?p.door*160:80+(p.door-.5)*298;
 ctx.drawImage(closed,185,286,114,470,185-gap/2,286,114,470);
 ctx.drawImage(closed,299,286,115,470,299+gap/2,286,115,470);
 ctx.restore();
 if(!p.inside)character(ctx,walk,stand,curious,t);
 if(p.question)question(ctx,p.x,p.feet-p.height-42);
 ctx.save();ctx.globalAlpha=p.ready&&!clicked ? .86+.14*Math.sin(clock*2) : 1;
 const pulse=clicked?Math.sin(Math.PI*clamp(clickProgress)):0,scale=1+pulse*.08;
 ctx.shadowColor='#ffdf91';ctx.shadowBlur=pulse*12;
 ctx.drawImage(parcel,1135-55*scale,784-51*scale,110*scale,102*scale);ctx.restore();
 if(p.ready&&!clicked){ctx.fillStyle='#ffedb8';for(const [i,[x,y]] of [[1068,744],[1200,759],[1164,720]].entries()){const a=(Math.sin(clock*2+i*2)+1)/2;ctx.globalAlpha=a;ctx.fillRect(x-2,y-6,4,12);ctx.fillRect(x-6,y-2,12,4);}ctx.globalAlpha=1;}
 ctx.restore();ctx.fillStyle=`rgba(0,0,0,${p.black})`;ctx.fillRect(0,0,1920,1080);
}
