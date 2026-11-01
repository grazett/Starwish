import {loadOpeningImage} from '../openingImages';
import {useEffect,useRef,useState} from 'react';
import {useGameMusic} from '../useGameMusic';
import {useAmbience} from '../useAmbience';
import {cafeteriaAssets,cafeteriaDuration,renderCafeteria} from '../cafeteriaScene';
import '../classroom.css';
const inspect=new URLSearchParams(location.search).get('at');
const still=inspect!==null&&Number.isFinite(Number(inspect))?Math.max(0,Math.min(cafeteriaDuration,Number(inspect))):null;
export default function CafeteriaOpening({onComplete,onReady}:{onComplete?:()=>void;onReady?:()=>void}={}){
 const announced=useRef(false);const canvas=useRef<HTMLCanvasElement>(null),images=useRef<HTMLImageElement[]>([]),time=useRef(still??0),audio=useRef<AudioContext|null>(null),cues=useRef(new Set<number>());
 const [ready,setReady]=useState(false),[error,setError]=useState(false),[ended,setEnded]=useState(false),[run,setRun]=useState(0);
 const [muted,setMuted]=useState(()=>{try{return localStorage.getItem('starwish-title-muted')==='true';}catch{return false;}}),mutedRef=useRef(muted);mutedRef.current=muted;
 useGameMusic('intro',muted);
 useAmbience('cafeteria',muted,ready&&!ended&&still===null,.18);
 useEffect(()=>{if(error)onReady?.();},[error,onReady]);
 useEffect(()=>{let cancelled=false;Promise.all(cafeteriaAssets.map(src=>loadOpeningImage(src))).then(list=>{if(!cancelled){images.current=list;setReady(true);}}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[]);
 useEffect(()=>{if(!ready||ended)return;let raf=0,previous=performance.now();
  const clink=()=>{if(mutedRef.current)return;try{audio.current??=new AudioContext();void audio.current.resume().catch(()=>{});const ac=audio.current,o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(780,ac.currentTime);g.gain.setValueAtTime(.009,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+.1);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.12);}catch{}};
  const tick=(now:number)=>{if(still===null)time.current=Math.min(cafeteriaDuration,time.current+Math.min((now-previous)/1000,.1));previous=now;
   for(const cue of [3.92,4.54,6.58])if(still===null&&time.current>=cue&&!cues.current.has(cue)){cues.current.add(cue);clink();}
   const ctx=canvas.current?.getContext('2d');if(ctx){renderCafeteria(ctx,images.current,time.current);if(!announced.current){announced.current=true;onReady?.();}}
   if(still===null&&time.current>=cafeteriaDuration){setEnded(true);onComplete?.();return;}raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
 },[ready,ended,run,onComplete,onReady]);
 useEffect(()=>()=>{void audio.current?.close();},[]);
 const finish=()=>{time.current=cafeteriaDuration;const ctx=canvas.current?.getContext('2d');if(ctx&&ready)renderCafeteria(ctx,images.current,time.current);void audio.current?.suspend();setEnded(true);onComplete?.();};
 return <main className="classroom-preview"><div className="classroom-stage"><canvas ref={canvas} width={1920} height={1080} aria-label="学校食堂：端餐盘、坐下、吃午饭"/>{(error||(!onComplete&&(!ready||ended)&&still===null))&&<div className="classroom-controls"><p>{error?'食堂素材加载失败，请刷新重试。':!ready?'正在准备午餐……':'食堂 · 本幕结束'}</p>{ended&&<><button onClick={()=>{time.current=0;cues.current.clear();setEnded(false);setRun(v=>v+1);}}>重播食堂</button><a href="/">返回标题页</a></>}</div>}
 <button className={`music-button ${muted?'muted':''}`} aria-label={muted?'开启声音':'关闭声音'} aria-pressed={!muted} onClick={()=>{const next=!muted;setMuted(next);try{localStorage.setItem('starwish-title-muted',String(next));}catch{}if(audio.current)void(next?audio.current.suspend():audio.current.resume());}}><svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 3h2v8H6zM8 2h6v3H8zM12 3h2v7h-2zM3 10h5v3H3zM2 11h2v2H2zM9 9h5v3H9zM8 10h2v2H8z"/></svg></button>
 {!ended&&<button className="classroom-skip" onClick={finish}>跳过剧情</button>}</div></main>;
}

