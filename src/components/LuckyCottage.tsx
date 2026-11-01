import {useEffect,useRef,useState} from 'react';
import {luckyAssets,luckyBoxSlots,luckyOverviewSlots,luckyGreeting,luckyBirthdayGreeting,luckyRewards} from '../luckyCottage';
import {claimLuckyBox,enterSynthesis,initializeLuckyProgress,openLuckyBox,returnToLuckyBoxes,startLuckyBoxes,type LuckyProgress} from '../luckyCottageState';
import {playerText} from '../gameState';
import {unlockAudio} from '../audio';
import SharedBackpack from './SharedBackpack';
import {WardrobeMusic} from './WardrobePage';
import TailorDialogue from './TailorDialogue';
import SynthesisRoom from './SynthesisRoom';
import '../tailor.css';
import '../luckyCottage.css';
import {useGameEffect} from '../useGameEffect';

function load(){try{return {progress:initializeLuckyProgress(),error:''};}catch{return {progress:null,error:'幸运小屋进度暂时无法读取或保存，请保留现有存档并重试。'};}}
function GiftArt({opened=false}:{opened?:boolean}){return <div className={`lucky-gift-art ${opened?'is-open':''}`} aria-hidden="true">
 <span className="lucky-gift-light"/>
 <img className="lucky-gift-body" src={luckyAssets.giftClosed} alt="" draggable={false}/>
 <img className="lucky-gift-lid" src={luckyAssets.giftClosed} alt="" draggable={false}/>
 <img className="lucky-gift-open" src={luckyAssets.giftOpen} alt="" draggable={false}/>
 <svg className="lucky-gift-sparks" viewBox="0 0 80 80" shapeRendering="crispEdges"><path fill="#fff2a5" d="M13 7h4v5h5v4h-5v5h-4v-5H8v-4h5zM63 10h3v4h4v3h-4v4h-3v-4h-4v-3h4zM62 45h3v4h4v3h-4v4h-3v-4h-4v-3h4z"/></svg>
 </div>;}
