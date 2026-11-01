import {useEffect,useState} from 'react';
import WardrobePage,{OutfitPortrait,WardrobeMusic} from './WardrobePage';
import {loadWardrobeImages,type WardrobeImages} from '../wardrobe/render';
import {readNextStage,stageStorageKey} from '../wardrobe/store';
import {readGameState,beginAdventure,playerText,type PlayerState} from '../gameState';
import FirstLevel from './FirstLevel';
export default function DressingFlow({resume=false}:{resume?:boolean}={}){
 const [entered,setEntered]=useState(resume&&readNextStage()==='valley');
 const [started,setStarted]=useState(resume&&readNextStage()==='adventure');
 const [previewImages,setPreviewImages]=useState<WardrobeImages|null>(null);
 const [player,setPlayer]=useState(()=>readGameState().player);
 useEffect(()=>{try{localStorage.setItem(stageStorageKey,started?'adventure':entered?'valley':'wardrobe');}catch{}},[entered,started]);
 const finish=(images:WardrobeImages)=>{const state=readGameState();setPlayer(state.player);setPreviewImages(images);window.dispatchEvent(new CustomEvent('starwish:dressup-complete',{detail:{nextScene:'outfit-review',outfit:state.player,player:state.player}}));setEntered(true);};
 const begin=()=>{const state=beginAdventure();setPlayer(state.player);window.dispatchEvent(new CustomEvent('starwish:adventure-start',{detail:{outfit:state.player,player:state.player}}));setStarted(true);};
 if(started)return <FirstLevel player={player}/>;
 return entered?<OutfitReview player={player} previewImages={previewImages} onReturn={()=>setEntered(false)} onStart={begin}/>:<WardrobePage onComplete={finish}/>;
}
function OutfitReview({player,previewImages,onReturn,onStart}:{player:PlayerState;previewImages:WardrobeImages|null;onReturn:()=>void;onStart:()=>void}){
 const outfit=player,[images,setImages]=useState<WardrobeImages|null>(previewImages),[error,setError]=useState('');
 useEffect(()=>{if(previewImages)return;let cancelled=false;loadWardrobeImages().then(value=>{if(!cancelled)setImages(value);}).catch(()=>{if(!cancelled)setError('角色素材未能加载，请刷新重试。');});return()=>{cancelled=true;};},[previewImages]);
 return <main className="wardrobe-root wardrobe-review-root"><section className="wardrobe-stage outfit-review" aria-label="搭配完成"><WardrobeMusic/><h1 className="review-question">{playerText('{nickname}，准备好开启神秘之旅了吗？',player)}</h1><div className="review-portrait">{images&&<OutfitPortrait outfit={outfit} images={images}/>}</div>{error&&<p role="alert">{error}</p>}<div className="wardrobe-actions review-actions"><button onClick={onReturn}>返回搭配</button><button className="wardrobe-finish" disabled={!images} onClick={()=>{try{onStart();}catch{setError('浏览器无法保存旅程进度，请重试。');}}}>开始旅程</button></div></section></main>;
}
