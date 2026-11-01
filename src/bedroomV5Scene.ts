import {openingAssets} from './openingImages';
import {bedroomFrameRegistration} from './bedroomV5Frames';
import {bedroomLayerOffsets} from './bedroomLayerOffsets';

export const bedroomAssets=openingAssets({
 room:'/assets/bedroom/room.webp',walk:'/assets/bedroom/palette-v2/walk.webp',
 clean:'/assets/bedroom/room-clean.webp',a:'/assets/bedroom/scale-v6/a.webp',
 b:'/assets/bedroom/scale-v6/b.webp',c:'/assets/bedroom/scale-v6/c.webp',empty:'/assets/bedroom/scene-v5/empty-foreground.webp',
 maskA:'/assets/bedroom/layers-v7/a.webp',maskB:'/assets/bedroom/layers-v7/b.webp',maskC:'/assets/bedroom/layers-v7/c.webp',
 footRepair:'/assets/bedroom/bed-foot-repair-v8.webp',
});
export const bedroomAssetSources=Object.values(bedroomAssets);
export const duration=12.7;
type FrameKey=keyof typeof bedroomFrameRegistration;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*clamp(t);
const sceneWidth=560,sceneX=260,sceneY=280;
// 图集中有一帧眨眼时肩膀倒退，按动作顺序筛选；C补齐半坐起的缺帧。
export const bedroomWakeTimeline:readonly [number,FrameKey][]=[
 [0,'a0'],[2.4,'a1'],[2.55,'a2'],[2.7,'a4'],[2.85,'a3'],
 [3,'c0'],[3.14,'c1'],[3.28,'c2'],[3.42,'c3'],[3.56,'c4'],[3.7,'c5'],
 [3.84,'a8'],[3.98,'a9'],[4.12,'b0'],[4.26,'b0'],
 [4.4,'b1'],[4.56,'b2'],[4.72,'b3'],[4.88,'b4'],[5.04,'b5'],
 [5.2,'b6'],[5.36,'b7'],[5.52,'b8'],[5.76,'b9'],[6,'b10'],[6.24,'b11'],
];
export function bedroomWakeFrameAt(t:number):FrameKey{
 let key:FrameKey='a0';for(const [time,frame] of bedroomWakeTimeline)if(t>=time)key=frame;return key;
}
const panelCaches=new WeakMap<HTMLImageElement,Map<string,HTMLCanvasElement>>();
function getPanel(image:HTMLImageElement,key:FrameKey|'empty'){
 let cache=panelCaches.get(image);if(!cache){cache=new Map();panelCaches.set(image,cache);}
 const previous=cache.get(key);if(previous)return previous;
 const canvas=document.createElement('canvas');canvas.width=sceneWidth;canvas.height=sceneWidth;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
 if(key==='empty')ctx.drawImage(image,0,0,sceneWidth,sceneWidth);
 else{
  const {rect,shift:[dx,dy]}=bedroomFrameRegistration[key];
  const originalWidth=key.startsWith('c')?1536:1448,ratio=image.width/originalWidth;
  const [sx,sy,sw,sh]=rect.map(v=>v*ratio);
  // 以固定床头柜配准整个床铺画面，不独立移动人物、不拉伸身体。
  const margin=1.5*ratio,scale=sceneWidth/(sw-2*margin);
  // C的抠图仍包含床外拖鞋，只使用床铺与人物范围；原房间的拖鞋保持原位。
  const sourceHeight=key.startsWith('c')?Math.min(sh-2*margin,390*ratio):sh-2*margin;
  ctx.drawImage(image,sx+margin,sy+margin,sw-2*margin,sourceHeight,-dx*sceneWidth/362,-dy*sceneWidth/362,sceneWidth,sourceHeight*scale);
 }cache.set(key,canvas);return canvas;
}
const movingLayerCaches=new WeakMap<HTMLImageElement,Map<string,HTMLCanvasElement>>();
function getMovingLayer(image:HTMLImageElement,mask:HTMLImageElement,key:FrameKey){
 let cache=movingLayerCaches.get(image);if(!cache){cache=new Map();movingLayerCaches.set(image,cache);}
 const previous=cache.get(key);if(previous)return previous;
 const canvas=document.createElement('canvas');canvas.width=sceneWidth;canvas.height=sceneWidth;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
 ctx.drawImage(getPanel(image,key),0,0);
 const matte=document.createElement('canvas');matte.width=sceneWidth;matte.height=sceneWidth;
 const m=matte.getContext('2d')!;m.imageSmoothingEnabled=false;
 const cols=key.startsWith('c')?3:4,rows=key.startsWith('c')?2:3,index=Number(key.slice(1));
 const sw=mask.width/cols,sh=mask.height/rows;
 const [dx,dy]=bedroomLayerOffsets[key],[rx,ry]=bedroomFrameRegistration[key].shift;
 const x=(dx-rx)*sceneWidth/362,y=(dy-ry)*sceneWidth/362;
 // 只留少量像素余量，避免把枕头/床垫边缘带成角色外侧的一圈描边。
 for(const [ox,oy] of [[0,0],[-4,0],[4,0],[0,-4],[0,4],[-3,-3],[3,-3],[-3,3],[3,3]])
  m.drawImage(mask,index%cols*sw,Math.floor(index/cols)*sh,sw,sh,x+ox,y+oy,sceneWidth,sceneWidth*sh/sw);
 ctx.globalCompositeOperation='destination-in';ctx.drawImage(matte,0,0);ctx.globalCompositeOperation='source-over';
 // 抠图的半透明杂边不属于角色轮廓；保持像素边缘实心、清晰。
 const pixels=ctx.getImageData(0,0,sceneWidth,sceneWidth);
 for(let i=0;i<pixels.data.length;i+=4){
  const alpha=pixels.data[i+3];
  const x=(i/4)%sceneWidth,y=Math.floor(i/4/sceneWidth);
  const [r,g,b]=[pixels.data[i],pixels.data[i+1],pixels.data[i+2]];
  // 左侧头发/手臂外缘混入的浅灰紫枕头像素回到固定底层；深棕轮廓不受影响。
  const pillowFringe=x<280&&y<350&&g>110&&b>=g-7&&r-b<50;
  if(alpha<192||pillowFringe)pixels.data[i+3]=0;
  else pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 cache.set(key,canvas);return canvas;
}
type Bounds=[number,number,number,number];
const walkCache=new WeakMap<HTMLImageElement,{image:HTMLCanvasElement;frames:Bounds[]}>();
function getWalk(image:HTMLImageElement){
 const previous=walkCache.get(image);if(previous)return previous;
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
 // 与参考房间的清晨暖光统一，原角色图不修改。
 ctx.filter='hue-rotate(-4deg) saturate(108%)';ctx.drawImage(image,0,0);ctx.filter='none';
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 const frames=Array.from({length:5},(_,i)=>{
  const from=Math.floor(i*canvas.width/5),to=Math.floor((i+1)*canvas.width/5);
  let left=to,top=canvas.height,right=from,bottom=0;
  for(let y=0;y<canvas.height;y++)for(let x=from;x<to;x++)if(pixels[(y*canvas.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  return [left,top,right-left+1,bottom-top+1] as Bounds;
 });const result={image:canvas,frames};walkCache.set(image,result);return result;
}
export function bedroomPose(t:number){
 const walk=t>=8&&t<11,progress=clamp((t-8)/3);
 // 先离开床沿，再从床头柜前方走向门；脚底先进入通道，避免身体切过柜子。
 return {walk,visible:t<11,x:walk?lerp(580,300,clamp((progress-.22)/.78)):580,
  feet:walk?lerp(750,875,clamp(progress/.35)):750,bubble:t>=6.4&&t<8,
  darkness:t<1.4?1-clamp(t/1.4):t>11.5?clamp((t-11.5)/1.2):0};
}
export function prepareBedroom(images:HTMLImageElement[]){
 const a=images[3],b=images[4],c=images[5],empty=images[6];
 for(const [,key] of bedroomWakeTimeline){const index=key.startsWith('a')?0:key.startsWith('b')?1:2;getMovingLayer([a,b,c][index],images[7+index],key);}
 getPanel(empty,'empty');getWalk(images[1]);
}
export function renderBedroom(ctx:CanvasRenderingContext2D,images:HTMLImageElement[],t:number){
 ctx.canvas.dataset.sceneTime=t.toFixed(3);
 const [room,walk,clean,a,b,c,empty,maskA,maskB,maskC,footRepair]=images,pose=bedroomPose(t);
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,1920,1080);ctx.drawImage(room,0,4,1920,1072);
 ctx.drawImage(clean,1770/1920*clean.width,990/1072*clean.height,150/1920*clean.width,82/1072*clean.height,1770,994,150,82);
 // Remove the old mattress protruding beyond the registered animation panel.
 // Only the static foot-end region is repaired; character and wake masks stay intact.
 ctx.drawImage(footRepair,790/1920*footRepair.width,480/1080*footRepair.height,100/1920*footRepair.width,270/1080*footRepair.height,790,480,100,270);
 const drawCabinet=()=>{
  // 按台灯、书和柜子的轮廓恢复前景，不能用矩形把旧枕头一并覆盖回来。
  ctx.save();ctx.translate(0,4);ctx.beginPath();
  const outlines=[
   [[264,480],[312,480],[330,505],[337,551],[320,565],[304,565],[304,587],[320,596],[320,607],[268,607],[268,587],[283,587],[283,565],[246,554],[250,508]],
   [[286,555],[386,555],[394,573],[386,599],[353,636],[286,636]],
   [[232,633],[255,610],[397,578],[405,580],[405,724],[365,783],[239,786],[239,655]],
  ];
  for(const points of outlines){ctx.moveTo(...points[0] as [number,number]);for(const point of points.slice(1))ctx.lineTo(...point as [number,number]);ctx.closePath();}
  ctx.clip();ctx.drawImage(room,0,0,1920,1072);ctx.restore();
 };
 if(t<8){
  const key=bedroomWakeFrameAt(t),image=key.startsWith('a')?a:key.startsWith('b')?b:c;
  const mask=key.startsWith('a')?maskA:key.startsWith('b')?maskB:maskC;
  // 固定床架、枕头与床垫，只叠加人物和被子动作，家具不再随帧切换晃动。
  ctx.drawImage(getPanel(empty,'empty'),sceneX,sceneY);
  ctx.drawImage(getMovingLayer(image,mask,key),sceneX,sceneY);
  // 手臂下方的床垫侧面属于固定家具，遮罩边缘不能让它随身体一起抖动。
  ctx.drawImage(getPanel(empty,'empty'),0,355,230,125,sceneX,sceneY+355,230,125);
 }else{
  ctx.drawImage(getPanel(empty,'empty'),sceneX,sceneY);
  // 到地面通道后人物在柜子前方，柜子不能继续覆盖她的头发、身体和手臂。
  drawCabinet();
  if(pose.visible){
   const data=getWalk(walk),distance=Math.hypot(580-pose.x,pose.feet-750),index=Math.floor(distance/22)%4,[sx,sy,sw,sh]=data.frames[index];
   const h=396,w=sw/sh*h;
   ctx.fillStyle='#57352928';ctx.beginPath();ctx.ellipse(pose.x,pose.feet+2,28,6,0,0,Math.PI*2);ctx.fill();
   ctx.save();ctx.translate(Math.round(pose.x),Math.round(pose.feet));ctx.scale(-1,1);
   ctx.drawImage(data.image,sx,sy,sw,sh,-Math.round(w/2),-h,Math.round(w),h);ctx.restore();
  }
 }
 // 床头柜位于床前，恢复原图前景，床沿不能压在柜子和台灯上方。
 if(t<8)drawCabinet();
 // 保持原闹钟、内心文字与淡出节奏。
 if(t>=1.4&&t<3.4){ctx.strokeStyle='#ffe4a7';ctx.lineWidth=5;const d=6+Math.sin(t*35)*3;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(654+side*25,389);ctx.lineTo(654+side*(29+d),380);ctx.stroke();}}
 if(pose.bubble){
  const x=pose.x-170,y=pose.feet-540;ctx.fillStyle='#5b3324';ctx.fillRect(x-5,y-5,350,85);ctx.fillRect(pose.x-8,y+75,22,20);ctx.fillStyle='#fff0c9';ctx.fillRect(x,y,340,75);ctx.fillRect(pose.x-3,y+70,12,18);
  ctx.fillStyle='#71412a';ctx.font='24px "Starwish IPIX"';ctx.textAlign='center';ctx.fillText('啊……怎么又要上学了。',pose.x,y+45);
 }
 ctx.fillStyle=`rgba(0,0,0,${pose.darkness})`;ctx.fillRect(0,0,1920,1080);
}
