import {useRef,useState} from 'react';
import {unlockRoomChest,type RoomProgress} from '../gameState';
import '../roomGate.css';
import {playGameEffect} from '../audio';

export function MysteryGiftIcon(){return <img src="/assets/level-one/glasses.webp" alt="小眼镜" draggable={false}/>;}

export function RoomPassword({progress,onSave,onUnlocked}:{progress:RoomProgress;onSave:(next:RoomProgress)=>boolean;onUnlocked:()=>void}){
 const [digits,setDigits]=useState(['','','']);
 const [error,setError]=useState('');
 const fields=useRef<(HTMLInputElement|null)[]>([]);
 if(!progress.clues.every(Boolean))return <p className="room-gate-message">房门还锁着。先在房间里找齐三条线索，再回来试试吧。</p>;
 if(progress.chestOpened)return <p className="room-gate-message">宝箱已经打开了，先去收下里面的小眼镜吧。</p>;
 const input=(index:number,value:string)=>{const next=[...digits];next[index]=value.replace(/[^0-9]/g,'').slice(-1);setDigits(next);setError('');if(next[index]&&index<2)fields.current[index+1]?.focus();};
 return <form className="room-password-form" onSubmit={event=>{event.preventDefault();if(digits.some(value=>!value)){setError('请填好三个数字。');return;}const next=unlockRoomChest(progress,digits.join(''));if(!next){setError('密码似乎不对，再看看找到的线索吧。');return;}if(onSave(next)){playGameEffect('chest');onUnlocked();}}}>
  <p>按照线索①②③的顺序，输入三个数字。</p>
  <div className="room-password-fields">{digits.map((value,index)=><label key={index}><span>{['①','②','③'][index]}</span><input ref={el=>{fields.current[index]=el;}} aria-label={`第${index+1}位密码`} type="text" inputMode="numeric" pattern="[0-9]" maxLength={1} autoComplete="off" value={value} onChange={event=>input(index,event.target.value)} onPaste={event=>{event.preventDefault();const pasted=event.clipboardData.getData('text').replace(/[^0-9]/g,'').slice(0,3-index);if(!pasted)return;const next=[...digits];[...pasted].forEach((digit,offset)=>{next[index+offset]=digit;});setDigits(next);setError('');fields.current[Math.min(2,index+pasted.length)]?.focus();}} onKeyDown={event=>{if(event.key==='Backspace'&&!value&&index>0)fields.current[index-1]?.focus();if(event.key==='ArrowLeft'&&index>0)fields.current[index-1]?.focus();if(event.key==='ArrowRight'&&index<2)fields.current[index+1]?.focus();}}/></label>)}</div>
  <p className="room-password-error" role="status">{error}</p><button type="submit" className="password-submit">确认密码</button>
 </form>;
}

