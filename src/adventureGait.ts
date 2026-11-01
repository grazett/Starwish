// Skin the complete dressed image on one continuous mesh. Adjacent triangles
// share vertices, so clothing and joints never separate into rectangular cuts.
export type Point={x:number;y:number};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const smooth=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function legPose(phase:number,center:number){
 const bob=6+Math.cos(phase*2)*2;
 const hip={x:center,y:680+bob};
 const ankle={x:center+Math.cos(phase)*28,y:885-Math.max(0,Math.sin(phase))*34};
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy);
 const thigh=110,shin=95,along=(thigh*thigh-shin*shin+d*d)/(2*d);
 const bend=Math.sqrt(Math.max(0,thigh*thigh-along*along));
 // Both knees bend toward the direction of travel, never sideways in opposite directions.
 const knee={x:hip.x+dx*along/d-dy*bend/d,y:hip.y+dy*along/d+dx*bend/d};
 return {hip,knee,ankle,bob};
}
export function gaitVertex(x:number,y:number,phase:number,hem:number):Point{
 const side=x<369?0:1,p=phase+side*Math.PI,pose=legPose(p,side?420:317);
 const bob=pose.bob,body={x:x+Math.sin(phase)*1.5,y:y+bob};
 if(y>=680){
  const center=side?420:317,offset=x-center;
  let limb:Point;
  if(y<790){const t=(y-680)/110;limb={x:mix(pose.hip.x,pose.knee.x,t)+offset,y:mix(pose.hip.y,pose.knee.y,t)};}
  else if(y<885){const t=(y-790)/95;limb={x:mix(pose.knee.x,pose.ankle.x,t)+offset,y:mix(pose.knee.y,pose.ankle.y,t)};}
  else limb={x:pose.ankle.x+offset,y:pose.ankle.y+y-885};
  const weight=smooth(hem,hem+28,y);
  return {x:mix(body.x,limb.x,weight),y:mix(body.y,limb.y,weight)};
 }
 // Shoulder-anchored swing: the hands counter the lead leg, while the torso,
 // selected hairstyle, accessories and long sleeves stay attached.
 const arm=(1-smooth(272,302,x))* (1-smooth(650,680,y)) + smooth(437,467,x)*(1-smooth(650,680,y));
 const length=smooth(435,645,y),swing=Math.cos(p)*-14;
 return {x:body.x+arm*length*swing,y:body.y-arm*length*Math.sin(p)*6};
}

const xs=[0,145,209,245,270,290,317,342,369,395,420,449,470,500,535,592,738];
const ys=[0,140,280,400,435,475,520,565,610,645,660,680,710,748,770,790,810,830,850,870,885,905,930,980,1072];
function triangle(ctx:CanvasRenderingContext2D,source:CanvasImageSource,s:Point[],d:Point[]){
 const [a,b,c]=s,[u,v,w]=d;
 const det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
 const aa=((v.x-u.x)*(c.y-a.y)-(w.x-u.x)*(b.y-a.y))/det;
 const bb=((v.y-u.y)*(c.y-a.y)-(w.y-u.y)*(b.y-a.y))/det;
 const cc=((w.x-u.x)*(b.x-a.x)-(v.x-u.x)*(c.x-a.x))/det;
 const dd=((w.y-u.y)*(b.x-a.x)-(v.y-u.y)*(c.x-a.x))/det;
 ctx.save();ctx.beginPath();
 // Subpixel overlap prevents transparent hairlines between rasterized triangles.
 const cx=(u.x+v.x+w.x)/3,cy=(u.y+v.y+w.y)/3;
 for(let i=0;i<3;i++){const p=d[i],dx=p.x-cx,dy=p.y-cy,l=Math.hypot(dx,dy)||1;ctx[i?'lineTo':'moveTo'](p.x+dx/l*.65,p.y+dy/l*.65);}
 ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,u.x-aa*a.x-cc*a.y,u.y-bb*a.x-dd*a.y);ctx.drawImage(source,0,0);ctx.restore();
}
export function paintGait(ctx:CanvasRenderingContext2D,source:CanvasImageSource,phase:number,hem:number){
 const points=ys.map(y=>xs.map(x=>gaitVertex(x,y,phase,hem)));
 for(let row=0;row<ys.length-1;row++)for(let col=0;col<xs.length-1;col++){
  const a={x:xs[col],y:ys[row]},b={x:xs[col+1],y:ys[row]},c={x:xs[col],y:ys[row+1]},d={x:xs[col+1],y:ys[row+1]};
  const aa=points[row][col],bb=points[row][col+1],cc=points[row+1][col],dd=points[row+1][col+1];
  triangle(ctx,source,[a,b,c],[aa,bb,cc]);triangle(ctx,source,[b,d,c],[bb,dd,cc]);
 }
}
