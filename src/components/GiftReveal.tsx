import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {synthesisAssets,synthesisItem,synthesisItemIds} from '../synthesis';
import {continueGiftJourney,finishGiftOpening,giftOpeningDuration,readGiftReveal,restoreGiftReveal,revealDoll,revealDuration,revisitGiftCard,storyDuration,visitGiftCard,type GiftRevealProgress} from '../giftRevealState';
import SharedBackpack from './SharedBackpack';
import BirthdayBeach from './BirthdayBeach';
import {WardrobeMusic} from './WardrobePage';
import {unlockAudio} from '../audio';
import {playerText,readGameState} from '../gameState';
import '../giftReveal.css';

const lines=['一副小眼镜……','一件小衣服……','还有一件神秘头饰……','原来，它们一直在等待同一个主人。'];
function Stars(){return <div className="gift-reveal-stars" aria-hidden="true">{Array.from({length:12},(_,i)=><span key={i} style={{'--i':i} as CSSProperties}>{i%3===0?'❀':'✦'}</span>)}</div>;}
function load(){try{return {progress:readGiftReveal(),error:''};}catch{return {progress:null,error:'揭晓进度暂时无法读取，请保留存档并重试。'};}}
export default function GiftReveal({onReturn}:{onReturn:()=>void}){
 const [initial]=useState(load),[progress,setProgress]=useState<GiftRevealProgress|null>(initial.progress),[error,setError]=useState(initial.error),[imageError,setImageError]=useState(false),[clock,setClock]=useState(Date.now());
 const [player]=useState(()=>readGameState().player);
 const dollName=playerText('{nickname}的专属玩偶',player);
 const locked=useRef(false);
 const act=(fn:()=>GiftRevealProgress)=>{if(locked.current)return;locked.current=true;try{setProgress(fn());setClock(Date.now());setError('');}catch{setError('进度暂时未能保存，请重试。');}finally{locked.current=false;}};
 useEffect(()=>{try{setProgress(restoreGiftReveal());}catch{setError('进度暂时未能保存，请重试。');}},[]);
 const phase=progress?.phase,startedAt=progress?.startedAt??0;
 const elapsed=Math.max(0,clock-startedAt);
 useEffect(()=>{
  if(!phase||!['opening','silhouette','revealed'].includes(phase))return;
  const duration=phase==='opening'?giftOpeningDuration:phase==='silhouette'?storyDuration:revealDuration;
  const delays=phase==='silhouette'?[2200,4400,6600,duration]:[duration];
  const timers=delays.map(delay=>window.setTimeout(()=>{
   setClock(Date.now());
   if(phase==='opening'){try{setProgress(finishGiftOpening());setError('');}catch{setError('开盒进度未能保存，请点击重试。');}}
  },Math.max(0,startedAt+delay-Date.now())));
  return()=>timers.forEach(clearTimeout);
 },[phase,startedAt]);
 const retry=()=>{if(phase==='opening')act(()=>finishGiftOpening());else{const next=load();setProgress(next.progress);setError(next.error);if(next.progress?.startedAt===0)act(()=>restoreGiftReveal());}};
 const animElapsed=useRef({phase,startedAt,elapsed});if(animElapsed.current.phase!==phase||animElapsed.current.startedAt!==startedAt)animElapsed.current={phase,startedAt,elapsed:Math.max(0,Date.now()-startedAt)};
 if(!progress||phase==='sealed')return <main className="synthesis-root synthesis-fallback"><p role="alert">{error||'请先在合成台点击神秘礼盒。'}</p><button className="synthesis-action" onClick={onReturn}>返回合成台</button>{error&&<button className="synthesis-action" onClick={retry}>重试</button>}</main>;
 if(phase==='blessing')return <BirthdayBeach onReturnGift={()=>{setProgress(revisitGiftCard());setClock(Date.now());setError('');}}/>;
 const animStyle={'--reveal-elapsed':`-${animElapsed.current.elapsed}ms`} as CSSProperties;
 const opening=phase==='opening',silhouette=phase==='silhouette',revealed=phase==='revealed',card=phase==='card';
 return <main className="gift-reveal-root" onPointerDown={unlockAudio}><section className={`gift-reveal-stage phase-${phase}`} aria-label={opening?'神秘礼盒开启':silhouette?'神秘玩偶剪影':card?'专属玩偶收藏卡':'玩偶正式亮相'} style={animStyle}>
  <WardrobeMusic stage="reveal"/>
  {opening?<><img className="gift-opening-background" src={synthesisAssets.wideBackground} alt="神秘合成小屋"/><div className="gift-opening-dim"/><div className="gift-opening-box" aria-label="礼盒正在缓缓开启"><img className="gift-box-base" src={synthesisAssets.gift} alt=""/><img className="gift-box-lid" src={synthesisAssets.gift} alt=""/><img className="gift-box-bow" src={synthesisAssets.gift} alt=""/></div><div className="gift-opening-sparks" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><span>✧</span></div><div className="gift-opening-light"/><p className="gift-opening-caption" role="status">星光正在打开这份惊喜……</p></>:<>
   <div className="gift-dream-halo" aria-hidden="true"/><Stars/>
   {(silhouette||revealed)&&<><div className="gift-doll-display"><div className="gift-doll-rays" aria-hidden="true"/><div className="gift-doll-float"><img className="gift-doll-silhouette" src={synthesisAssets.doll} alt="神秘玩偶的剪影" draggable={false} onError={()=>setImageError(true)}/>{revealed&&<img className="gift-doll-color" src={synthesisAssets.doll} alt={dollName} draggable={false} onError={()=>setImageError(true)}/>}</div></div>
    {silhouette?<div className="gift-story" aria-live="polite"><p key={Math.min(3,Math.floor(elapsed/2200))}>{lines[Math.min(3,Math.floor(elapsed/2200))]}</p>{elapsed>=storyDuration&&<button className="synthesis-action" disabled={imageError} onClick={()=>act(()=>revealDoll())}>揭晓神秘礼物 ✨</button>}</div>:<div className="gift-congratulations"><p>恭喜你！</p><p>{playerText('获得了{nickname}的专属玩偶！',player)}</p><p>全世界仅此一份 ♡</p>{elapsed>=revealDuration&&<button className="synthesis-action" onClick={()=>act(()=>visitGiftCard())}>查看我的礼物</button>}</div>}
   </>}
   {card&&<><article className="gift-collection-card"><header><strong>STAR WISH VALLEY</strong><small>SPECIAL BIRTHDAY GIFT</small></header><div className="gift-card-doll"><img src={synthesisAssets.doll} alt={dollName} draggable={false} onError={()=>setImageError(true)}/></div><div className="gift-card-copy"><span aria-hidden="true">✦　♡　✦</span><h1>{dollName}</h1><p>全世界仅此一份 · 特别定制</p><div className="gift-card-accessories">{synthesisItemIds.map(id=><figure key={id}><img src={synthesisItem(id).image} alt=""/><figcaption>{id==='mini-bib'?'迷你小衣服':id==='mystery-headpiece'?'神秘头饰':synthesisItem(id).name}</figcaption></figure>)}</div></div><footer>♡ A GIFT JUST FOR YOU ♡</footer></article><button className="synthesis-action gift-card-continue" onClick={()=>act(()=>continueGiftJourney())}>继续旅程</button></>}

   <SharedBackpack chapterLabel="神秘礼盒揭晓" overlay/>
   {<button className="gift-return-link gift-back" onClick={onReturn}>← 返回合成小屋</button>}
  </>}
  {(error||imageError)&&<div className="gift-reveal-error" role="alert"><p>{imageError?'玩偶图片未能加载，请刷新重试。':error}</p>{error&&<button className="synthesis-action" onClick={retry}>重试保存</button>}</div>}
 </section></main>;
}
