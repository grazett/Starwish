/** All wearables use the character's native 738 × 1072 canvas and (0, 0) origin.
 * Only cloth is sampled; the character is never resized or moved to fit an item. */
export const wearableGrid=2;
type Point=readonly [number,number];
export const wearableFits:Record<string,{sleeveEnd?:readonly [number,number];bodiceScale?:number;neck:readonly Point[]}>={
 'cream-sweater':{sleeveEnd:[662,640],neck:[[333,400],[405,400],[403,434],[394,442],[344,442],[335,434]]},
 'striped-tee':{neck:[[331,400],[409,400],[407,434],[396,444],[343,444],[333,434]]},
 'cat-hoodie':{sleeveEnd:[660,636],neck:[[350,394],[388,394],[390,414],[395,425],[388,438],[370,448],[347,437],[342,425],[350,414]]},
 'sailor-top':{sleeveEnd:[642,626],neck:[[336,398],[404,398],[401,428],[339,428]]},
 'pink-dress':{bodiceScale:1.32,neck:[[331,400],[410,400],[408,432],[397,444],[344,444],[333,432]]},
 'plaid-dress':{bodiceScale:1.1,neck:[[346,398],[394,398],[394,424],[346,424]]},
 'apple-dress':{neck:[[346,400],[394,400],[394,430],[346,430]]},
};
/** Neutral tank/shorts pixels in the torso, distinct from the warm skin/hair palette. */
export function isUnderlayerFabric(r:number,g:number,b:number){return g>=r*.8&&b>=r*.65;}
function inside(x:number,y:number,polygon:readonly Point[]){
 let hit=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
 }
 return hit;
}
export function registeredClothPixels(source:Uint8ClampedArray,width:number,height:number,id:string){
 const result=new Uint8ClampedArray(width*height*4),fit=wearableFits[id];
 if(!fit)throw new Error(`服饰缺少定位配置：${id}`);
 for(let by=0;by<height;by+=wearableGrid)for(let bx=0;bx<width;bx+=wearableGrid){
  const x=Math.min(width-1,bx+wearableGrid/2),y=Math.min(height-1,by+wearableGrid/2);
  // Inventory illustrations include a back collar/lining. Its opening must reveal
  // the actual neck when worn, rather than sit over the throat as an opaque patch.
  if(inside(x,y,fit.neck))continue;
  // Cuffs meet the existing wrists. A smooth arm-only field leaves the neckline,
  // chest, waist and hem at their original coordinates.
  const armWeight=Math.max(0,Math.min(1,(Math.abs(x-369)-78)/25));
  let sy=y,sx=x;
  if(fit.bodiceScale){
   const verticalWeight=Math.max(0,Math.min(1,(y-438)/32,(614-y)/40));
   const horizontalWeight=Math.max(0,Math.min(1,(130-Math.abs(x-369))/30));
   const scale=1+(fit.bodiceScale-1)*verticalWeight*horizontalWeight;
   sx=369+(x-369)/scale;
  }
  if(fit.sleeveEnd&&y>500&&armWeight>0){
   const [from,to]=fit.sleeveEnd;
   const sleeveY=500+(y-500)*(from-500)/(to-500);
   sy=y+(sleeveY-y)*armWeight;
  }
  const sample=(Math.max(0,Math.min(height-1,Math.round(sy)))*width+Math.max(0,Math.min(width-1,Math.round(sx))))*4;
  // Binary alpha eliminates detached semi-transparent fringe pixels and keeps
  // every replacement/colour variant on the very same two-pixel grid.
  if(source[sample+3]<128)continue;
  for(let yy=by;yy<Math.min(height,by+wearableGrid);yy++)for(let xx=bx;xx<Math.min(width,bx+wearableGrid);xx++){
   const at=(yy*width+xx)*4;
   result[at]=source[sample];result[at+1]=source[sample+1];result[at+2]=source[sample+2];result[at+3]=255;
  }
 }
 return result;
}

