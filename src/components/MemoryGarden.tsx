import {useCallback,useEffect,useRef,useState} from 'react';
import {readGameState} from '../gameState';
import {gardenWideBackground,pondBackground,gardenCards,gardenPlayer,gardenPond} from '../memoryGarden';
import {awakenGarden,enterLuckyCabin,readGardenProgress,returnToGarden,viewGardenMemory} from '../memoryGardenState';
import type {MemoryId} from '../memoryCatch';
import {playGameEffect,unlockAudio} from '../audio';
import AdventurePlayer from './AdventurePlayer';
import SharedBackpack from './SharedBackpack';
import {WardrobeMusic} from './WardrobePage';
import GardenMemoryCard from './GardenMemoryCard';
import LuckyCottage from './LuckyCottage';
import '../memoryGarden.css';

export default function MemoryGarden({onReturnToTailor}:{onReturnToTailor?:()=>void}={}){
 const [player]=useState(()=>readGameState().player),[progress,setProgress]=useState(readGardenProgress);
 const [active,setActive]=useState<MemoryId|null>(null),[popping,setPopping]=useState<MemoryId|null>(null);
 const [atPond,setAtPond]=useState(false);
 const [next,setNext]=useState(()=>readGardenProgress().nextEntered),[error,setError]=useState(''),[imageError,setImageError]=useState(false);
 const buttons=useRef<Partial<Record<MemoryId,HTMLButtonElement|null>>>({}),lastBubble=useRef<MemoryId|null>(null);
 const visit=useCallback((id:MemoryId)=>{try{setProgress(viewGardenMemory(id));setError('');}catch{setError('这份回忆暂时未能保存，请重试。');}},[]);
 useEffect(()=>{if(!popping)return;const timer=window.setTimeout(()=>{setActive(popping);setPopping(null);},220);return()=>clearTimeout(timer);},[popping]);
 useEffect(()=>{if(active||popping)return;const id=lastBubble.current;if(id)buttons.current[id]?.focus({preventScroll:true});},[active,popping]);
 const close=()=>setActive(null);
 const wake=()=>{try{const state=awakenGarden();setProgress(state);setAtPond(true);setImageError(false);setError('');}catch{setError('泡泡进度暂时未能保存，请重试。');}};
 const leavePond=()=>{lastBubble.current=null;setAtPond(false);setImageError(false);};
 const openMemory=(id:MemoryId)=>{if(active||popping)return;lastBubble.current=id;if(progress.viewed.includes(id))setActive(id);else{playGameEffect('bubble');setPopping(id);}};
 const proceed=()=>{try{setProgress(enterLuckyCabin());setNext(true);setError('');}catch{setError('入口进度暂时未能保存，请重试。');}};
 const back=()=>{try{setProgress(returnToGarden());setNext(false);setError('');}catch{setError('进度暂时未能保存，请重试。');}};
 if(next)return <LuckyCottage onReturnToGarden={back}/>;
 const card=gardenCards.find(value=>value.id===active);
 return <main className="memory-garden-root" onPointerDown={unlockAudio}><section className={`memory-garden-stage ${atPond?'is-pond-closeup':''}`} aria-label={atPond?'池塘特写':'第三关：回忆花园'}>
  <img key={atPond?'pond':'garden'} className="garden-background" src={atPond?pondBackground:gardenWideBackground} alt={atPond?'池塘特写：花朵环绕的水面，回忆泡泡漂浮在池塘里':'回忆花园：树木和围栏环绕草地，中间是花朵围着的池塘，下方是宽阔的小路'} onError={()=>setImageError(true)} draggable={false}/>
  <header className="garden-header">{atPond&&<p>戳破泡泡，看看里面藏着什么</p>}<span aria-live="polite">已点亮 {progress.viewed.length}/8</span></header>
  <SharedBackpack chapterLabel="回忆花园" overlay closeKey={active??popping??'garden'}/><WardrobeMusic stage="room"/>
  {!atPond&&<><button className="garden-pond" style={{left:`${gardenPond.left}%`,top:`${gardenPond.top}%`,width:`${gardenPond.width}%`,height:`${gardenPond.height}%`}} aria-label="点击发光池塘，进入池塘特写" onClick={wake} disabled={imageError}><span aria-hidden="true"/><small>点击池塘，探索回忆</small></button>
  <div className="garden-player" style={{left:`${gardenPlayer.left}%`,top:`${gardenPlayer.top}%`,width:`${gardenPlayer.width}%`,height:`${gardenPlayer.height}%`}}><AdventurePlayer player={player}/></div></>}
  <div id="garden-memories" className="garden-memories" aria-label="八个回忆泡泡与回忆标记">{atPond&&!imageError&&gardenCards.map((item,index)=>{
   const viewed=progress.viewed.includes(item.id);
   return <button key={item.id} ref={element=>{buttons.current[item.id]=element;}} className={`garden-bubble ${viewed?'is-memory-mark':''} ${popping===item.id?'is-popping':''}`} style={{left:`${item.x}%`,top:`${item.y}%`,animationDelay:popping===item.id?'0s':`${-index*.7}s`}} disabled={active!==null||popping!==null} aria-label={`${viewed?'重看':'戳破'}${item.name}${viewed?'回忆标记':'泡泡'}`} onClick={()=>openMemory(item.id)}><img src={item.icon} alt="" draggable={false}/>{viewed&&<span className="garden-mark-star" aria-hidden="true">✦</span>}</button>;
  })}</div>
  {atPond&&progress.completed&&<section className="garden-complete" aria-label="回忆花园已完成"><p role="status">回忆已点亮</p><button className="garden-action" onClick={proceed}>前往幸运小屋</button></section>}
  {atPond?<button className="garden-back-link" onClick={leavePond}>← 返回花园</button>:onReturnToTailor&&<button className="garden-back-link" onClick={onReturnToTailor}>← 返回裁缝店</button>}
  {error&&!active&&<p className="garden-status-error" role="alert">{error}</p>}{imageError&&<p className="garden-status-error" role="alert">花园背景未能加载，请刷新重试。</p>}
 </section>{card&&<GardenMemoryCard card={card} onClose={close} onViewed={visit} error={error}/>}</main>;
}
