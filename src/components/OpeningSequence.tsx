import {useCallback,useState} from 'react';
import BedroomOpening from './BedroomOpening';
import ClassroomOpening from './ClassroomOpening';
import CafeteriaOpening from './CafeteriaOpening';
import CorridorOpening from './CorridorOpening';
import {corridorAssets} from '../corridorScene';
import {cafeteriaAssets} from '../cafeteriaScene';
import {classroomAssets} from '../classroomScene';
import {useEffect} from 'react';
export default function OpeningSequence({autoPlay=false,initialScene='bedroom'}:{autoPlay?:boolean;initialScene?:'bedroom'|'classroom'|'cafeteria'}={}){
 const [scene,setScene]=useState<'bedroom'|'classroom'|'cafeteria'|'corridor'>(initialScene);
 const [covered,setCovered]=useState(autoPlay||initialScene!=='bedroom');
 const ready=useCallback(()=>setCovered(false),[]);
 const next=useCallback(()=>{setCovered(true);setScene('classroom');},[]),lunch=useCallback(()=>{setCovered(true);setScene('cafeteria');},[]),home=useCallback(()=>{setCovered(true);setScene('corridor');},[]);
 useEffect(()=>{
  if(covered)return;
  const sources=scene==='bedroom'?classroomAssets:scene==='classroom'?cafeteriaAssets:scene==='cafeteria'?Object.values(corridorAssets):[];
  const images:HTMLImageElement[]=[];
  const timer=setTimeout(()=>sources.forEach(src=>{const image=new Image();image.fetchPriority='low';image.src=src;images.push(image);}),1500);
  return()=>{clearTimeout(timer);};
 },[scene,covered]);
 return <>{scene==='bedroom'?<BedroomOpening onComplete={next} onReady={ready} autoPlay={autoPlay}/>:scene==='classroom'?<ClassroomOpening onComplete={lunch} onReady={ready}/>:scene==='cafeteria'?<CafeteriaOpening onComplete={home} onReady={ready}/>:<CorridorOpening onReady={ready}/>}<div className={`sequence-blackout ${covered?'covered':''}`} aria-hidden="true"/>{covered&&<div className="sequence-loading" role="status"><p>正在准备{({bedroom:'卧室',classroom:'教室',cafeteria:'食堂',corridor:'傍晚走廊'})[scene]}场景……</p><small>首次打开需要加载图片，请稍候。</small></div>}</>;
}