export type BodyRow={left:number;right:number;bodyLeft:number;bodyRight:number};
/** Read the actual standing body's arm outline and torso, not a clothing thumbnail. */
export function bodyTemplateRows(pixels:Uint8ClampedArray,width:number,height:number):BodyRow[]{
 const rows:BodyRow[]=[];
 for(let y=0;y<height;y++){
  let left=width,right=0,bodyLeft=369,bodyRight=369;
  for(let x=200;x<Math.min(width,539);x++)if(pixels[(y*width+x)*4+3]>=128){left=Math.min(left,x);right=Math.max(right,x);}
  for(let x=285;x<Math.min(width,454);x++){
   const at=(y*width+x)*4;
   if(pixels[at+3]>=128&&isUnderlayerFabric(pixels[at],pixels[at+1],pixels[at+2])){bodyLeft=Math.min(bodyLeft,x);bodyRight=Math.max(bodyRight,x);}
  }
  if(bodyRight-bodyLeft<65){bodyLeft=300;bodyRight=438;}
  rows.push({left,right,bodyLeft:bodyLeft-7,bodyRight:bodyRight+7});
 }
 return rows;
}
const tailoring:Record<string,{sleeveTo:number;ease:number;bodyEase:number}>={
 'cream-sweater':{sleeveTo:640,ease:9,bodyEase:5},
 'striped-tee':{sleeveTo:510,ease:5,bodyEase:3},
 'cat-hoodie':{sleeveTo:638,ease:9,bodyEase:6},
 'sailor-top':{sleeveTo:630,ease:6,bodyEase:3},
 'pink-dress':{sleeveTo:510,ease:5,bodyEase:2},
 'plaid-dress':{sleeveTo:0,ease:0,bodyEase:1},
 'apple-dress':{sleeveTo:642,ease:6,bodyEase:3},
};
function interpolate(x:number,targets:readonly number[],sources:readonly number[]){
 for(let i=1;i<targets.length;i++)if(x<=targets[i]){
  const range=targets[i]-targets[i-1];return range<=0?sources[i]:sources[i-1]+(x-targets[i-1])*(sources[i]-sources[i-1])/range;
 }
 return sources[sources.length-1];
}
/** Continuous row-wise registration: sleeves follow arms, the bodice follows the
 * torso, and the existing skirt is retained below the hip. No character transform. */
export function tailorToBody(source:Uint8ClampedArray,width:number,height:number,id:string,body:readonly BodyRow[]){
 if(id==='apple-dress')return fitAppleDress(source,width,height);
 const out=source.slice(),fit=tailoring[id],dress=id.endsWith('dress');
 for(let y=440;y<Math.min(height,dress?610:660);y+=wearableGrid){
  const row=body[Math.min(y,589)],arms=body[y];
  if(!row||!arms)continue;
  let sl=width,sr=0;
  for(let x=195;x<Math.min(width,545);x++)if(source[(y*width+x)*4+3]>=128){sl=Math.min(sl,x);sr=Math.max(sr,x);}
  if(sr<=sl)continue;
  // Locate the connected bodice; clipping its search to the torso distinguishes
  // sleeves even on rows where shoulder cloth connects all the way across.
  let bl=369,br=369;
  while(bl>285&&source[(y*width+bl-1)*4+3]>=128)bl--;
  while(br<453&&source[(y*width+br+1)*4+3]>=128)br++;
  const targetBL=row.bodyLeft-fit.bodyEase,targetBR=row.bodyRight+fit.bodyEase;
  if(bl===285)bl=targetBL;if(br===453)br=targetBR;
  bl=Math.max(sl,Math.min(bl,368));br=Math.min(sr,Math.max(br,370));
  const sleeve=y<=fit.sleeveTo&&sl<bl-5&&sr>br+5;
  const tl=sleeve?Math.min(targetBL-2,arms.left-fit.ease):targetBL;
  const tr=sleeve?Math.max(targetBR+2,arms.right+fit.ease):targetBR;
  const influence=Math.max(0,Math.min(1,(y-440)/30,dress?(610-y)/25:1));
  const targets=[195,sl+(tl-sl)*influence,bl+(targetBL-bl)*influence,369,br+(targetBR-br)*influence,sr+(tr-sr)*influence,545];
  const sources=[195,sl,bl,369,br,sr,545];
  for(let x=195;x<Math.min(width,545);x+=wearableGrid){
   const sx=Math.max(0,Math.min(width-1,Math.round(interpolate(x+1,targets,sources))));
   const sample=(y*width+sx)*4;
   for(let dy=0;dy<wearableGrid&&y+dy<height;dy++)for(let dx=0;dx<wearableGrid&&x+dx<width;dx++){
    const at=((y+dy)*width+x+dx)*4;
    for(let c=0;c<4;c++)out[at+c]=source[sample+c];
   }
  }
 }
 return id==='cat-hoodie'?closeCatHood(out,width,height):out;
}

/** One landmark map for the whole apple outfit. Its original raised waist is
 * lowered to the body's waistband; sleeves meet the wrists independently of
 * the bib. Sampling once avoids the compounded distortions of two sleeve fits. */
