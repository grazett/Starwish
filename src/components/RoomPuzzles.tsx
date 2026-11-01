import {useEffect,useState} from 'react';
import type {RoomProgress} from '../gameState';
import '../roomPuzzles.css';
import DetailBackdrop from './DetailBackdrop';
import {playGameEffect} from '../audio';

export const clueDefinitions=[
 {symbol:'①',digit:2,item:'bookshelf',source:'星星书本'},
 {symbol:'②',digit:0,item:'nightstand',source:'抽屉纸条'},
 {symbol:'③',digit:6,item:'diary',source:'日记里的苹果'},
] as const;
type PuzzleProps={progress:RoomProgress;onSave:(next:RoomProgress)=>boolean};
function ClueResult({index}:{index:number}){const clue=clueDefinitions[index];return <p className="puzzle-result" role="status">已记下线索{clue.symbol}</p>;}

export function BookshelfPuzzle({progress,onSave}:PuzzleProps){
 const find=(index:0|1)=>{playGameEffect('book');if(progress.books[index])return;const books:[boolean,boolean]=[...progress.books];books[index]=true;onSave({...progress,books,clues:[books.every(Boolean),progress.clues[1],progress.clues[2]]});};
 return <div className="bookshelf-puzzle"><DetailBackdrop kind="bookshelf"/><div className="puzzle-picture">
  <img src="/assets/level-one/bookshelf.webp" alt="放大的书架，第一层左侧蓝色书脊和最底层左侧棕色书脊带有星星"/>
  <p className="bookshelf-intro">这里放着房间主人喜欢看的书。</p>
  {[{left:27.1,top:22.5,width:3.7,height:12.5},{left:31.2,top:74.3,width:4.2,height:13.1}].map((rect,index)=><button key={index} className={`star-book ${progress.books[index]?'is-found':''}`} style={{left:`${rect.left}%`,top:`${rect.top}%`,width:`${rect.width}%`,height:`${rect.height}%`}} aria-label={`查看第${index+1}本星星书`} aria-pressed={progress.books[index]} onClick={()=>find(index as 0|1)}/>)}
 </div>{progress.clues[0]?<ClueResult index={0}/>:<p className="puzzle-help">找找书脊上的星星 · 已找到 {progress.books.filter(Boolean).length} / 2</p>}</div>;
}

export function DrawerPuzzle({progress,onSave}:PuzzleProps){
 const [step,setStep]=useState<'closed'|'half'|'opening'|'open'>('closed');
 const [paper,setPaper]=useState(false);
 useEffect(()=>{
  if(step==='half'){const timer=window.setTimeout(()=>setStep('opening'),450);return()=>clearTimeout(timer);}
  if(step==='opening'){const timer=window.setTimeout(()=>{if(onSave({...progress,drawerOpen:true}))setStep('open');else setStep('closed');},550);return()=>clearTimeout(timer);}
 },[step,progress,onSave]);
 return <div className="drawer-puzzle"><DetailBackdrop kind="drawer"/><div className={`puzzle-picture drawer-picture drawer-${step}`}>
  <img className="drawer-base" src="/assets/level-one/drawer-closed.webp" alt={step==='closed'?'床头柜正面特写':''} aria-hidden={step!=='closed'}/>
  {(['half','open'] as const).map(value=><img key={value} className={`drawer-frame ${value==='half'?step==='half'?'is-visible':'':step==='opening'||step==='open'?'is-visible':''}`} src={`/assets/level-one/drawer-${value}.webp`} alt={value==='open'&&step==='open'?'打开的抽屉里放着一张纸条':value==='half'&&step==='half'?'抽屉正在打开':''} aria-hidden={!(value==='open'&&step==='open'||value==='half'&&step==='half')}/>)}
  {step==='closed'&&<button className="drawer-handle" aria-label="拉开抽屉把手" onClick={()=>{playGameEffect('drawer');setStep('half');}}/>}
  {step==='open'&&<button className="drawer-paper-hit" aria-label="查看抽屉里的纸条" disabled={paper} onClick={()=>setPaper(true)}/>}
 </div>
 {!paper&&<p className="puzzle-help" role="status">{step==='closed'?'试着拉开抽屉把手。':step==='open'?'抽屉里有一张纸条，点开看看吧。':'抽屉慢慢打开了……'}</p>}
 {paper&&<div className="drawer-note-overlay"><div className="paper-view"><div className="yellow-paper drawer-letter"><p>这里原本藏着一些秘密，不过现在已经清空啦，有时候，什么都没有也是一种答案。</p></div>{progress.clues[1]?<ClueResult index={1}/>:<button className="puzzle-collect" onClick={()=>onSave({...progress,clues:[progress.clues[0],true,progress.clues[2]]})}>收下纸条</button>}<button className="puzzle-back" autoFocus onClick={()=>setPaper(false)}>再看看抽屉</button></div></div>}
 </div>;
}
export function DiaryPuzzle({progress,onSave}:PuzzleProps){
 return <div className="paper-view"><article className="yellow-paper diary-paper" aria-label="2021年9月1日日记">
  <p className="diary-date">2021年9月1日 星期三</p>
  <p>今天去学校报到了。</p>
  <p>有点紧张，也有点期待。</p>
  <p>不过遇到的人都很好，感觉高中生活也许没有想象中那么痛苦吧。</p>
  <p>我还特意带了<span className="apple-underline">六个苹果</span>过来，准备和舍友们一起分享！</p>
  <p>希望接下来的日子都能顺顺利利的。</p>
  <div className="diary-doodles" aria-hidden="true"><svg viewBox="0 0 110 42"><path d="M24 12C7 1 4 20 12 31Q20 39 26 33Q36 39 42 26C47 10 36 4 24 12Z" fill="none" stroke="#b9665d" strokeWidth="2"/><path d="M25 12Q22 3 30 2M29 5Q40 0 39 7Q33 11 29 5" fill="none" stroke="#75835b" strokeWidth="2"/><path d="m76 7 4 10 12 1-9 7 3 11-10-6-10 6 3-11-9-7 12-1Z" fill="none" stroke="#c29a4f" strokeWidth="2"/></svg></div>
 </article>{progress.clues[2]?<ClueResult index={2}/>:<button className="puzzle-collect" onClick={()=>onSave({...progress,clues:[progress.clues[0],progress.clues[1],true]})}>记下线索</button>}</div>;
}



