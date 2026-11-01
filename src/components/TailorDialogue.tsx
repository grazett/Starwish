import {useEffect,useRef,useState} from 'react';
import {tailorAssets,tailorFrameViewBox,tailorPortraitViewBox} from '../tailorScene';
export default function TailorDialogue({text,onClose,onAction,error,actionLabel='我来帮忙',onFinished,speaker='裁缝小姐',title='裁缝小姐的委托',npcImage=tailorAssets.npc,portraitViewBox=tailorPortraitViewBox,npcWidth=1245,npcHeight=1263,extraClass=''}:{text:string;onClose:()=>void;onAction:()=>void;error:string;actionLabel?:string;onFinished?:()=>void;speaker?:string;title?:string;npcImage?:string;portraitViewBox?:string;npcWidth?:number;npcHeight?:number;extraClass?:string}){
 const dialog=useRef<HTMLDialogElement>(null),typingTimer=useRef<ReturnType<typeof setInterval>|null>(null);
 const letters=Array.from(text),[shown,setShown]=useState(0);
 const complete=shown>=letters.length;
 useEffect(()=>{dialog.current?.showModal();},[]);
 useEffect(()=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setShown(Array.from(text).length);return;}
  setShown(0);let count=0;const timer=setInterval(()=>{count++;setShown(count);if(count>=Array.from(text).length)clearInterval(timer);},35);typingTimer.current=timer;return()=>clearInterval(timer);
 },[text]);
 useEffect(()=>{if(!complete||!onFinished)return;const timer=window.setTimeout(onFinished,1400);return()=>clearTimeout(timer);},[complete,onFinished]);
 const reveal=()=>{if(typingTimer.current)clearInterval(typingTimer.current);setShown(letters.length);};
 return <dialog ref={dialog} className={`tailor-dialog ${extraClass}`} aria-labelledby="tailor-dialog-title" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target!==event.currentTarget)return;const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)onClose();}}>
  <h2 id="tailor-dialog-title" className="tailor-sr-only">{title}</h2>
  <div className="tailor-frame">
   <svg className="tailor-frame-art" viewBox={tailorFrameViewBox} aria-hidden="true"><image href={tailorAssets.dialogue} width="2050" height="767"/></svg>
   <div className="tailor-dialog-copy" role={!complete?'button':undefined} tabIndex={!complete?0:undefined} aria-label={!complete?'显示完整对话':undefined} onClick={reveal} onKeyDown={event=>{if(!complete&&(event.key==='Enter'||event.key===' ')){event.preventDefault();reveal();}}}>
    <p><span className="tailor-sr-only">{text}</span><span aria-hidden="true">{complete?text:letters.slice(0,shown).join('')}</span>{!complete&&<span className="tailor-cursor" aria-hidden="true">▾</span>}</p>
   </div>
   <svg className="tailor-dialog-portrait" viewBox={portraitViewBox} role="img" aria-label={`${speaker}的头像`}><image href={npcImage} width={npcWidth} height={npcHeight}/></svg>
   <span className="tailor-name">{speaker}</span>
  </div>
  <div className="tailor-dialog-actions">{complete&&!onFinished&&<button className="tailor-action" onClick={onAction}>{actionLabel}</button>}</div>
  {error&&<p className="tailor-save-error" role="alert">{error}</p>}
  <button className="tailor-dialog-close" onClick={onClose} aria-label={`关闭${speaker}对话`}>×</button>
 </dialog>;
}
