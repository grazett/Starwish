import {loadOpeningImage,prepareOpeningFont} from '../openingImages';
import {useEffect,useRef,useState} from 'react';
import {journeyAssets,renderJourney} from '../journeyScene';
import {journeyDuration,journeyPose} from '../journeyTimeline';
import {playDepartureEngine} from '../audio';
import {useAmbience} from '../useAmbience';
import '../journey.css';
const query=new URLSearchParams(location.search),inspect=query.get('scene')==='journey'?query.get('at'):null;
const still=inspect!==null&&Number.isFinite(Number(inspect))?Math.max(0,Math.min(journeyDuration,Number(inspect))):null;
export default function JourneyOpening({muted,onComplete}:{muted:boolean;onComplete?:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),caption=useRef<HTMLParagraphElement>(null),images=useRef<Record<string,HTMLImageElement>>({}),time=useRef(still??0),sent=useRef(false),skipping=useRef<number|null>(null);
 const [ready,setReady]=useState(false),[error,setError]=useState(false),[ended,setEnded]=useState(false),engine=useRef<ReturnType<typeof playDepartureEngine>|null>(null);
 useAmbience('nature',muted,ready&&!ended&&still===null,.18);
 useEffect(()=>{let cancelled=false;Promise.all(Object.entries(journeyAssets).map(async ([key,src])=>{const image=await loadOpeningImage(src);return [key,image] as const;})).then(async list=>{await prepareOpeningFont('44px "Starwish IPIX"','下一站星愿谷');if(!cancelled){images.current=Object.fromEntries(list);setReady(true);}}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[]);
 useEffect(()=>{if(!ready||still!==null||ended)return;const playback=playDepartureEngine(muted,true);engine.current=playback;return()=>{playback.stop();engine.current=null;};},[ready,ended]);
 useEffect(()=>{engine.current?.setMuted(muted);},[muted]);
 useEffect(()=>{if(!ready||ended)return;let raf=0,previous=performance.now();
  const finish=()=>{if(sent.current)return;sent.current=true;setEnded(true);window.dispatchEvent(new CustomEvent('starwish:opening-complete',{detail:{nextScene:'wardrobe',skipped:skipping.current!==null}}));onComplete?.();};
  const tick=(now:number)=>{const dt=Math.min((now-previous)/1000,.1);previous=now;if(still===null)time.current=Math.min(journeyDuration,time.current+dt);const ctx=canvas.current?.getContext('2d');if(ctx){renderJourney(ctx,images.current,time.current);if(skipping.current!==null){skipping.current+=dt;ctx.fillStyle=`rgba(0,0,0,${Math.min(1,skipping.current/.6)})`;ctx.fillRect(0,0,1920,1080);}}
   const pose=journeyPose(time.current);if(caption.current)caption.current.style.opacity=String(pose.text*(1-Math.max(pose.roadBlack,pose.endBlack))*(skipping.current===null?1:1-Math.min(1,skipping.current/.6)));
   if((still===null&&time.current>=journeyDuration)||(skipping.current!==null&&skipping.current>=.6)){finish();return;}raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
 },[ready,ended,onComplete]);
 return <section className="journey-scene" aria-label="最终转场：下一站，星愿谷"><canvas ref={canvas} width={1920} height={1080} aria-label={ended?'开场转场结束，等待下一阶段':'乡间公路大巴驶过'}/>{ready&&!ended&&<p ref={caption} className="journey-caption">下一站，星愿谷</p>}{error&&<div className="classroom-controls" role="alert">旅行素材加载失败，请刷新重试。</div>}{ready&&!ended&&<button className="classroom-skip journey-skip" onClick={()=>{if(skipping.current===null)skipping.current=0;}}>跳过剧情</button>}</section>;
}
