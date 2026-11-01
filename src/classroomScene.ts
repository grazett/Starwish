import {openingImageSource} from './openingImages';
export const classroomDuration=14.5;
export const classroomAssets=['/assets/classroom/room-seated.webp','/assets/classroom/front-desk-window-neighbors-v2.webp','/assets/classroom/classmates-pixel.webp','/assets/classroom/seated-legs.webp','/assets/classroom/desk-narrow.webp',...Array.from({length:4},(_,i)=>`/assets/classroom/daydream-0${i+1}.webp`)].map(openingImageSource);
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
export function classroomPose(t:number){
 const progress=ease((t-1.5)/4.8);
 const cycle=t%2.6;
 return {zoom:1+progress*.65,cameraX:960-progress*360,cameraY:540+progress*10,
  close:ease((t-5.8)/.8),frame:cycle<1.95?0:cycle<2.1?1:cycle<2.3?2:3,
  thought:t>=6.7&&t<11.5,
  black:t<1.2?1-ease(t/1.2):ease((t-13)/1.5)};
}
function cover(ctx:CanvasRenderingContext2D,im:HTMLImageElement){const scale=Math.max(1920/im.width,1080/im.height);ctx.drawImage(im,(1920-im.width*scale)/2,(1080-im.height*scale)/2,im.width*scale,im.height*scale);}
function bubble(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){ctx.fillStyle='#633b29';ctx.fillRect(x-6,y-6,w+12,h+12);ctx.fillStyle='#fff0c9';ctx.fillRect(x,y,w,h);for(const [dx,dy,s] of [[w+18,h+18,20],[w+44,h+47,12],[w+60,h+68,8]]){ctx.fillStyle='#633b29';ctx.fillRect(x+dx-3,y+dy-3,s+6,s+6);ctx.fillStyle='#fff0c9';ctx.fillRect(x+dx,y+dy,s,s);}}
const litFrames=new WeakMap<HTMLImageElement,HTMLCanvasElement>();
const classroomComposites=new WeakMap<HTMLImageElement,HTMLCanvasElement>();
function pixelClassmates(background:HTMLImageElement,edited:HTMLImageElement,panel:HTMLImageElement){
 let canvas=classroomComposites.get(edited);if(canvas)return canvas;
 canvas=document.createElement('canvas');canvas.width=background.width;canvas.height=background.height;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.drawImage(background,0,0);
 // 限定同学头部、上身与腿部范围，窗户、主角课桌和光照使用原背景。
 ctx.save();ctx.scale(canvas.width/1872,canvas.height/841);ctx.beginPath();
 for(const [x,y,w,h] of [[0,250,124,226],[109,279,151,169],[403,281,181,161],[510,260,290,279],[554,652,206,184],[848,271,183,197],[1010,295,129,143],[1122,267,205,204]])ctx.rect(x,y,w,h);
 ctx.clip();ctx.drawImage(edited,0,0,1872,841);ctx.restore();
 ctx.save();ctx.scale(canvas.width/1872,canvas.height/841);ctx.beginPath();ctx.rect(775,560,795,281);ctx.clip();ctx.drawImage(panel,0,0,1872,841);ctx.restore();
 classroomComposites.set(edited,canvas);return canvas;
}
function rightLight(frame:HTMLImageElement){let canvas=litFrames.get(frame);if(canvas)return canvas;canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(frame,0,0);ctx.globalCompositeOperation='source-atop';const light=ctx.createLinearGradient(0,0,frame.width,0);light.addColorStop(0,'rgba(45,30,20,.12)');light.addColorStop(.5,'rgba(255,221,140,0)');light.addColorStop(1,'rgba(255,221,140,.18)');ctx.fillStyle=light;ctx.fillRect(0,0,frame.width,frame.height);litFrames.set(frame,canvas);return canvas;}
export function renderClassroom(ctx:CanvasRenderingContext2D,images:HTMLImageElement[],t:number){
 const [wide,frontOriginal,classmates,legs,panel,...frames]=images,pose=classroomPose(t);
 const front=pixelClassmates(frontOriginal,classmates,panel);
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,1920,1080);
 ctx.save();ctx.translate(960,540);ctx.scale(pose.zoom,pose.zoom);ctx.translate(-pose.cameraX,-pose.cameraY);cover(ctx,wide);
 // 小幅像素待机只覆盖人物上身区域，前景课桌保持原位。
 const idle=Math.sin(t*2.4)>0?0:-1;
 ctx.drawImage(wide,280/1536*wide.width,350/1024*wide.height,180/1536*wide.width,120/1024*wide.height,350,337.5+idle,225,150);
 ctx.restore();
 if(pose.close>0){ctx.save();ctx.globalAlpha=pose.close;
  // 近景镜头向右移480px；人物和家具的场景坐标保持不变。
  // 背景右侧扩展25%，避免镜头平移露出黑边或放大人物。
  ctx.translate(-480,0);ctx.drawImage(front,0,0,2400,1080);
  // 下身保持素材的等比例缩放，膝盖自然露在桌沿下方。
  // 近景允许鞋子被画面下缘裁切，不再为露出鞋子而压缩腿长。
  ctx.drawImage(legs,360,310,500,830,1340,838,200,332);
  // 只恢复实际桌面和挡板，不覆盖整片地面，否则桌下的脚也会被抹掉。
  ctx.save();ctx.beginPath();
  for(const [i,[x,y]] of [[847,573],[1257,573],[1334,650],[1334,674],[807,674],[803,650]].entries()){
   const px=x/1872*2400,py=y/841*1080;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.closePath();ctx.clip();ctx.drawImage(front,0,0,2400,1080);ctx.restore();
  // 与同排同学对齐头身比，原近景上半身放大过度会使腿显得短。
  const anchors=[178,176,178,176],bottoms=[470,471,470,469],frame=frames[pose.frame],scale=.85;
  const y=825-bottoms[pose.frame]*scale;
  // 第一排最靠窗的座位：人物与右侧课桌、椅子共享中心锚点。
  ctx.drawImage(rightLight(frame),Math.round(1440-anchors[pose.frame]*scale),Math.round(y),frame.width*scale,frame.height*scale);
  if(pose.thought){bubble(ctx,790,160,550,110);ctx.fillStyle='#71412a';ctx.font='36px "Starwish IPIX"';ctx.textAlign='center';ctx.fillText('好想出去玩啊……',1065,228);}
  ctx.restore();
 }
 ctx.fillStyle=`rgba(0,0,0,${pose.black})`;ctx.fillRect(0,0,1920,1080);
}




