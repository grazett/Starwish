import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {inventoryChanged,inventoryKey,type InventoryItemId} from '../inventory';
import {synthesisAssets,synthesisDuration,synthesisItem,synthesisItemIds,synthesisSlots,synthesisSourceUrl,type SynthesisItemId} from '../synthesis';
import {beginSynthesis,completeSynthesis,ownedSynthesisItems,placeSynthesisItem,readSynthesisProgress,removeSynthesisItem,startSynthesisGuide,type SynthesisProgress} from '../synthesisState';
import {playGameEffect,unlockAudio} from '../audio';
import {useGameEffect} from '../useGameEffect';
import SharedBackpack from './SharedBackpack';
import GiftReveal from './GiftReveal';
import {beginGiftOpening,readGiftReveal} from '../giftRevealState';
import {WardrobeMusic} from './WardrobePage';
import '../synthesis.css';

function load(){try{return {progress:readSynthesisProgress(),owned:ownedSynthesisItems(),hasReveal:readGiftReveal().phase!=='sealed',error:''};}catch{return {progress:null,owned:[] as SynthesisItemId[],hasReveal:false,error:'合成进度暂时无法读取，请保留当前存档后重试。'};}}
export default function SynthesisRoom({onReturnToLucky}:{onReturnToLucky?:()=>void}={}){
 const [initial]=useState(load),[progress,setProgress]=useState<SynthesisProgress|null>(initial.progress),[owned,setOwned]=useState(initial.owned),[error,setError]=useState(initial.error);
 const [showReveal,setShowReveal]=useState(initial.hasReveal),[imageError,setImageError]=useState(false);
 const starting=useRef(false),openingGift=useRef(false);
 const busy=!!progress&&!progress.completed&&progress.startedAt!==null;
 useGameEffect('synthesis',busy?progress!.startedAt:null);
 const elapsed=progress?.startedAt===null||!progress?0:Math.max(0,Date.now()-progress.startedAt);
 const timeline=useRef({start:progress?.startedAt,elapsed});
 if(timeline.current.start!==progress?.startedAt)timeline.current={start:progress?.startedAt,elapsed};
 useEffect(()=>{
  const refresh=()=>{try{setOwned(ownedSynthesisItems());setProgress(readSynthesisProgress());}catch{setError('背包或合成进度暂时无法读取，请重试。');}};
  const storage=(event:StorageEvent)=>{if(event.key===inventoryKey||event.key===null||event.key?.endsWith('starwish-synthesis-v1'))refresh();};
  window.addEventListener(inventoryChanged,refresh);window.addEventListener('storage',storage);
  return()=>{window.removeEventListener(inventoryChanged,refresh);window.removeEventListener('storage',storage);};
 },[]);
 const finish=()=>{try{setProgress(completeSynthesis());setError('');}catch{setError('合成进度未能保存，请点击「重试保存」。');}};
 useEffect(()=>{
  if(!progress||progress.completed||progress.startedAt===null)return;
  const remaining=Math.max(0,synthesisDuration-(Date.now()-progress.startedAt));
  const timer=window.setTimeout(()=>{try{setProgress(completeSynthesis());setError('');}catch{setError('合成进度未能保存，请点击「重试保存」。');}},remaining);
  return()=>clearTimeout(timer);
 },[progress?.startedAt,progress?.completed]);
 const place=(id:InventoryItemId)=>{if(!progress||busy||progress.completed||!progress.introSeen||!synthesisItemIds.includes(id))return;try{const next=placeSynthesisItem(id);setProgress(next);if(!progress.placed.includes(id))playGameEffect('slot');setError('');}catch{setError('宝物暂时未能放入，请确认已获得后重试。');}};
 const takeBack=(id:SynthesisItemId)=>{if(busy)return;try{setProgress(removeSynthesisItem(id));setError('');}catch{setError('槽位暂时无法保存，请重试。');}};
 const start=()=>{if(starting.current||!progress||busy||progress.completed||imageError)return;starting.current=true;try{setProgress(beginSynthesis());setError('');}catch{starting.current=false;setError('请先放好三件宝物，并确认进度可以保存。');}};
 const openGift=()=>{if(openingGift.current||!progress?.completed)return;openingGift.current=true;try{beginGiftOpening();setShowReveal(true);setError('');}catch{setError('礼盒开启进度未能保存，请再点击一次。');}finally{openingGift.current=false;}};
 const retry=()=>{const next=load();setProgress(next.progress);setOwned(next.owned);setError(next.error);};
 if(!progress)return <main className="synthesis-root synthesis-fallback"><p role="alert">{error}</p><button className="synthesis-action" onClick={retry}>重新读取存档</button><WardrobeMusic stage="room"/></main>;
 if(showReveal)return <GiftReveal onReturn={()=>{try{setProgress(readSynthesisProgress());setShowReveal(false);}catch{setError('合成进度暂时无法读取，请重试。');}}}/>;
 const missing=synthesisSlots.filter(slot=>!owned.includes(slot.id)),guide=!progress.introSeen;
 return <main className="synthesis-root" onPointerDown={unlockAudio}><section className="synthesis-stage" aria-label="神秘合成小屋">
  <img className="synthesis-wide-background" src={synthesisAssets.wideBackground} alt="神秘合成小屋" draggable={false} onError={()=>setImageError(true)}/>
  <div className={`synthesis-art ${busy?'is-synthesizing':''} ${progress.completed?'is-complete':''}`} style={{'--synthesis-elapsed':`-${timeline.current.elapsed}ms`} as CSSProperties}>
   <img className="synthesis-background synthesis-layout-reference" src={synthesisAssets.background} alt="神秘合成小屋：中央木质工作台上有三个槽位，墙边摆放书籍、药水和星星灯" draggable={false} onError={()=>setImageError(true)}/>
   {!guide&&synthesisSlots.map((slot,index)=>{
    const item=synthesisItem(slot.id),placed=progress.placed.includes(slot.id);
    const style={left:`${slot.x}%`,top:`${slot.y}%`,width:`${slot.width}%`,height:`${slot.height}%`,'--slot-delay':`${index*800}ms`,'--travel-x':`${50-slot.x}cqw`,'--travel-y':`${(54.5-slot.y)*2/3}cqw`} as CSSProperties;
    return <div key={slot.id} className={`synthesis-item-layer ${placed?'is-placed':''}`} style={style}>
     <button className="synthesis-slot" disabled={!placed||busy||progress.completed} onClick={()=>takeBack(slot.id)} aria-label={placed?`取回${item.name}`:`${item.name}槽位，尚未放入`} title={item.name}><img className={placed?'synthesis-slot-item':'synthesis-slot-outline'} src={item.image} alt="" draggable={false}/></button>
     {placed&&busy&&<div className="synthesis-flight" aria-hidden="true"><img src={item.image} alt=""/><span>✦</span></div>}
    </div>;
   })}
   <div className="synthesis-golden-light" aria-hidden="true"/>
   {(busy||progress.completed)&&<button className={`synthesis-gift ${progress.completed?'is-ready':''}`} disabled={!progress.completed} aria-label={progress.giftOpened?'进入玩偶揭晓':'点击开启神秘礼盒'} onClick={openGift}><img src={progress.giftOpened?synthesisAssets.openedGift:synthesisAssets.gift} alt={progress.giftOpened?'已经开启的神秘礼盒':'带蝴蝶结的神秘礼盒'} draggable={false}/><span className="synthesis-gift-stars" aria-hidden="true">✦　✧　✦</span>{progress.completed&&<small>{progress.giftOpened?'进入玩偶揭晓':'点击开启'} ▼</small>}</button>}
   {guide&&<div className="synthesis-intro"><p>你已经找回了三件宝物。</p><p>把它们放在一起，它们能找到真正的主人。</p><button className="synthesis-action" disabled={imageError} onClick={()=>{try{setProgress(startSynthesisGuide());setError('');}catch{setError('进度暂时无法保存，请重试。');}}}>开始合成</button></div>}
   {progress.completed&&<p className="synthesis-success" role="status">你制作出了一件从未被发现过的神秘礼物！</p>}
  </div>
  <header className="synthesis-header">{!guide&&<p aria-live="polite">{busy?'星光正在汇聚……':progress.completed?'合成完成':`已放入 ${progress.placed.length}/3`}</p>}</header>
  <SharedBackpack chapterLabel="神秘合成" key={guide?'guide':'ready'} overlay defaultOpen={!guide&&!progress.completed&&!busy} onItemSelect={progress.completed?undefined:place} usedItems={progress.placed} interactionDisabled={busy||guide} closeAfterSelect={matchMedia('(max-width:600px)').matches} closeKey={`${busy}-${progress.completed}`}/><WardrobeMusic stage="room"/>
  {!guide&&!progress.completed&&!busy&&<div className="synthesis-controls"><p>点击背包中的宝物放入槽位，点击槽位可以取回。</p><button className="synthesis-action" disabled={progress.placed.length!==3||imageError} onClick={start}>合成神秘礼物</button></div>}
  {busy&&<div className="synthesis-lock" aria-hidden="true"/>}
  {onReturnToLucky&&<button className="synthesis-back" disabled={busy} onClick={onReturnToLucky}>← 返回幸运小屋</button>}
  {(error||imageError)&&<div className="synthesis-error" role="alert"><p>{imageError?'合成小屋背景未能加载，请刷新重试。':error}</p>{busy&&error&&<button className="synthesis-action" onClick={finish}>重试保存</button>}</div>}
 </section>
 {!guide&&!busy&&!progress.completed&&missing.length>0&&<aside className="synthesis-missing" aria-label="尚未获得的宝物"><p>还有宝物没有找回，去这些地方看看：</p><ul>{missing.map(slot=><li key={slot.id}><span>{synthesisItem(slot.id).name}<small>{slot.source}</small></span><a href={synthesisSourceUrl(slot.scene)}>返回{slot.source.split(' · ')[0]}</a></li>)}</ul></aside>}
 </main>;
}
