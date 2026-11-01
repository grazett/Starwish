import {loadOpeningImage,prepareOpeningFont} from '../openingImages';
import {useEffect,useReducer,useRef,useState} from 'react';
import {parcelAssets} from '../parcelAssets';
import {parcelReducer,parcelTimers,type ParcelAction} from '../parcelFlow';
import {sound,unlockAudio,playDepartureEngine,playOpeningCue} from '../audio';
import {playerText} from '../gameState';
import {letterParagraphs,letterSignature} from '../letterContent';
import '../parcel.css';
type SpriteKind='envelope'|'closedBag'|'openBag'|'ticket';
function ObjectSprite({sheet,kind,frontOnly=false}:{sheet:HTMLImageElement;kind:SpriteKind;frontOnly?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx)return;
  const rects:Record<SpriteKind,number[]>={envelope:[0,0,1,1],closedBag:[1,0,1,1],openBag:[0,1,1,1],ticket:[1.0526,1.2663,.8405,.4498]};
  const [x,y,w,h]=rects[kind],cell=sheet.width/2;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,640,kind==='ticket'?342:640);
  ctx.drawImage(sheet,x*cell,y*cell,w*cell,h*cell,0,0,640,kind==='ticket'?342:640);
  // The same bag sprite provides the lip that occludes the ticket inside the bag.
  if(frontOnly)ctx.clearRect(0,0,640,640*.47);
 },[sheet,kind,frontOnly]);
 return <canvas ref={canvas} width={640} height={kind==='ticket'?342:640} aria-hidden="true"/>;
}
function ArtButton({children,onClick,disabled=false}:{children:string;onClick:()=>void;disabled?:boolean}){
 return <button className="parcel-action" onClick={onClick} disabled={disabled}><img src={parcelAssets.button} alt="" draggable={false}/><span>{children}</span></button>;
}
export default function ParcelContents({muted,onDepart,onLetterOpen}:{muted:boolean;onDepart?:()=>void;onLetterOpen?:()=>void}){
 const [phase,dispatch]=useReducer(parcelReducer,'envelope');
 const [sheet,setSheet]=useState<HTMLImageElement|null>(null),[error,setError]=useState(false);
 const engine=useRef<ReturnType<typeof playDepartureEngine>|null>(null);
 const paper=useRef<ReturnType<typeof playOpeningCue>|null>(null);
 useEffect(()=>{if(phase!=='unfoldingLetter')return;const cue=playOpeningCue('paper',muted);paper.current=cue;onLetterOpen?.();return()=>{cue.stop();paper.current=null;};},[phase]);
 useEffect(()=>{paper.current?.setMuted(muted);},[muted]);
 useEffect(()=>{if(phase!=='prepared')return;const playback=playDepartureEngine(muted);engine.current=playback;return()=>{playback.stop();engine.current=null;};},[phase]);
 useEffect(()=>{engine.current?.setMuted(muted);},[muted]);
 const envelope=useRef<HTMLButtonElement>(null),bag=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLElement>(null),actions=useRef<HTMLDivElement>(null);
 useEffect(()=>{let cancelled=false;Promise.all(Object.values(parcelAssets).map(src=>loadOpeningImage(src))).then(async images=>{await prepareOpeningFont('24px "Starwish IPIX"',letterParagraphs.map(text=>playerText(text)).join('')+letterSignature+'收起信件背包准备前往星愿谷');if(!cancelled)setSheet(images[1]);}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[]);
 useEffect(()=>{const timer=parcelTimers[phase];if(!timer)return;const id=setTimeout(()=>dispatch(timer.action),timer.delay);return()=>clearTimeout(id);},[phase]);
 useEffect(()=>{if(!sheet)return;
  if(phase==='envelope')envelope.current?.focus();
  else if(phase==='backpack')bag.current?.focus();
  else if(phase==='letter'||phase==='ticket')dialog.current?.focus();
  else if(phase==='letterReady'||phase==='ready')actions.current?.querySelector('button')?.focus();
 },[phase,sheet]);
 const act=(action:ParcelAction)=>{if(parcelReducer(phase,action)===phase)return;unlockAudio();sound(action==='prepare'?'confirm':'letter',muted);dispatch(action);
  if(action==='prepare'){window.dispatchEvent(new CustomEvent('starwish:journey-ready',{detail:{letterRead:true,ticketFound:true}}));}
 };
 const letterVisible=['unfoldingLetter','letterFocus','letter','letterReady','closingLetter'].includes(phase),bagVisible=['openingBag','extractingTicket','ticketFocus','ticket','closingBag'].includes(phase),finished=phase==='ready'||phase==='prepared';
 const overlay=letterVisible||bagVisible||finished;
 return <section className={`parcel-interior phase-${phase}`} aria-label="神秘包裹内部">
  <img className="parcel-interior-art" src={parcelAssets.interior} alt="打开的纸箱内部" draggable={false}/>
  {!sheet?<div className="parcel-loading" role="status">{error?'包裹素材加载失败，请刷新重试。':'正在打开神秘包裹……'}</div>:<>
   <div className={`parcel-items ${overlay?'obscured':''}`} inert={overlay?true:undefined}>
    <button ref={envelope} className={`parcel-object envelope-object ${phase==='openingLetter'?'opening':''}`} aria-label="打开信封" disabled={phase!=='envelope'} onClick={()=>act('openLetter')}><ObjectSprite sheet={sheet} kind="envelope"/></button>
    <button ref={bag} className="parcel-object backpack-object" aria-label="打开背包" disabled={phase!=='backpack'} onClick={()=>act('openBag')}><ObjectSprite sheet={sheet} kind="closedBag"/></button>
   </div>
   {!overlay&&phase!=='openingLetter'&&<p className="parcel-instruction" role="status">{phase==='envelope'?'先看看这封信。':'信件已收好，看看背包里有什么吧。'}</p>}
   {overlay&&<div className="parcel-shade"/>}
   {letterVisible&&<section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="童寄来的信" className={`parcel-letter ${phase==='closingLetter'?'storing':''}`} onKeyDown={e=>{if(e.key==='Escape'&&phase==='letterReady')act('closeLetter');}}>
    <div className={`folded-letter ${phase==='unfoldingLetter'?'':'letter-expanded'}`} onAnimationEnd={e=>{if(e.animationName==='letter-enlarge')dispatch('letterShown');}}>
     {phase==='unfoldingLetter'?['top','middle','bottom'].map(part=><div key={part} className={`paper-panel paper-${part}`} onAnimationEnd={e=>{if(part==='bottom'&&e.animationName==='paper-unfold-bottom')dispatch('letterUnfolded');}}><img src={parcelAssets.letter} alt="" draggable={false}/></div>):<img className="paper-complete" src={parcelAssets.letter} alt="" draggable={false}/>}
     {phase!=='unfoldingLetter'&&<div className="letter-copy" tabIndex={0} aria-label="信件正文">{letterParagraphs.map((text,i)=><p key={i}>{playerText(text)}</p>)}<p className="letter-signature">{letterSignature}</p></div>}
    </div>
    {phase==='letterReady'&&<div className="parcel-actions" ref={actions}><ArtButton onClick={()=>act('closeLetter')}>收起信件</ArtButton></div>}
   </section>}
   {bagVisible&&<section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="背包里的车票" className={`parcel-bag-view ${phase==='closingBag'?'storing':''}`} onKeyDown={e=>{if(e.key==='Escape'&&phase==='ticket')act('closeBag');}}>
    <div className="open-bag-art"><ObjectSprite sheet={sheet} kind="openBag"/></div>
    {phase!=='openingBag'&&<div className="ticket-flight"><div className="journey-ticket" aria-label="车票，目的地星愿谷" onAnimationEnd={e=>{if(e.animationName==='ticket-draw-out')dispatch('ticketExtracted');else if(e.animationName==='ticket-to-reader')dispatch('ticketShown');}}><ObjectSprite sheet={sheet} kind="ticket"/><div className="ticket-print"><span>旅行车票</span><strong>前往 · 星愿谷</strong></div></div></div>}
    <div className="open-bag-art bag-front"><ObjectSprite sheet={sheet} kind="openBag" frontOnly/></div>
    {phase==='ticket'&&<div className="parcel-actions" ref={actions}><ArtButton onClick={()=>act('closeBag')}>收起背包</ArtButton></div>}
   </section>}
   {finished&&<div className="parcel-ready" ref={actions}><ArtButton disabled={phase==='prepared'} onClick={()=>act('prepare')}>准备前往星愿谷</ArtButton></div>}
  </>}
  {!finished&&<button className="classroom-skip parcel-skip" onClick={()=>act('skip')}>跳过剧情</button>}
  {phase==='prepared'&&<div className="departure-blackout" role="status" aria-label="画面缓缓变暗，远处传来汽车引擎声" onAnimationEnd={e=>{if(e.animationName==='departure-fade')onDepart?.();}}/>}
 </section>;
}
