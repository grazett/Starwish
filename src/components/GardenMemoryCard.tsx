import {useEffect,useRef,useState} from 'react';
import type {MemoryCard} from '../memoryGarden';
import type {MemoryId} from '../memoryCatch';

function PhotoContent({card}:{card:MemoryCard}){return card.photo?<img className="garden-real-photo" src={card.photo} alt={card.title}/>:<div className="garden-photo-placeholder"><img src={card.icon} alt=""/><span>照片待添加</span><small>{card.name} · 占位照片</small></div>;}
function PhotoZoom({card,onClose}:{card:MemoryCard;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog ref={dialog} className="garden-photo-zoom" aria-label={`${card.name}照片放大查看`} onCancel={event=>{event.preventDefault();event.stopPropagation();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div className="garden-zoom-content"><PhotoContent card={card}/><button autoFocus className="garden-action" onClick={onClose}>返回照片</button></div></dialog>;
}
export default function GardenMemoryCard({card,onClose,onViewed,error}:{card:MemoryCard;onClose:()=>void;onViewed:(id:MemoryId)=>void;error:string}){
 const dialog=useRef<HTMLDialogElement>(null),[zoom,setZoom]=useState(false);
 useEffect(()=>{const el=dialog.current;if(!el)return;if(!el.open)el.showModal();onViewed(card.id);},[card.id,onViewed]);
 return <>
  <dialog ref={dialog} className="garden-memory-card" aria-labelledby={`garden-card-${card.id}`} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target!==event.currentTarget)return;const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();}}>
   <button className="garden-card-close" autoFocus onClick={onClose} aria-label="关闭照片">×</button>
   <p className="garden-card-eyebrow">回忆花园{card.date?<> · <time dateTime={card.date}>{card.date.replaceAll('-','.')}</time></>:!card.photo&&' · 照片待添加'}</p>
   <button className="garden-card-photo" onClick={()=>setZoom(true)} aria-label={`放大查看${card.name}照片`}><PhotoContent card={card}/></button>
   <small className="garden-photo-hint">点击照片放大查看</small>
   <h2 id={`garden-card-${card.id}`}>{card.title}</h2><p className="garden-card-message">{card.message}</p>
   {error&&<div className="garden-card-error" role="alert"><p>{error}</p><button className="garden-action" onClick={()=>onViewed(card.id)}>重试保存</button></div>}
   <button className="garden-action garden-card-return" onClick={onClose}>返回池塘</button>
  </dialog>
  {zoom&&<PhotoZoom card={card} onClose={()=>setZoom(false)}/>}
 </>;
}
