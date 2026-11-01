import {useCallback,useState} from 'react';
import BedroomOpening from './BedroomOpening';
import ClassroomOpening from './ClassroomOpening';
import CafeteriaOpening from './CafeteriaOpening';
import CorridorOpening from './CorridorOpening';
import {corridorAssets} from '../corridorScene';
import {cafeteriaAssets} from '../cafeteriaScene';
import {classroomAssets} from '../classroomScene';
import {useEffect} from 'react';
import {preloadOpeningImages} from '../openingImages';
export default function OpeningSequence({autoPlay=false,initialScene='bedroom'}:{autoPlay?:boolean;initialScene?:'bedroom'|'classroom'|'cafeteria'}={}){
 const [scene,setScene]=useState<'bedroom'|'classroom'|'cafeteria'|'corridor'>(initialScene);
 const [covered,setCovered]=useState(autoPlay||initialScene!=='bedroom');
 const [attempt,setAttempt]=useState(0),[slow,setSlow]=useState(false),[progress,setProgress]=useState('');
 const reportProgress=useCallback((loaded:number,total:number)=>setProgress(`已加载 ${loaded}/${total}`),[]);
 useEffect(()=>{setSlow(false);setProgress('');if(!covered)return;const timer=setTimeout(()=>setSlow(true),12000);return()=>clearTimeout(timer);},[scene,covered,attempt]);
 const ready=useCallback(()=>setCovered(false),[]);
 const next=useCallback(()=>{setCovered(true);setScene('classroom');},[]),lunch=useCallback(()=>{setCovered(true);setScene('cafeteria');},[]),home=useCallback(()=>{setCovered(true);setScene('corridor');},[]);
 useEffect(()=>{
  if(covered)return;
  const sources=scene==='bedroom'?classroomAssets:scene==='classroom'?cafeteriaAssets:scene==='cafeteria'?Object.values(corridorAssets):[];
  let stop:undefined|(()=>void);
  const timer=setTimeout(()=>{stop=preloadOpeningImages(sources);},800);
  return()=>{clearTimeout(timer);stop?.();};
 },[scene,covered]);
 return <><div key={`${scene}-${attempt}`}>{scene==='bedroom'?<BedroomOpening onComplete={next} onReady={ready} onProgress={reportProgress} autoPlay={autoPlay}/>:scene==='classroom'?<ClassroomOpening onComplete={lunch} onReady={ready}/>:scene==='cafeteria'?<CafeteriaOpening onComplete={home} onReady={ready}/>:<CorridorOpening onReady={ready}/>}</div><div className={`sequence-blackout ${covered?'covered':''}`} aria-hidden="true"/>{covered&&<div className="sequence-loading" role="status"><p>正在准备{({bedroom:'卧室',classroom:'教室',cafeteria:'食堂',corridor:'傍晚走廊'})[scene]}场景……</p><small>{progress||'首次打开需要加载图片，请稍候。'}</small>{slow&&<><small>图片下载较慢，可以重试加载。</small><button onClick={()=>setAttempt(value=>value+1)}>重新加载本幕</button></>}</div>}</>;
}
