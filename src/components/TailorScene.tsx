import {useEffect,useState} from 'react';
import {playerText,readGameState} from '../gameState';
import {acceptTailorRequest,readTailorProgress,requestMemoryCollection,saveTailorProgress,type TailorProgress} from '../tailorProgress';
import {memoryCollectionInstructions,tailorAssets,tailorGreeting,tailorNpcPosition,tailorNpcViewBox} from '../tailorScene';
import {claimTailorReward,finishTailorFarewell,readMemoryCatchProgress,restoreTailorReward} from '../memoryCatchState';
import {readInventory} from '../inventory';
import {unlockAudio} from '../audio';
import {WardrobeMusic} from './WardrobePage';
import SharedBackpack from './SharedBackpack';
import TailorDialogue from './TailorDialogue';
import TailorGiftReveal from './TailorGiftReveal';
import MemoryCatchGame from './MemoryCatchGame';
import MemoryGarden from './MemoryGarden';
import '../tailor.css';

type View='shop'|'dialogue'|'instructions'|'game'|'reward'|'gift'|'farewell'|'gardenPrompt'|'garden';
export default function TailorScene({initialCollection=false}:{initialCollection?:boolean}={}){
 const [game]=useState(readGameState),[progress,setProgress]=useState(readTailorProgress),[memory,setMemory]=useState(readMemoryCatchProgress);
 const [view,setView]=useState<View>(()=>initialCollection?'instructions':memory.rewardClaimed?memory.farewellSeen?'gardenPrompt':'farewell':'shop');
 const [error,setError]=useState(''),[imageError,setImageError]=useState(false);
 useEffect(()=>{try{setMemory(restoreTailorReward());}catch{setError('背包暂时无法保存，请重试。');}},[]);
 const save=(next:TailorProgress)=>{try{saveTailorProgress(next);setProgress(next);setError('');return true;}catch{setError('委托进度暂时无法保存，请重试。');return false;}};
 const accept=()=>{if(save(acceptTailorRequest(progress)))setView('instructions');};
 const collect=()=>{if(save(requestMemoryCollection(acceptTailorRequest(progress))))setView('game');};
 const backFromGame=()=>{const next=readMemoryCatchProgress();setMemory(next);setError('');setView(next.completed?next.rewardClaimed?next.farewellSeen?'gardenPrompt':'farewell':'reward':'shop');};
 const receive=()=>{try{setMemory(claimTailorReward());setError('');setView('farewell');}catch{setError('礼物暂时未能完整保存，请点击「收进背包」重试。');}};
 const finishFarewell=()=>{try{setMemory(finishTailorFarewell());setError('');}catch{setError('祝福进度暂时未能保存，刷新后会再播放一次。');}setView('gardenPrompt');};
 const keyCount=readInventory().items.filter(id=>id==='glasses'||id==='mini-bib'||id==='mystery-headpiece').length;
 if(view==='game')return <main className="memory-game-root" onPointerDown={unlockAudio}><MemoryCatchGame onReturn={backFromGame}/></main>;
 if(view==='garden')return <MemoryGarden onReturnToTailor={()=>setView('shop')}/>;
 return <main className="tailor-root" onPointerDown={unlockAudio}>
  <section className={`tailor-stage ${view==='instructions'?'is-placeholder':''}`} aria-label="第二关：裁缝的委托">
   {view==='instructions'?<section className="memory-placeholder memory-instructions" aria-label="接接乐开始前的玩法说明"><p className="tailor-eyebrow">第二关 · 裁缝的委托</p><h1>回忆接接乐</h1><p className="memory-instructions-copy">{memoryCollectionInstructions}</p><p className="tailor-control-hint">电脑：方向键 / A D　手机：长按左右按钮或拖动篮子</p>{memory.collected.length>0&&<p>已经找回 {memory.collected.length}/8 份回忆，进度已保存。</p>}{error&&<p role="alert">{error}</p>}<button className="tailor-action" onClick={collect}>{memory.completed?'查看收集成果':memory.collected.length?'继续收集':'开始收集'}</button><button className="tailor-text-button" onClick={()=>setView('shop')}>返回裁缝店</button></section>:<>
    <img className="tailor-background" src={tailorAssets.background} alt="温暖的像素裁缝店：左下工作台与缝纫机，左侧布料架，中间窗户和挂架，右侧柜子" draggable={false} onError={()=>setImageError(true)}/>
    {!imageError&&<button className="tailor-npc" aria-label="与裁缝小姐交谈" style={{left:`${tailorNpcPosition.left}%`,top:`${tailorNpcPosition.top}%`,width:`${tailorNpcPosition.width}%`,height:`${tailorNpcPosition.height}%`}} onClick={()=>{setError('');setView(memory.rewardClaimed?'farewell':memory.completed?'reward':'dialogue');}}><svg viewBox={tailorNpcViewBox} role="img" aria-label="站在工作台旁的裁缝小姐"><image href={tailorAssets.npc} width="1245" height="1263"/></svg></button>}
    {view==='gardenPrompt'&&<div className="tailor-garden-prompt"><button className="tailor-action" onClick={()=>setView('garden')}>前往花园</button><p role="status">关键道具 {keyCount}/3</p>{error&&<p role="alert">{error}</p>}</div>}
    {imageError&&<p className="tailor-image-error" role="alert">裁缝店素材未能加载，请刷新重试。</p>}
   </>}
   <SharedBackpack chapterLabel="第二关 · 裁缝的委托" overlay closeKey={view} refreshKey={String(memory.rewardClaimed)}/>
   <WardrobeMusic stage="room"/>
  </section>
  {view==='gift'&&<TailorGiftReveal error={error} onCollect={receive} onClose={()=>setView('shop')}/>}
  {(view==='dialogue'||view==='reward'||view==='farewell')&&<TailorDialogue key={view} text={playerText(view==='reward'?'{nickname}，谢谢你找回这些回忆！这件迷你小围兜送给你，愿它陪你收好接下来的美好。':view==='farewell'?'花园里也许也有你需要的东西，去找找看吧，对了，祝你生日快乐！':tailorGreeting,game.player)} error={error} onClose={()=>setView('shop')} onAction={accept} onFinished={view==='reward'?()=>{setError('');setView('gift');}:view==='farewell'?finishFarewell:undefined}/>}

 </main>;
}
