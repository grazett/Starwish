export const memoryTargets=[
 {id:'ticket',name:'电影票',image:'/assets/memory-catch/ticket.webp'},
 {id:'mask',name:'口罩',image:'/assets/memory-catch/mask.webp'},
 {id:'sunglasses',name:'蓝色墨镜',image:'/assets/memory-catch/sunglasses.webp'},
 {id:'cake',name:'生日蛋糕',image:'/assets/memory-catch/cake.webp'},
 {id:'photo',name:'拍立得相纸',image:'/assets/memory-catch/photo.webp'},
 {id:'rabbit',name:'小兔子',image:'/assets/memory-catch/rabbit.webp'},
 {id:'temple',name:'天坛',image:'/assets/memory-catch/temple.webp'},
 {id:'wand',name:'魔杖',image:'/assets/memory-catch/wand.webp'},
] as const;
export type MemoryId=typeof memoryTargets[number]['id'];
export type FallingKind=MemoryId|'flower'|'leaf'|'star';
export const catchAssets={basket:'/assets/memory-catch/basket.webp',background:'/assets/memory-catch/background.webp',bib:'/assets/memory-catch/mini-bib.webp'};
export const catchWorld={width:1000,height:562.5,basketWidth:136,basketHeight:138,basketTop:410.5,basketSpeed:620,itemSize:68,spawnInterval:1.25,maxFalling:6};
// Catch at the top of the handle, before the object enters the basket itself.
export const basketCatchY=catchWorld.basketTop+catchWorld.basketHeight*.03;
export function isMemoryId(value:unknown):value is MemoryId{return memoryTargets.some(target=>target.id===value);}
export function normalizeMemories(value:unknown):MemoryId[]{return Array.isArray(value)?memoryTargets.filter(target=>value.includes(target.id)).map(target=>target.id):[];}
export type FallingItem={id:number;kind:FallingKind;x:number;y:number;speed:number;size:number};
export type CatchModel={basketX:number;falling:FallingItem[];collected:MemoryId[];clock:number;nextId:number;offered:Record<MemoryId,number>;complete:boolean};
export type CatchHit={kind:FallingKind;isNew:boolean;x:number;y:number};
export function createCatchModel(collected:MemoryId[]=[]):CatchModel{
 const normalized=normalizeMemories(collected);
 return {basketX:500,falling:[],collected:normalized,clock:.75,nextId:1,offered:Object.fromEntries(memoryTargets.map(target=>[target.id,0])) as Record<MemoryId,number>,complete:normalized.length===8};
}
export function clampBasket(x:number){return Math.max(catchWorld.basketWidth/2,Math.min(catchWorld.width-catchWorld.basketWidth/2,x));}
export function chooseFallingKind(model:CatchModel,random:()=>number=Math.random):FallingKind{
 // Guaranteed target every third spawn. Missing targets use a balanced queue,
 // so unlucky random choices cannot indefinitely hide the last missing kind.
 if(model.nextId%3!==0&&random()<.18)return (['flower','leaf','star'] as const)[Math.floor(random()*3)%3];
 const missing=memoryTargets.filter(target=>!model.collected.includes(target.id));
 let pool=memoryTargets.map(target=>target.id);
 if(missing.length&&(model.nextId%3===0||random()<.82)){
  const least=Math.min(...missing.map(target=>model.offered[target.id]));
  pool=missing.filter(target=>model.offered[target.id]===least).map(target=>target.id);
 }
 const id=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];model.offered[id]++;return id;
}
export function spawnFallingItem(model:CatchModel,random:()=>number=Math.random){
 if(model.complete||model.falling.length>=catchWorld.maxFalling)return;
 const kind=chooseFallingKind(model,random),size=isMemoryId(kind)?catchWorld.itemSize:35;
 model.falling.push({id:model.nextId++,kind,x:38+random()*924,y:-size/2,size,speed:80+random()*22});
}
export function stepCatch(model:CatchModel,delta:number,direction:number,dragX:number|null=null,random:()=>number=Math.random):CatchHit[]{
 if(model.complete)return [];
 const dt=Math.max(0,Math.min(delta,.05)),oldBasket=model.basketX;
 model.basketX=clampBasket(dragX===null?oldBasket+Math.sign(direction)*catchWorld.basketSpeed*dt:dragX);
 const hits:CatchHit[]=[];
 model.falling=model.falling.filter(item=>{
  const before=item.y+item.size*.36;item.y+=item.speed*dt;const after=item.y+item.size*.36;
  if(before<=basketCatchY&&after>=basketCatchY){
   const fraction=(basketCatchY-before)/(after-before||1),basketAtCrossing=oldBasket+(model.basketX-oldBasket)*fraction;
   if(Math.abs(item.x-basketAtCrossing)<=catchWorld.basketWidth*.4+item.size*.24){
    const isNew=isMemoryId(item.kind)&&!model.collected.includes(item.kind);
    if(isNew)model.collected=normalizeMemories([...model.collected,item.kind]);
    hits.push({kind:item.kind,isNew,x:item.x,y:basketCatchY});return false;
   }
  }
  return item.y-item.size/2<=catchWorld.height;
 });
 model.complete=model.collected.length===memoryTargets.length;
 if(model.complete){model.falling=[];return hits;}
 model.clock+=dt;
 if(model.clock>=catchWorld.spawnInterval){model.clock=0;spawnFallingItem(model,random);}
 return hits;
}
