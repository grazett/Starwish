import {useEffect,useState} from 'react';
import type {PlayerState} from '../gameState';
import {gameProgressKey} from '../gameState';
import {WardrobeMusic} from './WardrobePage';
import '../firstLevel.css';
import MysteryRoom from './MysteryRoom';
import AdventurePlayer from './AdventurePlayer';
import TailorScene from './TailorScene';
import SharedBackpack from './SharedBackpack';

const roomKey=gameProgressKey('starwish-first-level-room');
type Phase='intro'|'ready'|'out'|'in'|'room';
const fadeOutMs=1600,fadeInMs=1100;
export default function FirstLevel({player,preview=false}:{player:PlayerState;preview?:boolean}){
 const [phase,setPhase]=useState<Phase>(()=>{try{return !preview&&localStorage.getItem(roomKey)==='entered'?'room':'intro';}catch{return 'intro';}});
 const [error,setError]=useState('');
 const [tailorStarted,setTailorStarted]=useState(false);
 useEffect(()=>{
  const delays:Partial<Record<Phase,number>>={intro:2600,out:fadeOutMs,in:fadeInMs};
  const next:Partial<Record<Phase,Phase>>={intro:'ready',out:'in',in:'room'};
  if(delays[phase]===undefined)return;
  const timer=window.setTimeout(()=>{
   if(phase==='out'){try{localStorage.setItem(roomKey,'entered');}catch{setError('本次进度未能保存，刷新后将回到屋外。');}}
   setPhase(next[phase]!);
  },delays[phase]);return()=>clearTimeout(timer);
 },[phase]);
 const inside=phase==='in'||phase==='room';
 if(tailorStarted)return <TailorScene/>;
 return <main className="first-level-root"><section className={`first-level-stage ${inside?'is-room':''}`} aria-label={inside?'第一关：神秘房间':'神秘小屋屋外'}>
  {inside?<MysteryRoom onNextScene={()=>setTailorStarted(true)}/>:<>
   <img className="cabin-background" src="/assets/level-one/cabin.webp" alt="林间路口旁的像素风小木屋"/>
   <SharedBackpack chapterLabel="第一关 · 神秘房间" overlay closeKey={phase}/>
   <div className="outdoor-player"><AdventurePlayer player={player}/></div>
   {phase==='intro'&&<p className="cabin-message" role="status">有一个神秘小屋，进去探索一下吧！</p>}
   <button className={`cabin-door ${phase==='ready'?'is-ready':''}`} aria-label="点击木屋正门，进入神秘房间" disabled={phase!=='ready'} onClick={()=>setPhase('out')}>{phase==='ready'&&<span>点击进入 <b>▼</b></span>}</button>
   <p className="cabin-status" aria-live="polite">{phase==='out'?'正在进入神秘小屋……':''}</p>
  </>}
  {!inside&&<WardrobeMusic stage="cabin"/>}{inside&&preview&&<button className="level-replay" onClick={()=>setPhase('intro')}>重看进屋动画</button>}{error&&<p className="level-save-error" role="status">{error}</p>}
  {(phase==='out'||phase==='in')&&<div key={phase} className={`level-fade ${phase==='in'?'fade-in':''}`} style={{animationDuration:`${phase==='out'?fadeOutMs:fadeInMs}ms`}} aria-hidden="true"/>}
 </section></main>;
}



