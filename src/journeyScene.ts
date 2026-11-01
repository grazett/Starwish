import {openingAssets} from './openingImages';
import {journeyPose} from './journeyTimeline';
export const journeyAssets=openingAssets({road:'/assets/journey/road.webp',bus:'/assets/journey/bus.webp',cloud:'/assets/title/formal/cloud-small.webp'});
export function renderJourney(ctx:CanvasRenderingContext2D,images:Record<string,HTMLImageElement>,t:number){
 const p=journeyPose(t);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,1920,1080);
 const road=images.road,scale=1.16,w=road.width*scale,h=road.height*scale,y=1080-h;
 ctx.drawImage(road,-p.farOffset,y,w,h);
 // The curb naturally separates the fast road from the slower landscape.
 ctx.save();ctx.beginPath();ctx.rect(0,725*scale+y,1920,1080);ctx.clip();
 const offset=p.roadOffset%w;ctx.drawImage(road,-offset,y,w,h);ctx.drawImage(road,w-offset,y,w,h);ctx.restore();
 const cloud=images.cloud;ctx.drawImage(cloud,940-p.cloudOffset,38+Math.sin(t*.5)*3,210,210*cloud.height/cloud.width);
 if(p.busVisible){const bus=images.bus,width=720,height=width*bus.height/bus.width;ctx.drawImage(bus,p.busX,940-height,width,height);}
 const black=Math.max(p.roadBlack,p.endBlack);if(black>0){ctx.fillStyle=`rgba(0,0,0,${black})`;ctx.fillRect(0,0,1920,1080);}
}
