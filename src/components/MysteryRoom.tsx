import {useCallback,useEffect,useRef,useState} from 'react';
import {roomHotspots,type RoomItemId} from '../mysteryRoomScene';
import {readGameState,saveRoomProgress,openRoomDoor,takeRoomGift,leaveRoom,type RoomProgress} from '../gameState';
import {playGameEffect,playSewingMachine,unlockAudio} from '../audio';
import {useGameMusic} from '../useGameMusic';
import {BookshelfPuzzle,DrawerPuzzle,DiaryPuzzle,clueDefinitions} from './RoomPuzzles';
import {RoomPassword,MysteryGiftIcon} from './RoomGate';
import '../mysteryRoom.css';
import SharedBackpack from './SharedBackpack';

export default function MysteryRoom({onNextScene}:{onNextScene?:()=>void}={}){
 const [active,setActive]=useState<'guide'|RoomItemId|null>(()=>readGameState().room.doorOpened?null:'guide');
 const [notes,setNotes]=useState(false);
 const [imageError,setImageError]=useState(false);
 const [progress,setProgress]=useState(()=>readGameState().room);
 const [saveError,setSaveError]=useState('');
 const [flowMessage,setFlowMessage]=useState('');
 const [exitPhase,setExitPhase]=useState<'idle'|'fading'|'black'>(()=>readGameState().room.exitedRoom?'black':'idle');
 const [muted,setMuted]=useState(()=>{try{return localStorage.getItem('starwish-title-muted')==='true';}catch{return false;}});
 const sewing=useRef<ReturnType<typeof playSewingMachine>|null>(null);
 // Keep the level track alive through the exit blackout and later scenes.
 useGameMusic('room',muted,progress.doorOpened);
 const save=useCallback((next:RoomProgress)=>{try{saveRoomProgress(next);setProgress(next);setSaveError('');return true;}catch{setSaveError('线索暂时无法保存，请重试；不要关闭当前页面。');return false;}},[]);
 const dialog=useRef<HTMLDialogElement>(null);
 const debug=new URLSearchParams(location.search).get('debugHotspots')==='1';
 useEffect(()=>{if(exitPhase!=='black'||!onNextScene||debug)return;const timer=window.setTimeout(onNextScene,650);return()=>clearTimeout(timer);},[exitPhase,onNextScene,debug]);
 const item=roomHotspots.find(value=>value.id===active);
 const puzzle=active!==null&&['bookshelf','nightstand','diary'].includes(active);
 useEffect(()=>{
  if(active==='guide'){const timer=window.setTimeout(()=>setActive(null),3000);return()=>clearTimeout(timer);}
  const el=dialog.current;if(active&&el&&!el.open)el.showModal();
 },[active]);
 useEffect(()=>{
  if(!progress.doorOpened||exitPhase!=='idle')return;
  const cue=playSewingMachine(muted);sewing.current=cue;
  return()=>{cue.stop();if(sewing.current===cue)sewing.current=null;};
 },[progress.doorOpened,exitPhase]);
 useEffect(()=>{sewing.current?.setMuted(muted);},[muted]);
 useEffect(()=>{
  if(exitPhase!=='fading')return;
  const timer=window.setTimeout(()=>{if(save(leaveRoom(progress))){setExitPhase('black');window.dispatchEvent(new CustomEvent('starwish:first-level-exit',{detail:{nextScene:'tailor',item:'glasses'}}));}else setExitPhase('idle');},900);
  return()=>clearTimeout(timer);
 },[exitPhase,progress,save]);
 const close=()=>{dialog.current?.close();setActive(null);};
 const collectGift=()=>{const next=takeRoomGift(progress);if(next===progress)return;if(save(next)){close();setFlowMessage('已收下小眼镜。房门似乎可以打开了！');}};
 const explore=(id:RoomItemId)=>{
  if(id==='lock'&&progress.doorOpened){if(exitPhase==='idle')setExitPhase('fading');return;}
  if(id==='lock'&&progress.giftCollected){unlockAudio();const next=openRoomDoor(progress);if(save(next)){playGameEffect('door');setFlowMessage('');}return;}
  if(id==='chest'&&progress.chestOpened){if(!progress.giftCollected)collectGift();else setFlowMessage('宝箱里的小眼镜已经收好了。');return;}
  setActive(id);
 };
 if(exitPhase==='black')return <div className="room-exit-black" role="img" aria-label="已走出房间，下一场景暂为黑幕">{debug&&<button className="room-black-debug" onClick={()=>{if(save({...progress,exitedRoom:false}))setExitPhase('idle');}}>返回开门状态（调试）</button>}</div>;
 return <div className="mystery-exploration" onPointerDown={unlockAudio}>
  <nav className="mystery-tools" aria-label="探索工具"><SharedBackpack chapterLabel="第一关 · 神秘房间" refreshKey={`${progress.clues[1]}-${progress.giftCollected}`} closeKey={String(active)} onOpen={()=>setNotes(false)}/><button onClick={()=>setNotes(value=>!value)} aria-expanded={notes} aria-controls="room-clues">{notes?'收起':'展开'}线索记录</button>{debug&&<button onClick={()=>{if(save({version:1,books:[false,false],drawerOpen:false,clues:[false,false,false],chestOpened:false,giftCollected:false,doorOpened:false,exitedRoom:false})){close();setNotes(false);setFlowMessage('');setExitPhase('idle');}}}>重置谜题测试</button>}{debug&&<button onClick={()=>{if(save({...progress,chestOpened:false,giftCollected:false,doorOpened:false,exitedRoom:false})){close();setFlowMessage('');setExitPhase('idle');}}}>重置门锁测试</button>}<button className="room-music-toggle" aria-label={muted?'开启声音':'关闭声音'} aria-pressed={!muted} onClick={()=>{unlockAudio();const next=!muted;setMuted(next);try{localStorage.setItem('starwish-title-muted',String(next));}catch{}}}><svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 3h2v8H6zM8 2h6v3H8zM12 3h2v7h-2zM3 10h5v3H3zM2 11h2v2H2zM9 9h5v3H9zM8 10h2v2H8z"/></svg></button></nav>
  {notes&&<aside className="room-clues" id="room-clues" aria-label="线索记录"><h2>线索记录</h2><p>在房间里寻找线索，留意它们的含义。</p><ol>{clueDefinitions.map((clue,index)=><li key={clue.symbol}>{progress.clues[index]?<button className="clue-review" aria-label={`重看线索${clue.symbol}`} onClick={()=>{setNotes(false);setActive(clue.item);}}><span>线索{clue.symbol}<small>{clue.source} · 点击重看</small></span></button>:<><span>线索{clue.symbol} · 尚未发现</span></>}</li>)}</ol><small>线索会自动保存在当前浏览器。</small></aside>}
  <div className={`mystery-image-space ${debug?'debug-hotspots':''}`}>
   <img className="mystery-room-image" src="/assets/level-one/room.webp" alt="神秘房间：左侧书架和书桌，中间是窗户、盆栽与摆着玩偶的床，右侧床头柜、上锁木门和宝箱" onError={()=>setImageError(true)} draggable={false}/>
   {progress.chestOpened&&<img className="room-state-art room-state-chest" src="/assets/level-one/room-chest-open.webp" alt="右侧的宝箱已经打开"/>}
   {progress.doorOpened&&<img className="room-state-art room-state-door" src="/assets/level-one/room-chest-door-outdoors.webp" alt="房门打开，门外是阳光下的草地、小路与树木"/>}
   {active==='guide'&&<div className="room-intro-text" role="status"><p>第一关 · 神秘房间</p><p>找到线索，打开房门。</p></div>}
   {!imageError&&roomHotspots.map(({id,label,rect,clip})=><button key={id} className="room-hotspot" style={{left:`${rect[0]}%`,top:`${rect[1]}%`,width:`${rect[2]}%`,height:`${rect[3]}%`,clipPath:clip}} aria-label={id==='lock'&&progress.giftCollected?(progress.doorOpened?'走出房门，循着缝纫机的声音':'打开房门'):`探索${label}`} disabled={active!==null} onClick={()=>explore(id)}>{debug&&<span>{label}</span>}</button>)}
   {progress.chestOpened&&!progress.giftCollected&&<button className="room-gift-pickup" aria-label="拿取宝箱里的小眼镜" disabled={active!==null} onClick={collectGift}><MysteryGiftIcon/></button>}
   {progress.giftCollected&&!progress.doorOpened&&<span className="room-door-prompt">打开房门 ▼</span>}
   {(progress.doorOpened||flowMessage)&&<p className={progress.doorOpened?'room-flow-message room-sewing-message':'room-flow-message'} role="status">{progress.doorOpened?'外面有缝纫机的声音，循着声音去看一看吧。':flowMessage}</p>}
  </div>
  {exitPhase==='fading'&&<div className="room-exit-fade" aria-hidden="true"/>}
  {imageError&&<p role="alert">房间图片未能加载，请刷新页面重试。</p>}
  {active&&active!=='guide'&&<dialog ref={dialog} data-view={active} className={`room-dialog ${puzzle?'room-puzzle-dialog':active==='lock'?'room-lock-dialog':''}`} aria-labelledby="room-dialog-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}}>
   {puzzle?<button className="puzzle-return" autoFocus onClick={close}>← 返回房间</button>:<div className="room-dialog-top"><span>✦ 星愿谷</span><button className="room-dialog-close" onClick={close} aria-label="关闭探索窗口">×</button></div>}
   <h2 id="room-dialog-title" className={puzzle?'puzzle-screen-title':undefined}>{item?.title}</h2>
   <div className="room-dialog-content">{active==='bookshelf'?<BookshelfPuzzle progress={progress} onSave={save}/>:active==='nightstand'?<DrawerPuzzle progress={progress} onSave={save}/>:active==='diary'?<DiaryPuzzle progress={progress} onSave={save}/>:active==='lock'?<RoomPassword progress={progress} onSave={save} onUnlocked={()=>{close();setFlowMessage('密码正确，宝箱打开了！先去收下里面的小眼镜吧。');}}/>:active==='chest'?<p>宝箱暂时打不开。房门上的密码锁，也许能给它带来一点变化。</p>:<p>{item?.content}</p>}</div>
   {saveError&&<p className="clue-save-error" role="alert">{saveError}</p>}
   {!puzzle&&<button className="room-dialog-action" autoFocus onClick={close}>返回房间</button>}
  </dialog>}
 </div>;
}






