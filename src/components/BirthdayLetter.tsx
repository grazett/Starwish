import {useEffect,useRef} from 'react';
import {playerText} from '../gameState';
import {birthdayLetter} from '../birthdayLetter';
import {beachAssets} from '../birthdayBeachState';

export default function BirthdayLetter({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} autoFocus tabIndex={-1} className="birthday-letter-dialog" aria-label="生日祝福信" onCancel={event=>{event.preventDefault();onClose();}}><article className="birthday-letter-sheet"><img src={beachAssets.letter} alt="" draggable={false}/><div tabIndex={0} className="birthday-letter-body" aria-label="生日祝福信正文"><h1>{playerText(birthdayLetter.salutation)}</h1>{birthdayLetter.paragraphs.map((paragraph,index)=><p key={index}>{playerText(paragraph)}</p>)}</div><button className="synthesis-action birthday-letter-return" onClick={onClose}>返回海滩</button></article></dialog>;
}
