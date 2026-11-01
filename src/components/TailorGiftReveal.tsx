import {useEffect,useRef} from 'react';
import {catchAssets} from '../memoryCatch';

export default function TailorGiftReveal({onCollect,onClose,error}:{onCollect:()=>void;onClose:()=>void;error:string}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog ref={dialog} className="tailor-gift-reveal" aria-label="裁缝小姐送来的迷你小围兜" onCancel={event=>{event.preventDefault();onClose();}}>
  <div className="tailor-gift-content"><img src={catchAssets.bib} alt="粉色迷你小围兜" draggable={false}/><p>迷你小围兜</p><button className="tailor-action" autoFocus onClick={onCollect}>收进背包</button>{error&&<p className="tailor-gift-error" role="alert">{error}</p>}</div>
  <button className="tailor-dialog-close" onClick={onClose} aria-label="稍后收下围兜">×</button>
 </dialog>;
}
