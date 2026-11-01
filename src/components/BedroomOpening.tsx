import {loadOpeningImage,prepareOpeningFont} from '../openingImages';
import {useEffect,useRef,useState} from 'react';
import {useGameMusic} from '../useGameMusic';
import {bedroomAssetSources,duration,renderBedroom,prepareBedroom} from '../bedroomV5Scene';
import '../bedroom.css';
// 只用于检查位置和遮挡的定格预览，不影响正常播放入口。
const inspectValue=new URLSearchParams(window.location.search).get('at');
const inspectTime=inspectValue!==null&&Number.isFinite(Number(inspectValue))?Math.max(0,Math.min(duration,Number(inspectValue))):null;

export default function BedroomOpening({onComplete,onReady,onProgress,autoPlay=false}:{onComplete?:()=>void;onReady?:()=>void;onProgress?:(loaded:number,total:number)=>void;autoPlay?:boolean}={}){
 const announced=useRef(false);const canvas=useRef<HTMLCanvasElement>(null),audio=useRef<AudioContext|null>(null);
 const [ready,setReady]=useState(false),[error,setError]=useState(false),[playing,setPlaying]=useState(false),[finished,setFinished]=useState(false),[muted,setMuted]=useState(()=>{try{return localStorage.getItem('starwish-title-muted')==='true';}catch{return false;}});
 const assets=useRef<HTMLImageElement[]>([]),time=useRef(inspectTime??0),ringed=useRef(false);
 useGameMusic('intro',muted);
 useEffect(()=>{if(error)onReady?.();},[error,onReady]);
 useEffect(()=>{let cancelled=false,loaded=0;onProgress?.(0,bedroomAssetSources.length);Promise.all(bedroomAssetSources.map(async src=>{const image=await loadOpeningImage(src);if(!cancelled)onProgress?.(++loaded,bedroomAssetSources.length);return image;})).then(async images=>{await prepareOpeningFont('24px "Starwish IPIX"','啊怎么又要上学了');if(cancelled)return;prepareBedroom(images);assets.current=images;setReady(true);}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[]);
 useEffect(()=>{if(!ready)return;let frame=0,previous=performance.now();const tick=(now:number)=>{if(playing){time.current=Math.min(duration,time.current+Math.min((now-previous)/1000,.1));if(time.current>=1.4&&!ringed.current){ringed.current=true;if(!muted&&audio.current){const ac=audio.current;for(let i=0;i<10;i++){const osc=ac.createOscillator(),gain=ac.createGain(),start=ac.currentTime+i*.2;osc.type='square';osc.frequency.value=i%2?1047:784;gain.gain.setValueAtTime(.015,start);gain.gain.exponentialRampToValueAtTime(.001,start+.12);osc.connect(gain);gain.connect(ac.destination);osc.start(start);osc.stop(start+.13);}}}if(time.current>=duration){setPlaying(false);setFinished(true);onComplete?.();}}previous=now;const ctx=canvas.current?.getContext('2d');if(ctx){try{renderBedroom(ctx,assets.current,time.current);}catch{setError(true);return;}if(!announced.current){announced.current=true;onReady?.();}}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[ready,playing,muted,onComplete,onReady]);
 const start=()=>{try{audio.current??=new AudioContext();if(!muted)void audio.current.resume();}catch{/* 无音频环境仍能播放 */}time.current=0;ringed.current=false;setFinished(false);setPlaying(true);};
 useEffect(()=>{if(ready&&autoPlay&&inspectTime===null)start();},[ready,autoPlay]);
 useEffect(()=>()=>{void audio.current?.close();},[]);
 return <main className="bedroom-preview"><div className="bedroom-stage"><canvas ref={canvas} width={1920} height={1080} aria-label="清晨卧室：醒来、下床、走向左侧房门"/>{inspectTime===null&&(error||(!autoPlay&&(!playing||!ready)))&&<div className="bedroom-controls"><p>{error?'素材未能加载，请刷新重试。':!ready?'正在准备卧室……':finished?'清晨卧室 · 本幕结束':'清晨卧室 · 第一幕预览'}</p>{ready&&<button onClick={start}>{finished?'重播这一幕':'播放卧室动画'}</button>}<a href="/">返回标题页</a></div>}<button className={`music-button ${muted?'muted':''}`} title={muted?'开启声音':'关闭声音'} aria-label={muted?'开启声音':'关闭声音'} aria-pressed={!muted} onClick={()=>{const next=!muted;setMuted(next);try{localStorage.setItem('starwish-title-muted',String(next));}catch{}if(audio.current)void (next?audio.current.suspend():audio.current.resume());}}><svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 3h2v8H6zM8 2h6v3H8zM12 3h2v7h-2zM3 10h5v3H3zM2 11h2v2H2zM9 9h5v3H9zM8 10h2v2H8z"/></svg></button></div></main>;
}