export function fitAppleDress(source:Uint8ClampedArray,width:number,height:number){
 const out=new Uint8ClampedArray(source.length);
 for(let y=0;y<height;y+=wearableGrid)for(let x=0;x<width;x+=wearableGrid){
  const px=x+1,py=y+1;
  const torso=Math.max(0,Math.min(1,(px-280)/28,(458-px)/28));
  const torsoY=interpolate(py,[0,418,448,568,586,654,796,height],[0,418,448,548,566,640,796,height]);
  const sleeveY=interpolate(py,[0,418,448,540,626,648,796,height],[0,418,448,540,638,660,796,height]);
  // The illustrated straps/sleeve caps start below the body's shoulder ridge.
  // Lift only that ridge; the centre collar, waist and cuffs keep their anchors.
  const distance=Math.abs(px-369);
  const shoulder=Math.max(0,Math.min(1,(distance-28)/20,(110-distance)/30,(py-394)/24,(490-py)/42));
  const sy=Math.round(sleeveY+(torsoY-sleeveY)*torso+16*shoulder);
  const armShift=interpolate(py,[0,418,450,480,540,626,660,700,height],[0,0,-8,-16,-10,16,16,0,0]);
  const waist=Math.max(0,Math.min(1,(py-448)/100,(690-py)/104));
  const bodyX=369+(px-369)/(1-.045*waist);
  const sleeveX=px+(px<369?-armShift:armShift);
  const sx=Math.round(sleeveX+(bodyX-sleeveX)*torso);
  if(sx<0||sx>=width||sy<0||sy>=height)continue;
  const at=(sy*width+sx)*4;if(source[at+3]<128)continue;
  for(let dy=0;dy<wearableGrid&&y+dy<height;dy++)for(let dx=0;dx<wearableGrid&&x+dx<width;dx++){
   const dest=((y+dy)*width+x+dx)*4;for(let c=0;c<4;c++)out[dest+c]=source[at+c];
  }
 }
 return out;
}

/** The original denim extraction contains almost transparent old body pixels.
 * Retain only the connected trousers between waist and cuffs, without changing
 * their native coordinates or recolouring their fabric. */
export function registeredJeansPixels(source:Uint8ClampedArray,width:number,height:number){
 const out=new Uint8ClampedArray(source.length),seen=new Uint8Array(width*height),queue:number[]=[];
 const seed=600*width+369;
 if(source[seed*4+3]<128)throw new Error('牛仔裤腰部锚点缺失');
 queue.push(seed);seen[seed]=1;
 for(let head=0;head<queue.length;head++){
  const p=queue[head],x=p%width,y=Math.floor(p/width),at=p*4;
  out[at]=source[at];out[at+1]=source[at+1];out[at+2]=source[at+2];out[at+3]=255;
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
   const nx=x+dx,ny=y+dy,np=ny*width+nx;
   const left=ny<680?280:270,right=ny<680?460:470;
   if(nx<left||nx>=right||ny<580||ny>=862||seen[np]||source[np*4+3]<128)continue;
   seen[np]=1;queue.push(np);
  }
 }
 return out;
}

/** Close extraction pinholes in the hood, retaining the deliberate neck opening.
 * Short hair reveals these gaps; long hair used to conceal them. */
export function closeCatHood(source:Uint8ClampedArray,width:number,height:number){
 const out=source.slice(),dilated=new Uint8Array(width*height),radius=6;
 for(let y=386;y<466;y++)for(let x=290;x<452;x++){
  for(let dy=-radius;dy<=radius&&!dilated[y*width+x];dy++)for(let dx=-radius;dx<=radius;dx++){
   if(source[((y+dy)*width+x+dx)*4+3]>=128){dilated[y*width+x]=1;break;}
  }
 }
 for(let y=394;y<456;y+=wearableGrid)for(let x=300;x<442;x+=wearableGrid){
  const at=(y*width+x)*4;
  if(source[at+3]>=128||inside(x+1,y+1,wearableFits['cat-hoodie'].neck))continue;
  let closed=true;
  for(let dy=-radius;dy<=radius&&closed;dy++)for(let dx=-radius;dx<=radius;dx++)if(!dilated[(y+dy)*width+x+dx]){closed=false;break;}
  if(!closed)continue;
  let sample=-1,distance=Infinity;
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   const i=((y+dy)*width+x+dx)*4,d=dx*dx+dy*dy;
   if(source[i+3]>=128&&d<distance){distance=d;sample=i;}
  }
  if(sample<0)continue;
  for(let dy=0;dy<wearableGrid;dy++)for(let dx=0;dx<wearableGrid;dx++){
   const i=((y+dy)*width+x+dx)*4;for(let c=0;c<4;c++)out[i+c]=source[sample+c];
  }
 }
 return out;
}