function RewardPhotoZoom({image,name,onClose}:{image:string;name:string;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className="lucky-photo-zoom" aria-label={`放大查看${name}`} onCancel={event=>{event.preventDefault();event.stopPropagation();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}><img src={image} alt={name}/><button autoFocus className="lucky-action" onClick={onClose}>返回照片</button></dialog>;
}
function Reward({index,progress,onClose,onClaim,error}:{index:number;progress:LuckyProgress;onClose:()=>void;onClaim:()=>void;error:string}){
 const ref=useRef<HTMLDialogElement>(null),[zoom,setZoom]=useState(false);useEffect(()=>{ref.current?.showModal();},[]);
 const box=progress.boxes[index],reward=luckyRewards.find(item=>item.id===box.reward)!,photo=reward.kind==='photo'||reward.kind==='visitor';
 return <><dialog ref={ref} className={`lucky-reward ${photo?'is-photo':''}`} aria-labelledby="lucky-reward-title" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)onClose();}}}>
  <button autoFocus className="lucky-close" aria-label="关闭奖励" onClick={onClose}>×</button><p className="lucky-eyebrow">{reward.kind==='visitor'?'来自暖暖的祝福':'幸运小屋 · 一份小惊喜'}</p>
  {photo?<><button className="lucky-photo-button" aria-label={`放大查看${reward.name}`} onClick={()=>setZoom(true)}><img src={reward.image} alt={reward.name}/></button><small className="lucky-photo-hint">点击照片放大查看</small></>:<img className="lucky-reward-image" src={reward.image} alt={reward.name}/>}
  <h2 id="lucky-reward-title">{reward.name}</h2>{reward.description&&<p>{playerText(reward.description)}</p>}{error&&<p className="lucky-error" role="alert">{error}</p>}<button className="lucky-action" onClick={box.claimed?onClose:onClaim}>{box.claimed?'返回展示柜':'收下'}</button>
 </dialog>{zoom&&<RewardPhotoZoom image={reward.image} name={reward.name} onClose={()=>setZoom(false)}/>}</>;
}
function SetPrompt({onContinue,onFinal,error}:{onContinue:()=>void;onFinal:()=>void;error:string}){
 const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className="lucky-reward lucky-set-prompt" aria-label="三件关键道具的线索" onCancel={event=>{event.preventDefault();onContinue();}}><img className="lucky-reward-image" src={luckyAssets.headpiece} alt="小猪头饰"/><p className="lucky-set-copy">它和背包里的另外两件东西，好像是一套……</p><div className="lucky-prompt-actions"><button autoFocus className="lucky-action" onClick={onContinue}>继续拆盲盒</button><button className="lucky-action" onClick={onFinal}>前往神秘小屋</button></div>{error&&<p className="lucky-error" role="alert">{error}</p>}</dialog>;
}
export default function LuckyCottage({onReturnToGarden}:{onReturnToGarden?:()=>void}={}){
 const [initial]=useState(load),[progress,setProgress]=useState<LuckyProgress|null>(initial.progress),[error,setError]=useState(initial.error);
 const [view,setView]=useState<'shop'|'cabinet'>(initial.progress?.introSeen?'cabinet':'shop');
 const [welcome,setWelcome]=useState(false),[dialogueStep,setDialogueStep]=useState(0),[prompt,setPrompt]=useState(false);
 const greet=()=>{setDialogueStep(0);setWelcome(true);};
 const [active,setActive]=useState<number|null>(()=>initial.progress?.introSeen?initial.progress.boxes.findIndex(box=>box.opened&&!box.claimed)===-1?null:initial.progress.boxes.findIndex(box=>box.opened&&!box.claimed):null);
 const [opening,setOpening]=useState<number|null>(null),[imageError,setImageError]=useState(false);
 const openingLock=useRef(false);
 const [openingAt,setOpeningAt]=useState<number|null>(null);
 useGameEffect('box',opening===null?null:openingAt);
 useEffect(()=>{if(opening===null)return;const timer=window.setTimeout(()=>{setActive(opening);setOpening(null);openingLock.current=false;},1450);return()=>clearTimeout(timer);},[opening]);
 const begin=()=>{try{setProgress(startLuckyBoxes());setWelcome(false);setView('cabinet');setImageError(false);setError('');}catch{setError('进度暂时无法保存，请再试一次。');}};
 const open=(index:number)=>{if(!progress||openingLock.current||active!==null||prompt||welcome||imageError)return;try{const next=openLuckyBox(index);setProgress(next);setError('');if(progress.boxes[index].opened)setActive(index);else{openingLock.current=true;setOpeningAt(Date.now());setOpening(index);}}catch{setError('礼物盒暂时无法保存，请再点一次重试。');}};
 const claim=()=>{if(active===null||!progress)return;try{const head=progress.boxes[active].reward==='headpiece';setProgress(claimLuckyBox(active));setActive(null);setError('');if(head)setPrompt(true);}catch{setError('奖励暂时无法完整保存，请点击「收下」重试。');}};
 const final=()=>{try{setProgress(enterSynthesis());setPrompt(false);setError('');}catch{setError('入口进度暂时无法保存，请重试。');}};
 const closeReward=()=>{setActive(null);setError('');};
 if(!progress)return <main className="lucky-root lucky-loading-error"><p role="alert">{error}</p><button className="lucky-action" onClick={()=>{const next=load();setProgress(next.progress);setError(next.error);if(next.progress){setView(next.progress.introSeen?'cabinet':'shop');setWelcome(false);}}}>重新读取存档</button><WardrobeMusic stage="room"/></main>;
 if(progress.finalEntered)return <SynthesisRoom onReturnToLucky={()=>{try{setProgress(returnToLuckyBoxes());setView('cabinet');setError('');}catch{setError('返回进度暂时无法保存，请重试。');}}}/>;
 const blocked=opening!==null||active!==null||welcome||prompt;
 return <main className="lucky-root" onPointerDown={unlockAudio}><section className="lucky-stage" aria-label={view==='shop'?'第四关：幸运小屋':'九宫格展示柜特写'}>
  <div className={`lucky-art-scene ${view==='shop'?'is-shop':'is-cabinet'}`}><img className="lucky-background" src={view==='shop'?luckyAssets.background:luckyAssets.cabinet} alt={view==='shop'?'幸运小屋：中央九宫格木质展示柜，两侧有花朵、窗帘和星星灯串':'九宫格展示柜特写：三行三列独立展示格'} onError={()=>setImageError(true)} draggable={false}/>
   {(view==='cabinet'?luckyBoxSlots:luckyOverviewSlots).map((slot,index)=>view==='cabinet'?<button key={index} className={`lucky-box ${progress.boxes[index].opened?'was-opened':''} ${opening===index?'is-opening':''}`} style={{left:`${slot.x}%`,top:`${slot.y}%`}} disabled={blocked||imageError} aria-label={`${progress.boxes[index].opened?'重看':'打开'}第${index+1}个盲盒${progress.boxes[index].opened?'的奖励':''}`} onClick={()=>open(index)}><GiftArt opened={progress.boxes[index].opened&&opening!==index}/></button>:<span key={index} className="lucky-overview-gift" style={{left:`${slot.x}%`,top:`${slot.y}%`}}><GiftArt opened={progress.boxes[index].opened}/></span>)}
   {view==='shop'&&<button className="lucky-shopkeeper" aria-label="与店主小姐交谈" disabled={blocked} onClick={greet}><img src={luckyAssets.npc} alt="手捧礼物的店主小姐" draggable={false}/></button>}
  </div>
  <SharedBackpack chapterLabel="第四关 · 幸运盲盒" overlay refreshKey={String(progress.headpieceClaimed)} closeKey={`${view}-${active}-${opening}-${prompt}`}/><WardrobeMusic stage="room"/>
  <header className="lucky-header">{view==='cabinet'&&<p>挑一个礼物盒，亲手打开吧</p>}{view==='cabinet'&&<p aria-live="polite">已打开 {progress.openedCount}/9</p>}</header>
  <nav className="lucky-navigation" aria-label="幸运小屋导航">{view==='cabinet'?<button className="lucky-text-button" disabled={blocked} onClick={()=>{setView('shop');setImageError(false);}}>← 返回小屋</button>:<><button className="lucky-text-button" disabled={blocked} onClick={()=>{if(progress.introSeen){setView('cabinet');setImageError(false);}else greet();}}>{progress.introSeen?'查看展示柜':'与店主小姐交谈'}</button>{onReturnToGarden&&<button className="lucky-text-button" disabled={blocked} onClick={onReturnToGarden}>← 返回花园</button>}</>}{progress.headpieceClaimed&&<button className="lucky-action lucky-final-entry" disabled={blocked} onClick={final}>前往神秘小屋</button>}</nav>
  {(error||imageError)&&active===null&&!welcome&&!prompt&&<p className="lucky-scene-error" role="alert">{imageError?'幸运小屋素材未能加载，请刷新重试。':error}</p>}
 </section>
 {welcome&&<TailorDialogue key={dialogueStep} extraClass="lucky-welcome-dialog" text={dialogueStep===0?luckyGreeting:luckyBirthdayGreeting} speaker="店主小姐" title="店主小姐的问候" npcImage={luckyAssets.npc} npcWidth={952} npcHeight={1652} portraitViewBox="50 40 780 780" actionLabel={dialogueStep===0?'继续':'开始拆盲盒'} error={error} onClose={()=>setWelcome(false)} onAction={dialogueStep===0?()=>setDialogueStep(1):begin}/>}
 {active!==null&&<Reward key={active} index={active} progress={progress} onClose={closeReward} onClaim={claim} error={error}/>}
 {prompt&&<SetPrompt onContinue={()=>setPrompt(false)} onFinal={final} error={error}/>}
 </main>;
}
