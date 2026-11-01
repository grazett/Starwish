import {loadOpeningImage,prepareOpeningFont} from '../openingImages';
import {useEffect,useRef,useState} from 'react';
import {useGameMusic} from '../useGameMusic';
import {useAmbience} from '../useAmbience';
import {classroomAssets,classroomDuration,renderClassroom} from '../classroomScene';
import '../classroom.css';
const inspect=new URLSearchParams(location.search).get('at');
const still=inspect!==null&&Number.isFinite(Number(inspect))?Math.max(0,Math.min(classroomDuration,Number(inspect))):null;
export default function ClassroomOpening({onComplete,onReady}:{onComplete?:()=>void;onReady?:()=>void}={}){
 const announced=useRef(false);const canvas=useRef<HTMLCanvasElement>(null),assets=useRef<HTMLImageElement[]>([]),time=useRef(still??0);
 const [ready,setReady]=useState(false),[error,setError]=useState(false),[ended,setEnded]=useState(false),[run,setRun]=useState(0);
 const [muted,setMuted]=useState(()=>{try{return localStorage.getItem('starwish-title-muted')==='true';}catch{return false;}});
 useGameMusic('intro',muted);
 useAmbience('writing',muted,ready&&!ended&&still===null,.23);
 useEffect(()=>{if(error)onReady?.();},[error,onReady]);
 useEffect(()=>{let cancelled=false;Promise.all(classroomAssets.map(src=>loadOpeningImage(src))).then(async images=>{await prepareOpeningFont('36px "Starwish IPIX"','好想出去玩啊');if(!cancelled){assets.current=images;setReady(true);}}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[]);
 useEffect(()=>{if(!ready||ended)return;let raf=0,previous=performance.now();
  const tick=(now:number)=>{if(still===null)time.current=Math.min(classroomDuration,time.current+Math.min((now-previous)/1000,.1));previous=now;const ctx=canvas.current?.getContext('2d');if(ctx){renderClassroom(ctx,assets.current,time.current);if(!announced.current){announced.current=true;onReady?.();}}if(time.current>=classroomDuration&&still===null){setEnded(true);onComplete?.();return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
 },[ready,ended,run,onComplete,onReady]);
 const finish=()=>{time.current=classroomDuration;const ctx=canvas.current?.getContext('2d');if(ctx&&ready)renderClassroom(ctx,assets.current,time.current);setEnded(true);onComplete?.();};
 return <main className="classroom-preview"><div className="classroom-stage"><canvas ref={canvas} width={1920} height={1080} aria-label="学校教室：上课、托腮望向窗外"/>{(error||(!onComplete&&(!ready||ended)&&still===null))&&<div className="classroom-controls"><p>{error?'教室素材加载失败，请刷新重试。':!ready?'正在准备教室……':'教室 · 本幕结束'}</p>{ended&&<><button onClick={()=>{time.current=0;setEnded(false);setRun(v=>v+1);}}>重播教室</button><a href="/?scene=bedroom">从卧室重播</a><a href="/">返回标题页</a></>}</div>}
 <button className={`music-button ${muted?'muted':''}`} aria-label={muted?'开启声音':'关闭声音'} aria-pressed={!muted} onClick={()=>{const next=!muted;setMuted(next);try{localStorage.setItem('starwish-title-muted',String(next));}catch{}}}><svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 3h2v8H6zM8 2h6v3H8zM12 3h2v7h-2zM3 10h5v3H3zM2 11h2v2H2zM9 9h5v3H9zM8 10h2v2H8z"/></svg></button>
 {!ended&&<button className="classroom-skip" onClick={finish}>跳过剧情</button>}</div></main>;
}



