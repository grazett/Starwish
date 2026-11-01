import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {readGameState} from '../gameState';
import {advanceBirthdayWish,beachAssets,beachTiming,canVisitBirthdayBeach,enterBirthdayBeach,lightBirthdayWish,openBirthdayLetter,readBeachProgress,returnToBirthdayBeach,type BeachProgress} from '../birthdayBeachState';
import {birthdayBurstTimes,playBeachWaves,playBirthdayBurst,unlockAudio} from '../audio';
import {synthesisAssets,synthesisSourceUrl} from '../synthesis';
import AdventurePlayer from './AdventurePlayer';
import BirthdayLetter from './BirthdayLetter';
import SharedBackpack from './SharedBackpack';
import {WardrobeMusic} from './WardrobePage';
import '../birthdayBeach.css';

function load(){try{return {progress:readBeachProgress(),allowed:canVisitBirthdayBeach(),error:''};}catch{return {progress:null,allowed:false,error:'海滩进度暂时无法读取，请保留存档后重试。'};}}
const fireworkPalette=['#ff72bd','#ffdf66','#b793ff','#65d8ff','#74efad','#ff9868'];
function Fireworks({onBurst}:{onBurst:(index:number,elapsedTime:number)=>void}){return <div className="beach-fireworks" aria-hidden="true">{birthdayBurstTimes.map((at,i)=><div className={`beach-firework burst-${i}`} key={at} style={{'--burst-time':`${at}ms`,'--burst-x':`${[24,67,43,78,29,57][i]}%`,'--burst-y':`${[50,52,49,50,51,48][i]}%`,'--burst-color':fireworkPalette[i]} as CSSProperties}><div className="beach-rocket"/><div className="beach-burst-glow"/><span className="beach-burst-cue" onAnimationStart={event=>{if(event.animationName==='beach-burst-cue')onBurst(i,event.elapsedTime);}}/>{Array.from({length:30},(_,j)=><i key={j} className={j>=20?'inner-spark':''} style={{'--ray':`${j<20?j*18:(j-20)*36+9}deg`,'--spark-radius':j<20?'10.8cqw':'6.5cqw','--spark-color':fireworkPalette[(j+i)%fireworkPalette.length]} as CSSProperties}/>)}</div>)}</div>;}

