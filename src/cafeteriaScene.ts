import {openingImageSource} from './openingImages';
export const cafeteriaDuration=10;
export const cafeteriaAssets=['/assets/cafeteria/room-clean.webp','/assets/cafeteria/front-lunch.webp','/assets/cafeteria/tray-actions.webp',...Array.from({length:5},(_,i)=>`/assets/cafeteria/eating_frame_0${i+1}.webp`)].map(openingImageSource);
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const n=clamp(v);return n*n*(3-2*n);};
export function cafeteriaPose(t:number){
 const p=clamp((t-.5)/3.15),distance=p*690;
 // 从取餐窗口左侧出发，经空旷过道绕到前排空位。
 const x=p<.4?235+10*p/.4:245+475*(p-.4)/.6;
 const y=p<.4?650+240*p/.4:890+60*(p-.4)/.6;
 const walk=Math.floor(distance/42)%4;
 // 完整夹菜→抬筷→入口→咀嚼→放下动作，不用单帧平移。
 const cycle=[0,1,2,3,4,0],eat=cycle[Math.floor(Math.max(0,t-4.2)/.34)%cycle.length];
 return {x,y,walk:t<3.65?walk:t<3.92?4:5,close:ease((t-4.2)/.35),eat,
  black:t<.65?1-ease(t/.65):ease((t-7.7)/2.3)};
}
function tableMask(ctx:CanvasRenderingContext2D,room:HTMLImageElement){
 ctx.save();ctx.beginPath();
 // 桌面按场景透视遮挡人物下身。
 for(const points of [[[634,915],[1270,735],[1420,772],[790,998]]]){
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
 }
 ctx.clip();ctx.drawImage(room,0,0,1920,1080);ctx.restore();
}
export function renderCafeteria(ctx:CanvasRenderingContext2D,images:HTMLImageElement[],t:number){
 const [room,front,sheet,...eating]=images,p=cafeteriaPose(t);
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,1920,1080);
 ctx.save();const wideZoom=1+.018*ease(t/3);ctx.translate(960,540);ctx.scale(wideZoom,wideZoom);ctx.translate(-960,-540);
 ctx.drawImage(room,0,0,1920,1080);
 const frame=p.walk,cw=sheet.width/3,ch=sheet.height/2;
 const centers=[290,258,226,294,260,235],feet=[497,497,495,482,478,478];
 const scale=.39+.045*clamp((t-.5)/3.15);
 ctx.drawImage(sheet,(frame%3)*cw,Math.floor(frame/3)*ch,cw,ch,Math.round(p.x-centers[frame]*scale),Math.round(p.y-feet[frame]*scale),cw*scale,ch*scale);
 tableMask(ctx,room);ctx.restore();
 if(p.close>0){
  ctx.save();ctx.globalAlpha=p.close;
  const zoom=1+.018*ease((t-4.2)/3.5);ctx.translate(960,640);ctx.scale(zoom,zoom);ctx.translate(-960,-640);
  ctx.drawImage(front,0,0,1920,1080);
  // 上半身原帧等比例呈现，五帧共享桌面接触点。
  const f=eating[p.eat],size=1.06;
  ctx.drawImage(f,Math.round(960-227.5*size),Math.round(915-576*size),f.width*size,f.height*size);
  // 桌面与餐盘在身体前方，遮住上身素材的截断边。
  ctx.drawImage(front,0,front.height*915/1080,front.width,front.height*165/1080,0,915,1920,165);
  ctx.restore();
 }
 ctx.fillStyle=`rgba(0,0,0,${p.black})`;ctx.fillRect(0,0,1920,1080);
}
