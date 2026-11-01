// 原图保持不变；坐标以1920×1080为基准，背景上下各留4px。
export const bedroomAssets={room:'/assets/bedroom/room.webp',walk:'/assets/bedroom/palette-v2/walk.webp',clean:'/assets/bedroom/room-clean.webp',open:'/assets/bedroom/room-quilt-open.webp',wake:'/assets/bedroom/wake-continuous-v3-character.webp'};
export const bedroomAssetSources=Object.values(bedroomAssets);
export const duration=12.7;
export const walkFrames=[[140,60,375,620],[680,60,305,620],[1150,60,375,620],[1695,60,350,620]];
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*clamp(t);
const bedroomSprites=new WeakMap<HTMLImageElement,HTMLCanvasElement>();
function warmBedroomSprite(image:HTMLImageElement){
 let canvas=bedroomSprites.get(image);if(canvas)return canvas;
 canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
 // 全部卧室人物帧共享清晨暖光，不再混用烘焙场景与另一套色调。
 ctx.filter='contrast(95%) saturate(95%) sepia(6%)';ctx.drawImage(image,0,0);ctx.filter='none';
 ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(194,120,65,.04)';ctx.fillRect(0,0,image.width,image.height);
 bedroomSprites.set(image,canvas);return canvas;
}
// 抠图输出尺寸可以不同；按透明边界还原用户原帧的位置与统一脚底基线。
type Bounds=[number,number,number,number];
const spriteBounds=new WeakMap<HTMLImageElement,Bounds[]>();
function boundsFor(image:HTMLImageElement,cells=1){
 let cached=spriteBounds.get(image);if(cached)return cached;
 const canvas=warmBedroomSprite(image),data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
 cached=Array.from({length:cells},(_,i)=>{
  const start=Math.floor(i*canvas.width/cells),end=Math.floor((i+1)*canvas.width/cells);
  let left=end,top=canvas.height,right=start,bottom=0;
  for(let y=0;y<canvas.height;y++)for(let x=start;x<end;x++)if(data[(y*canvas.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  return [left,top,right-left+1,bottom-top+1] as Bounds;
 });spriteBounds.set(image,cached);return cached;
}
const wakeFrameTimes=[0,2.6,2.85,3.1,3.35,3.6,3.85,4.4,4.75,5.15,5.7,6.15];
// 用头部位置配准各姿势，床上抬头到床边落脚不重新居中或缩放。
const wakeOrigins: [number,number][]=[[359,338],[372,338],[375,327],[360,322],[313,309],[357,305],[372,311],[392,311],[367,365],[445,455],[381,436],[425,454]];
export function wakeFrameAt(t:number){let index=0;for(let i=1;i<wakeFrameTimes.length;i++)if(t>=wakeFrameTimes[i])index=i;return index;}
const faceAnchors: [number,number][]=[[119,136],[108,135],[115,124],[143,106],[204,98],[179,101],[167,96],[158,100],[186,80],[131,113],[184,71],[147,56]];
const characterCellSize=350;
const spriteScale=characterCellSize/362;
const footAnchors=[334,340,346];
const eyePositions=faceAnchors.map(([fx,fy],i)=>[wakeOrigins[i][0]+fx*430/362,i>=9?850-(footAnchors[i-9]-fy)*spriteScale:wakeOrigins[i][1]+fy*430/362] as [number,number]);
let wakeBlendCanvas:HTMLCanvasElement|undefined;
const smooth=(v:number)=>{const p=clamp(v);return p*p*(3-2*p);};
function drawWakePose(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement,index:number,eyes:[number,number],opacity:number){
 const cell=atlas.width/4,scale=characterCellSize/cell,[fx,fy]=faceAnchors[index];
 const x=eyes[0]-fx*spriteScale-250,y=index>=9?850-footAnchors[index-9]*spriteScale-200:eyes[1]-fy*spriteScale-200;
 const sx=index%4*cell,sy=Math.floor(index/4)*cell;
 // 最后一排抬起的头部超出网格20px，保留这一段，不切掉头顶。
 const extra=index>=8?24*cell/362:0;
 const width=cell;
 const height=cell+extra-(index>=4&&index<8?22*cell/362:0);
 ctx.globalAlpha=opacity;ctx.drawImage(warmBedroomSprite(atlas),sx,sy-extra,width,height,x,y-extra*scale,width*scale,height*scale);
}
function drawWakeFrame(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement,t:number){
 const index=wakeFrameAt(t),next=Math.min(index+1,11);
 const end=wakeFrameTimes[next],start=index===0?end-.25:index===6?end-.25:wakeFrameTimes[index];
 const movement=next===index?0:smooth((t-start)/(end-start));
 const mix=next===index?0:smooth((t-(end-.08))/.08);
 const eyes:[number,number]=[lerp(eyePositions[index][0],eyePositions[next][0],movement),lerp(eyePositions[index][1],eyePositions[next][1],movement)];
 // 在共同的眼部坐标混合真实动作帧，避免整张人物跳位和重叠时变暗。
 wakeBlendCanvas??=document.createElement('canvas');
 if(wakeBlendCanvas.width!==700){wakeBlendCanvas.width=700;wakeBlendCanvas.height=800;}
 const blend=wakeBlendCanvas.getContext('2d')!;blend.clearRect(0,0,700,800);blend.imageSmoothingEnabled=false;
 blend.globalCompositeOperation='lighter';
 drawWakePose(blend,atlas,index,eyes,1-mix);
 if(mix>0)drawWakePose(blend,atlas,next,eyes,mix);
 if(mix>0&&mix<1&&index<9){
  // 面部使用单个完整姿势，避免混合时出现两双眼睛；身体仅做80ms短过渡。
  const headX=eyes[0]-85-250,headY=eyes[1]-110-200;
  blend.clearRect(headX,headY,170,150);blend.save();blend.beginPath();blend.rect(headX,headY,170,150);blend.clip();blend.globalCompositeOperation='source-over';
  drawWakePose(blend,atlas,mix<.5?index:next,eyes,1);blend.restore();
 }
 blend.globalAlpha=1;blend.globalCompositeOperation='source-over';ctx.drawImage(wakeBlendCanvas,250,200);
}
export function bedroomPose(t:number){
 const walk=t>=8&&t<11;
 const progress=clamp((t-8)/3);
 return {walk,visible:t<11,frame:t<3.6?0:1,
  x:walk?lerp(600,360,progress):600,
  feet:walk?lerp(850,875,Math.min(progress*2,1)):lerp(710,850,(t-4.7)/.7),
  bubble:t>=6.4&&t<8,
  cover:t<4.7,
  darkness:t<1.4?1-clamp(t/1.4):t>11.5?clamp((t-11.5)/1.2):0};
}
export function renderBedroom(ctx:CanvasRenderingContext2D,images:HTMLImageElement[],t:number){
 const pose=bedroomPose(t),[room,walk,clean,open,atlas]=images;
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,1920,1080);ctx.drawImage(room,0,4,1920,1072);
 // 编辑素材只贡献对应区域，房间其他像素仍来自用户原图。
 ctx.drawImage(clean,1770/1920*clean.width,990/1072*clean.height,150/1920*clean.width,82/1072*clean.height,1770,994,150,82);
 if(t>=4.4){ctx.save();ctx.globalAlpha=clamp((t-4.4)/.25);ctx.beginPath();ctx.moveTo(479,495);ctx.lineTo(820,495);ctx.lineTo(874,552);ctx.lineTo(854,704);ctx.lineTo(480,704);ctx.closePath();ctx.clip();ctx.drawImage(open,0,4,1920,1072);ctx.restore();}
 if(pose.visible){
  if(pose.walk){
   // 路程决定步态，每120px一个四帧循环，脚底不随帧切换跳动。
   const index=Math.floor((600-pose.x)/30)%4,[sx,sy,sw,sh]=boundsFor(walk,5)[index];
   const h=350,w=sw/sh*h;
   // 新图朝右，显示时整体镜像；原PNG及其他场景的走路图集不变。
   ctx.save();ctx.translate(Math.round(pose.x),Math.round(pose.feet));ctx.scale(-1,1);
   ctx.drawImage(warmBedroomSprite(walk),sx,sy,sw,sh,-Math.round(w/2),-h,Math.round(w),h);ctx.restore();
  }else{
   drawWakeFrame(ctx,atlas,t);
  }
 }
 if(t<4.4){
  // 保留原床铺与被子：初始只露头，坐起逐步显露上半身。
  ctx.save();ctx.beginPath();
  const edge=lerp(530,585,(t-2.55)/1.3);
  ctx.moveTo(425,edge+45);ctx.lineTo(560,edge);ctx.lineTo(690,edge);ctx.lineTo(690,510);ctx.lineTo(800,510);ctx.lineTo(865,555);ctx.lineTo(900,900);ctx.lineTo(300,900);ctx.lineTo(300,730);ctx.closePath();ctx.clip();ctx.drawImage(room,0,4,1920,1072);ctx.restore();
 }
 // 人物放大后提前停在x=360，最宽帧左缘仍在门板右侧。
 if(t>=1.4&&t<3.4){ctx.strokeStyle='#ffe4a7';ctx.lineWidth=5;const d=6+Math.sin(t*35)*3;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(654+side*25,389);ctx.lineTo(654+side*(29+d),380);ctx.stroke();}}
 if(pose.bubble){
  const x=pose.x-170,y=pose.feet-450;ctx.fillStyle='#5b3324';ctx.fillRect(x-5,y-5,350,85);ctx.fillRect(pose.x-8,y+75,22,20);ctx.fillStyle='#fff0c9';ctx.fillRect(x,y,340,75);ctx.fillRect(pose.x-3,y+70,12,18);
  ctx.fillStyle='#71412a';ctx.font='24px "Starwish IPIX"';ctx.textAlign='center';ctx.fillText('啊……怎么又要上学了。',pose.x,y+45);
 }
 ctx.fillStyle=`rgba(0,0,0,${pose.darkness})`;ctx.fillRect(0,0,1920,1080);
}

