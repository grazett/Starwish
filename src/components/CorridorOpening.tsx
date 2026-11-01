import {loadOpeningImage} from '../openingImages';
import {useEffect,useRef,useState} from 'react';
import {corridorAssets,corridorDuration,corridorParcelBounds,renderCorridor} from '../corridorScene';
import ParcelContents from './ParcelContents';
import JourneyOpening from './JourneyOpening';
import DressingFlow from './DressingFlow';
import {journeyAssets} from '../journeyScene';
import {parcelAssets} from '../parcelAssets';
import {sound,unlockAudio,playOpeningCue} from '../audio';
import {useGameMusic} from '../useGameMusic';
import '../classroom.css';
import '../corridor.css';
const param=new URLSearchParams(location.search).get('at');
const still=param!==null&&Number.isFinite(Number(param))?Math.max(0,Math.min(corridorDuration,Number(param))):null;
export default function CorridorOpening({onReady,journeyOnly=false}:{onReady?:()=>void;journeyOnly?:boolean}={}){
 const announced=useRef(false);const canvas=useRef<HTMLCanvasElement>(null),images=useRef<HTMLImageElement[]>([]),time=useRef(still??0),clickedAt=useRef<number|null>(null),openTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [loaded,setLoaded]=useState(false),[error,setError]=useState(false),[waiting,setWaiting]=useState(false),[clicked,setClicked]=useState(false),clickedRef=useRef(false);
 const [packageOpen,setPackageOpen]=useState(false);
 const [departing,setDeparting]=useState(journeyOnly);
 const [arrived,setArrived]=useState(false);
 const [letterOpened,setLetterOpened]=useState(journeyOnly);
 const elevatorPlayed=useRef(false),elevator=useRef<ReturnType<typeof playOpeningCue>|null>(null);
 const [muted,setMuted]=useState(()=>{try{return localStorage.getItem('starwish-title-muted')==='true';}catch{return false;}});
 const mutedRef=useRef(muted);mutedRef.current=muted;
 useGameMusic(letterOpened?'letter':'intro',muted);
 useEffect(()=>{elevator.current?.setMuted(muted);},[muted]);
 useEffect(()=>()=>elevator.current?.stop(),[]);
 useEffect(()=>{if(error)onReady?.();},[error,onReady]);
 useEffect(()=>{let cancelled=false;Promise.all(Object.values(corridorAssets).map(src=>loadOpeningImage(src))).then(list=>{if(!cancelled){images.current=list;setLoaded(true);}}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[]);
 useEffect(()=>{[...Object.values(parcelAssets),...Object.values(journeyAssets)].forEach(src=>{const image=new Image();image.src=src;});return()=>clearTimeout(openTimer.current);},[]);
 useEffect(()=>{if(!loaded||packageOpen||departing)return;let raf=0,previous=performance.now();const tick=(now:number)=>{if(still===null)time.current=Math.min(corridorDuration,time.current+Math.min((now-previous)/1000,.1));previous=now;if(still===null&&time.current>=.8&&!elevatorPlayed.current){elevatorPlayed.current=true;elevator.current=playOpeningCue('elevator',mutedRef.current);}const ctx=canvas.current?.getContext('2d');if(ctx)renderCorridor(ctx,images.current,time.current,now/1000,clickedRef.current,clickedAt.current===null?0:Math.min(1,(now-clickedAt.current)/650));if(!announced.current&&ctx){announced.current=true;onReady?.();}if(time.current>=corridorDuration)setWaiting(true);raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[loaded,packageOpen,departing,onReady]);
 const skip=()=>{elevatorPlayed.current=true;time.current=corridorDuration;setWaiting(true);};
 const inspectParcel=()=>{if(!waiting||clickedRef.current)return;clickedRef.current=true;clickedAt.current=performance.now();setClicked(true);unlockAudio();sound('parcel',muted);window.dispatchEvent(new CustomEvent('starwish:parcel-click',{detail:{scene:'corridor',placeholder:false}}));openTimer.current=setTimeout(()=>setPackageOpen(true),650);};
 const box=corridorParcelBounds(corridorDuration);
 if(arrived)return <DressingFlow/>;
 return <main className="classroom-preview"><div className="classroom-stage"><canvas ref={canvas} width={1920} height={1080} style={{visibility:packageOpen||departing?'hidden':undefined}} aria-hidden={packageOpen||departing} aria-label="公寓走廊：电梯打开，走向门口的神秘包裹"/>{!loaded&&(!onReady||error)&&<div className="classroom-controls"><p>{error?'走廊素材加载失败，请刷新重试。':'正在准备傍晚走廊……'}</p></div>}
 {loaded&&waiting&&!packageOpen&&!departing&&<><button className="parcel-target" aria-label="查看神秘包裹" disabled={clicked} style={{left:`${box.left}%`,top:`${box.top}%`,width:`${box.width}%`,height:`${box.height}%`}} onClick={inspectParcel}/>{!clicked&&<p className="parcel-hint" role="status">门口有一个神秘包裹，试着点击看看吧。</p>}</>}
 {packageOpen&&!departing&&<ParcelContents muted={muted} onLetterOpen={()=>setLetterOpened(true)} onDepart={()=>setDeparting(true)}/>}
 {departing&&<JourneyOpening muted={muted} onComplete={()=>setArrived(true)}/>}
 <button className={`music-button ${muted?'muted':''}`} aria-label={muted?'开启声音':'关闭声音'} aria-pressed={!muted} onClick={()=>{unlockAudio();const next=!muted;setMuted(next);try{localStorage.setItem('starwish-title-muted',String(next));}catch{}}}><svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 3h2v8H6zM8 2h6v3H8zM12 3h2v7h-2zM3 10h5v3H3zM2 11h2v2H2zM9 9h5v3H9zM8 10h2v2H8z"/></svg></button>
 {loaded&&!waiting&&!departing&&<button className="classroom-skip" onClick={skip}>跳过剧情</button>}</div></main>;
}
