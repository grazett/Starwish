import {useEffect,useRef,useState} from 'react';
import {catchAssets,catchWorld,createCatchModel,isMemoryId,memoryTargets,stepCatch,type CatchHit,type CatchModel,type FallingKind} from '../memoryCatch';
import {readMemoryCatchProgress,saveMemoryCatchProgress} from '../memoryCatchState';
import SharedBackpack from './SharedBackpack';
import {WardrobeMusic} from './WardrobePage';
import '../memoryCatch.css';
import {playGameEffect,unlockAudio} from '../audio';

function snapshot(model:CatchModel){return {...model,falling:model.falling.map(item=>({...item})),collected:[...model.collected]};}
function Distraction({kind}:{kind:FallingKind}){return <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true">{kind==='leaf'?<><path fill="#849867" d="M5 4h14v10h-4v4H7v-4H3V8h2Z"/><path stroke="#d6dca0" strokeWidth="2" d="m7 19 9-11"/></>:kind==='flower'?<><path fill="#dba1a9" d="M9 2h6v5h6v7h-6v7H9v-7H3V7h6Z"/><path fill="#ffe8a2" d="M9 8h6v6H9Z"/></>:<path fill="#e8bf68" d="M10 2h4v6h7v5h-5v8h-4v-5H7v5H3v-8h4V8h3Z"/>}</svg>;}
export function MemoryGallery({collected}:{collected:readonly string[]}){return <ol className="memory-gallery" aria-label="八种回忆物品图鉴">{memoryTargets.map(target=><li key={target.id} className={collected.includes(target.id)?'is-collected':''} aria-label={`${target.name}：${collected.includes(target.id)?'已收集':'尚未收集'}`}><img src={target.image} alt="" draggable={false}/><span>{collected.includes(target.id)?target.name:'？'}</span></li>)}</ol>;}

export default function MemoryCatchGame({onReturn}:{onReturn:()=>void}){
 const [saved,setSaved]=useState(readMemoryCatchProgress);
 const model=useRef(createCatchModel(saved.collected)),[frame,setFrame]=useState(()=>snapshot(model.current));
 const [paused,setPaused]=useState(false),[ready,setReady]=useState(false),[assetError,setAssetError]=useState(false),[retry,setRetry]=useState(0),[saveError,setSaveError]=useState(false);
 const [flash,setFlash]=useState<(CatchHit&{serial:number})|null>(null),serial=useRef(0);
 const field=useRef<HTMLDivElement>(null),keys=useRef(new Set<string>()),touch=useRef(new Map<number,number>()),drag=useRef<{pointer:number;x:number}|null>(null);
 const clearInput=()=>{keys.current.clear();touch.current.clear();drag.current=null;};
 useEffect(()=>{
  let cancelled=false;setReady(false);setAssetError(false);
  Promise.all([...memoryTargets.map(target=>target.image),catchAssets.basket,catchAssets.background].map(src=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=reject;img.src=src;}))).then(()=>{if(!cancelled)setReady(true);},()=>{if(!cancelled)setAssetError(true);});
  return()=>{cancelled=true;};
 },[retry]);
 useEffect(()=>{
  const down=(event:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)||event.ctrlKey||event.metaKey||event.altKey)return;const target=event.target as HTMLElement;if(target.closest('input,textarea,[contenteditable=true]'))return;event.preventDefault();keys.current.add(event.code);};
  const up=(event:KeyboardEvent)=>keys.current.delete(event.code);
  const suspend=()=>{clearInput();setPaused(true);};
  const visibility=()=>{if(document.hidden)suspend();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',visibility);
  return()=>{clearInput();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',suspend);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 const store=()=>{
  try{const next=saveMemoryCatchProgress(model.current.collected);model.current.collected=[...next.collected];model.current.complete=next.completed;if(next.completed)model.current.falling=[];setSaved(next);setSaveError(false);return true;}
  catch{setSaveError(true);setPaused(true);clearInput();return false;}
 };
 useEffect(()=>{
  if(!ready||paused||saveError||saved.completed){clearInput();return;}
  let request=0,last=0,cancelled=false;
  const tick=(now:number)=>{
   if(cancelled)return;
   const delta=last?(now-last)/1000:0;last=now;
   const direction=Number(keys.current.has('ArrowRight')||keys.current.has('KeyD'))-Number(keys.current.has('ArrowLeft')||keys.current.has('KeyA'))+[...touch.current.values()].reduce((sum,value)=>sum+value,0);
   const hits=stepCatch(model.current,delta,direction,drag.current?.x??null);
   if(hits.length)playGameEffect(hits.some(hit=>hit.isNew)?'catch-new':'catch');
   if(hits.length){setFlash({...hits[hits.length-1],serial:++serial.current});}
   const newHits=hits.some(hit=>hit.isNew);
   let savedOkay=true;if(newHits)savedOkay=store();
   setFrame(snapshot(model.current));
   if(!model.current.complete&&savedOkay)request=requestAnimationFrame(tick);
  };
  request=requestAnimationFrame(tick);
  return()=>{cancelled=true;cancelAnimationFrame(request);clearInput();};
 },[ready,paused,saveError,saved.completed]);
 const dragging=(event:React.PointerEvent<HTMLDivElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return (event.clientX-rect.left)/rect.width*catchWorld.width;};
 const hold=(event:React.PointerEvent<HTMLButtonElement>,direction:number)=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);if(!paused&&ready&&!saved.completed)touch.current.set(event.pointerId,direction);};
 const release=(event:React.PointerEvent<HTMLButtonElement>)=>{touch.current.delete(event.pointerId);};
 const target=isMemoryId(flash?.kind)?memoryTargets.find(value=>value.id===flash?.kind):null;
 return <section className="memory-game-shell" aria-label="回忆接接乐小游戏">
  <header className="memory-game-header"><SharedBackpack onOpen={()=>setPaused(true)}/><h1>回忆接接乐</h1><strong aria-live="polite">{frame.collected.length}/8</strong><button className="memory-button" disabled={!ready||saved.completed||saveError} onClick={()=>{unlockAudio();clearInput();setPaused(value=>!value);}}>{paused?'继续':'暂停'}</button><button className="memory-button memory-exit" disabled={saveError} onClick={onReturn}>返回裁缝店</button><WardrobeMusic stage="room"/></header>
  <div className="memory-playfield" ref={field} tabIndex={0} role="region" aria-label="掉落区域，使用左右方向键或 A D 移动篮子，也可以触摸拖动" onPointerDown={event=>{if(paused||!ready||saved.completed||saveError||event.target instanceof HTMLButtonElement)return;field.current?.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId);drag.current={pointer:event.pointerId,x:dragging(event)};}} onPointerMove={event=>{if(drag.current?.pointer===event.pointerId)drag.current.x=dragging(event);}} onPointerUp={event=>{if(drag.current?.pointer===event.pointerId)drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
   <img className="memory-background" src={catchAssets.background} alt="温暖的原木色游戏背景" draggable={false}/>
   {frame.falling.map(item=><div className="memory-falling" key={item.id} data-kind={item.kind} style={{left:`${item.x/10}%`,top:`${item.y/catchWorld.height*100}%`,width:`${item.size/10}%`,height:`${item.size/catchWorld.height*100}%`}}>{isMemoryId(item.kind)?<img src={memoryTargets.find(target=>target.id===item.kind)!.image} alt="" draggable={false}/>:<Distraction kind={item.kind}/>}</div>)}
   <img className="memory-basket" src={catchAssets.basket} alt="玩家控制的竹编篮子" draggable={false} style={{left:`${frame.basketX/10}%`,top:`${catchWorld.basketTop/catchWorld.height*100}%`,width:`${catchWorld.basketWidth/10}%`,height:`${catchWorld.basketHeight/catchWorld.height*100}%`}}/>
   {flash&&<span key={flash.serial} className="memory-catch-spark" style={{left:`${flash.x/10}%`,top:`${flash.y/catchWorld.height*100}%`}} aria-hidden="true">✦</span>}
   {(!ready||paused||saveError)&&!saved.completed&&<div className="memory-game-overlay"><h2>{assetError?'素材暂时未能加载':!ready?'正在准备回忆……':saveError?'先保存这份回忆':'已暂停'}</h2>{assetError?<button className="memory-button" onClick={()=>setRetry(value=>value+1)}>重新加载素材</button>:saveError?<><p>收集进度暂时未能保存，请重试。</p><button className="memory-button" onClick={()=>{if(store())setPaused(false);}}>重试保存并继续</button></>:ready?<button className="memory-button" onClick={()=>{clearInput();setPaused(false);}}>继续收集</button>:null}</div>}
   {saved.completed&&<div className="memory-game-overlay memory-victory"><div className="memory-celebration" aria-hidden="true">✦　✧　✦</div><h2>回忆碎片收集完成！</h2><p>八份回忆，一份也没有落下。</p><button className="memory-button" onClick={onReturn}>返回裁缝店</button></div>}
  </div>
  <div className="memory-touch-controls" aria-label="篮子移动控制"><button className="memory-button" aria-label="向左移动篮子" disabled={paused||!ready||saved.completed} onPointerDown={event=>hold(event,-1)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>◀</button><p>{saved.completed?'回到裁缝小姐身边领取礼物吧。':'方向键 / A D · 也可长按按钮或拖动篮子'}</p><button className="memory-button" aria-label="向右移动篮子" disabled={paused||!ready||saved.completed} onPointerDown={event=>hold(event,1)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>▶</button></div>
  <MemoryGallery collected={frame.collected}/>
  <p className="memory-feedback" aria-live="polite" aria-atomic="true">{flash&&target?(flash.isNew?`收集到：${target.name}`:`${target.name}已经收集过啦`):'漏掉也没关系，它们还会再来。'}</p>
 </section>;
}
