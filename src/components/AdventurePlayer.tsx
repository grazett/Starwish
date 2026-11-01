import {useEffect,useRef,useState} from 'react';
import type {PlayerState} from '../gameState';
import {loadWardrobeImages,renderOutfit} from '../wardrobe/render';

let imagesPromise:ReturnType<typeof loadWardrobeImages>|undefined;
// Reuse the exact saved outfit for the stationary outdoor character.
export default function AdventurePlayer({player}:{player:PlayerState}){
 const canvas=useRef<HTMLCanvasElement>(null),[error,setError]=useState(false);
 useEffect(()=>{
  let cancelled=false;setError(false);
  imagesPromise??=loadWardrobeImages();
  imagesPromise.then(images=>{
   if(cancelled)return;
   const source=document.createElement('canvas');source.width=738;source.height=1072;
   renderOutfit(source.getContext('2d')!,images,player);
   const ctx=canvas.current?.getContext('2d');if(!ctx)return;
   const pixels=source.getContext('2d')!.getImageData(0,0,738,1072).data;
   let top=1072,bottom=0;
   for(let y=0;y<1072;y++)for(let x=0;x<738;x++)if(pixels[(y*738+x)*4+3]>64){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   const scale=748/(bottom-top+1);
   ctx.clearRect(0,0,512,790);ctx.imageSmoothingEnabled=false;
   ctx.save();ctx.translate(256,774);ctx.scale(scale,scale);ctx.translate(-369,-bottom);
   ctx.drawImage(source,0,0);ctx.restore();
  }).catch(()=>{imagesPromise=undefined;if(!cancelled)setError(true);});
  return()=>{cancelled=true;};
 },[player]);
 return <>{error&&<span className="adventure-player-error" role="alert">角色加载失败，请刷新重试。</span>}<canvas ref={canvas} width={512} height={790} role="img" aria-label={`${player.nickname}的当前搭配形象`} data-outfit={JSON.stringify(player.items)}/></>;
}