export default function BirthdayBeach({onReturnGift}:{onReturnGift?:()=>void}={}){
 const [initial]=useState(load),[progress,setProgress]=useState<BeachProgress|null>(initial.progress),[allowed,setAllowed]=useState(initial.allowed),[error,setError]=useState(initial.error);
 const [player]=useState(()=>readGameState().player),[muted,setMuted]=useState(()=>{try{return localStorage.getItem('starwish-title-muted')==='true';}catch{return false;}});
 const [exited,setExited]=useState(false);
 const [clock,setClock]=useState(Date.now()),[replayAt,setReplayAt]=useState<number|null>(null),[assetError,setAssetError]=useState(false);
 const mutedRef=useRef(muted);mutedRef.current=muted;
 const actionLock=useRef(false),fireworkSounds=useRef(new Set<ReturnType<typeof playBirthdayBurst>>()),waves=useRef<ReturnType<typeof playBeachWaves>|null>(null);
 const entered=!exited&&allowed&&progress?.entered===true,letter=progress?.view==='letter',wishAt=replayAt??progress?.candleAt??null;
 const elapsed=wishAt===null?0:Math.max(0,clock-wishAt),done=replayAt!==null?elapsed>=beachTiming.blessing:progress?.blessingShown===true;
 const busy=wishAt!==null&&!done;
 const entranceAt=progress?.entranceAt??null;
 const entranceClock=Math.max(0,clock-(entranceAt??clock));
 const entranceAnim=useRef({at:entranceAt,offset:entranceClock}),wishAnim=useRef({at:wishAt,offset:elapsed});
 if(entranceAnim.current.at!==entranceAt)entranceAnim.current={at:entranceAt,offset:Math.max(0,Date.now()-(entranceAt??Date.now()))};
 if(wishAnim.current.at!==wishAt)wishAnim.current={at:wishAt,offset:Math.max(0,Date.now()-(wishAt??Date.now()))};
 const act=(fn:()=>BeachProgress)=>{if(actionLock.current)return;actionLock.current=true;try{setProgress(fn());setClock(Date.now());setError('');}catch{setError('这一步暂时未能保存，请重试。');}finally{actionLock.current=false;}};
 useEffect(()=>{
  if(!entered||entranceAt===null)return;
  const timers=[2800,4600,beachTiming.entrance].map(delay=>window.setTimeout(()=>setClock(Date.now()),Math.max(0,entranceAt+delay-Date.now())));
  return()=>timers.forEach(clearTimeout);
 },[entered,entranceAt]);
 useEffect(()=>{
  if(!entered||wishAt===null)return;
  const tick=()=>{setClock(Date.now());if(replayAt===null)try{setProgress(advanceBirthdayWish());setError('');}catch{setError('生日进度未能保存，请点击重试保存。');}};
  const timers=[beachTiming.flameOut,beachTiming.fireworks,beachTiming.fireworksEnd,beachTiming.blessing].map(delay=>window.setTimeout(tick,Math.max(0,wishAt+delay-Date.now())));
  return()=>timers.forEach(clearTimeout);
 },[entered,wishAt,replayAt]);
 useEffect(()=>{
  if(!entered)return;
  const sync=()=>{waves.current?.stop();waves.current=null;if(!document.hidden)waves.current=playBeachWaves(mutedRef.current);};
  sync();document.addEventListener('visibilitychange',sync);return()=>{document.removeEventListener('visibilitychange',sync);waves.current?.stop();waves.current=null;};
 },[entered]);
 useEffect(()=>{waves.current?.setMuted(muted);for(const sound of fireworkSounds.current)sound.setMuted(muted);},[muted]);
 const seenBursts=useRef({at:wishAt,indices:new Set<number>()});
 if(seenBursts.current.at!==wishAt)seenBursts.current={at:wishAt,indices:new Set()};
 useEffect(()=>{
  const stop=()=>{for(const sound of fireworkSounds.current)sound.stop();fireworkSounds.current.clear();};
  const visibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);stop();};
 },[entered,wishAt]);
 const burst=(index:number,animationElapsed:number)=>{
  if(!entered||wishAt===null||document.hidden||animationElapsed>0||seenBursts.current.indices.has(index))return;
  // Ignore already-past cues on refresh, hidden tabs, or a stalled main thread.
  if(Date.now()-wishAt>birthdayBurstTimes[index]+80+250)return;
  seenBursts.current.indices.add(index);fireworkSounds.current.add(playBirthdayBurst(mutedRef.current));
 };

 const returnOpening=()=>{const params=new URLSearchParams(location.search);params.set('scene','game');params.set('replayOpening','1');location.assign(`/?${params}`);};
 const returnGift=()=>{if(busy)return;try{if(onReturnGift)onReturnGift();else location.assign(synthesisSourceUrl('synthesis'));}catch{setError('返回进度暂时未能保存，请重试。');}};
 if(exited)return <main className="beach-root"><section className="beach-stage beach-exited" aria-label="已退出游戏"><p>已退出游戏</p><p>旅程和背包已保存。</p><button className="synthesis-action" onClick={returnOpening}>回到开头</button></section></main>;
 if(!progress||!allowed)return <main className="synthesis-root synthesis-fallback"><p role={error?'alert':'status'}>{error||'请先查看你的专属玩偶收藏卡。'}</p><button className="synthesis-action" onClick={returnGift}>返回我的礼物</button>{error&&<button className="synthesis-action" onClick={()=>{const next=load();setProgress(next.progress);setAllowed(next.allowed);setError(next.error);}}>重新读取</button>}</main>;
 if(!entered)return <main className="beach-root"><section className="beach-stage beach-invitation" aria-label="前往生日海滩"><WardrobeMusic stage="reveal"/><div className="beach-invitation-copy"><p>星愿谷的夜晚海滩很美，去海滩上看看吧。</p><button className="synthesis-action" onClick={()=>{unlockAudio();act(()=>enterBirthdayBeach());}}>前往海滩</button></div><button className="beach-text-button beach-return" onClick={returnGift}>← 返回我的礼物</button>{error&&<p className="beach-error" role="alert">{error}</p>}</section></main>;
 const style={'--beach-entrance-elapsed':`-${entranceAnim.current.offset}ms`,'--beach-wish-elapsed':`-${wishAnim.current.offset}ms`} as CSSProperties;
 return <main className="beach-root" onPointerDown={unlockAudio}><section className={`beach-stage ${wishAt!==null?'has-wish':''} ${done?'wish-complete':''} ${letter?'is-letter':''}`} aria-label={letter?'生日祝福信':'星光生日海滩'} style={style}>
  <WardrobeMusic stage="beach" onMutedChange={setMuted}/>
  <div className="beach-art"><img className="beach-background" src={beachAssets.background} alt="月光下的星空、海面和沙滩" draggable={false} onError={()=>setAssetError(true)}/>
   <div className="beach-player"><AdventurePlayer player={player}/></div><img className="beach-doll" src={synthesisAssets.doll} alt={`${player.nickname}的专属玩偶`} draggable={false} onError={()=>setAssetError(true)}/>
   <div className="beach-cake"><img className="beach-cake-body" src={beachAssets.cake} alt="生日蛋糕和蜡烛" draggable={false} onError={()=>setAssetError(true)}/><img className="beach-candle-flame" src={beachAssets.cake} alt="" aria-hidden="true" draggable={false}/><div className="beach-candle-smoke" aria-hidden="true"><i/><i/><i/></div><button className="beach-candle-hotspot" aria-label="许愿后点一下蜡烛" disabled={wishAt!==null||entranceClock<beachTiming.entrance||assetError} onClick={()=>{unlockAudio();act(()=>lightBirthdayWish());}}>{wishAt===null&&entranceClock>=beachTiming.entrance&&<span>点一下蜡烛 ✦</span>}</button></div>
   {wishAt!==null&&<Fireworks onBurst={burst}/>}
   {wishAt===null&&<div className="beach-intro" aria-live="polite"><p>冒险结束了，接下来是你的生日时间。</p><p>许一个愿望，再点一下蜡烛吧。</p></div>}
   {busy&&<span className="beach-wish-status" role="status">{elapsed<beachTiming.fireworks?'愿望正在随星光升起……':'看，烟花为你绽放。'}</span>}
   {done&&!letter&&<div className="beach-birthday-copy beach-ending-copy" aria-live="polite"><p>星愿谷的旅程暂时结束，但人生的旅程还有很长，</p><p>愿这段路幸福常伴，希望你一切都好。</p><div className="beach-ending-actions"><button className="synthesis-action" onClick={returnOpening}>回到开头</button><button className="synthesis-action" onClick={()=>setExited(true)}>退出游戏</button></div></div>}
  </div>
  {!letter&&<SharedBackpack chapterLabel="星光生日海滩" overlay interactionDisabled={busy} closeKey={String(busy)}/>}
  {!busy&&!letter&&<div className="beach-navigation"><button className="beach-text-button" onClick={returnGift}>← 返回我的礼物</button>{done&&<button className="beach-text-button" onClick={()=>act(()=>openBirthdayLetter())}>打开祝福信</button>}{done&&<button className="beach-text-button" onClick={()=>{unlockAudio();setReplayAt(Date.now());setClock(Date.now());setError('');}}>再看一次烟花</button>}</div>}
  {letter&&<BirthdayLetter onClose={()=>{setReplayAt(null);act(()=>returnToBirthdayBeach());}}/>}
  {(error||assetError)&&<div className="beach-error" role="alert"><p>{assetError?'海滩或礼物素材未能加载，请刷新重试。':error}</p>{error&&<button className="synthesis-action" onClick={()=>act(()=>advanceBirthdayWish())}>重试保存</button>}</div>}
 </section></main>;
}

