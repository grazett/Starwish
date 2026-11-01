import {loadOpeningImage,prepareOpeningFont} from '../openingImages';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {cloudSprites,titleAssets} from '../titleAssets';
import {sound,unlockAudio} from '../audio';
import {useGameMusic} from '../useGameMusic';
import {bgm} from '../music';
type OpeningState='opening'|'titleReveal'|'menuReady';
const muteKey='starwish-title-muted';
const fontVariant=new URLSearchParams(window.location.search).get('font')==='smiley'?'smiley':'pixel';
const fontFamily=fontVariant==='pixel'?'Starwish Pixel':'Starwish Smiley';
function readMute(){try{return localStorage.getItem(muteKey)==='true';}catch{return false;}}

export default function TitleOpening({onStart}:{onStart?:()=>void}={}){
 const [state,setState]=useState<OpeningState>('opening');
 const [loaded,setLoaded]=useState(false),[error,setError]=useState(false);
 const [openingStarted,setOpeningStarted]=useState(false);
 const playback=useSyncExternalStore(bgm.subscribe,bgm.getPlayback);
 const [muted,setMuted]=useState(readMute),[manual,setManual]=useState(false),[pressed,setPressed]=useState(false);
 const scene=useRef<HTMLDivElement>(null),closeButton=useRef<HTMLButtonElement>(null),manualButton=useRef<HTMLButtonElement>(null);
 const pressTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>{let cancelled=false;const images=Object.values(titleAssets).map(src=>loadOpeningImage(src));const fonts=[prepareOpeningFont(`700 32px "${fontFamily}"`,'欢迎来到星愿谷开始旅程旅行手册'),prepareOpeningFont('400 12px "Starwish IPIX"','旅行手册欢迎来到星愿谷合上手册')];Promise.all([...images,...fonts]).then(()=>{if(!cancelled)setLoaded(true);}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[]);
 useGameMusic(loaded?'title':'silent',muted);
 useEffect(()=>{if(loaded&&(muted||playback==='playing'))setOpeningStarted(true);},[loaded,muted,playback]);
 useEffect(()=>{if(!openingStarted)return;let frame=0;const start=performance.now();const tick=(now:number)=>{const elapsed=(now-start)/1000,t=Math.min(1,Math.max(0,(elapsed-2)/2)),camera=t*t*(3-2*t);scene.current?.style.setProperty('--camera',String(camera));scene.current?.style.setProperty('--dawn',String(Math.max(0,1-elapsed/2)));setState(previous=>{const next=elapsed>=9?'menuReady':elapsed>=4?'titleReveal':'opening';return previous===next?previous:next;});if(elapsed<9)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[openingStarted]);
 useEffect(()=>{try{localStorage.setItem(muteKey,String(muted));}catch{/* 当前会话仍可切换 */}},[muted]);
 useEffect(()=>()=>clearTimeout(pressTimer.current),[]);
 useEffect(()=>{if(!manual)return;closeButton.current?.focus();const handler=(e:KeyboardEvent)=>{if(e.key==='Escape'){setManual(false);manualButton.current?.focus();}if(e.key==='Tab'){e.preventDefault();closeButton.current?.focus();}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[manual]);
 const clickSound=()=>{unlockAudio();sound('click',muted);};
 const closeGuide=()=>{setManual(false);manualButton.current?.focus();};
 const ready=state==='menuReady';
 return <main className="opening-screen" data-font={fontVariant} aria-label="星愿谷标题开场"><div ref={scene} className={`sky-scene ${openingStarted?'playing':''}`} data-phase={state}>
  <div className="sky-texture"><img src={titleAssets.sky} alt="" draggable={false}/></div><div className="dawn-overlay"/>
  {['far','middle','near'].map(layer=><div className={`cloud-layer ${layer}`} key={layer} aria-hidden="true">{cloudSprites.filter(c=>c.layer===layer).map((c,i)=><div className="cloud-sprite" key={i} style={{left:`${c.x}%`,top:`${c.y}%`,width:`${c.width}%`,animationDelay:`${c.delay}s`}}><img src={titleAssets[c.asset]} alt="" draggable={false}/></div>)}</div>)}
  <div className="title-artboard" inert={!openingStarted}><div className="sign-entrance" aria-hidden={state==='opening'}><div className="sign-idle"><img className="sign-art" src={titleAssets.sign} alt="" draggable={false}/><h1>欢迎来到星愿谷</h1></div></div>
   <nav className="title-menu" aria-label="标题菜单" aria-hidden={!ready}><div className="menu-entrance first"><button className={`pixel-menu-button ${pressed?'pressed':''}`} disabled={!ready} tabIndex={ready?0:-1} onClick={()=>{if(pressed)return;clickSound();setPressed(true);pressTimer.current=setTimeout(()=>{setPressed(false);onStart?.();},260);}}><img src={titleAssets.button} alt="" draggable={false}/><span>开始旅程</span></button></div><div className="menu-entrance second"><button ref={manualButton} className="pixel-menu-button" disabled={!ready} tabIndex={ready?0:-1} onClick={()=>{clickSound();setManual(true);}}><img src={titleAssets.button} alt="" draggable={false}/><span>旅行手册</span></button></div></nav>
  </div>
  {loaded&&!openingStarted&&<div className="opening-audio-gate"><button onClick={()=>{unlockAudio();setOpeningStarted(true);}}>♪ 点击进入星愿谷</button></div>}
  <button className={`music-button ${muted?'muted':''}`} title={muted?'开启声音':'关闭声音'} aria-label={muted?'开启声音':'关闭声音'} aria-pressed={!muted} onClick={()=>{unlockAudio();setMuted(v=>!v);}}><svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 3h2v8H6zM8 2h6v3H8zM12 3h2v7h-2zM3 10h5v3H3zM2 11h2v2H2zM9 9h5v3H9zM8 10h2v2H8z"/></svg></button>
  {!loaded&&<div className="loading-note" role="status">{error?'图片加载超时或失败，请重试。':'正在整理云朵……'}{error&&<button onClick={()=>location.reload()}>重新加载</button>}</div>}
 </div>
 {manual&&<div className="guide-backdrop" onClick={closeGuide}><section className="travel-guide" role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={e=>e.stopPropagation()}><img className="guide-art" src={titleAssets.noticeboard} width="1774" height="887" alt="" draggable={false}/><div className="guide-content"><h2 id="guide-title">旅行手册</h2><div className="guide-body"><p>欢迎来到星愿谷。</p><p>这里的每一扇门、每一件旧物，或许都藏着不为人知的故事。</p><p>请带上你的好奇心，留意旅途中那些不起眼的细节。</p><p>有些东西，只有在恰当的时候才会显露真容。</p><p>愿你有一段奇妙的旅程。✦</p><p className="guide-tip">✧ 旅途提示 ✧<br/>点击探索 · 留意线索 · 自动保存进度</p></div><button ref={closeButton} className="guide-close" onClick={()=>{clickSound();closeGuide();}}>合上手册</button></div></section></div>}
 </main>;
}



