import './startFreshRun';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/TitleOpening';
import OpeningSequence from './components/OpeningSequence';
import CorridorOpening from './components/CorridorOpening';
import DressingFlow from './components/DressingFlow';
import {readNextStage,stageStorageKey} from './wardrobe/store';
import './title.css';
import './noticeboard.css';
import './typography.css';
import {useState} from 'react';
import FirstLevel from './components/FirstLevel';
import MysteryRoom from './components/MysteryRoom';
import TailorScene from './components/TailorScene';
import MemoryGarden from './components/MemoryGarden';
import LuckyCottage from './components/LuckyCottage';
import SynthesisRoom from './components/SynthesisRoom';
import BirthdayBeach from './components/BirthdayBeach';
import {readGameState} from './gameState';
function FullPreview({fromStart=false}:{fromStart?:boolean}={}){
 const [started,setStarted]=useState(false);
 const [savedStage]=useState(()=>new URLSearchParams(location.search).get('replayOpening')==='1'||(fromStart&&!stageStorageKey.startsWith('starwish-preview-'))?null:readNextStage());
 if(savedStage)return <DressingFlow resume/>;
 return started?<OpeningSequence autoPlay/>:<App onStart={()=>{const params=new URLSearchParams(location.search);if(params.has('replayOpening')){params.delete('replayOpening');history.replaceState(null,'',`/?${params}`);}setStarted(true);}}/>;
}
const scene=new URLSearchParams(window.location.search).get('scene');
function RoomPreview(){
 const [next,setNext]=useState(false);
 return next?<TailorScene/>:<main className="first-level-root"><section className="first-level-stage is-room" aria-label="第一关：神秘房间"><MysteryRoom onNextScene={()=>setNext(true)}/></section></main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode>{scene==='beach'?<BirthdayBeach/>:scene==='synthesis'?<SynthesisRoom/>:scene==='lucky'?<LuckyCottage/>:scene==='garden'?<MemoryGarden/>:scene==='catch'?<TailorScene initialCollection/>:scene==='tailor'?<TailorScene/>:scene==='room'?<RoomPreview/>:scene==='cabin'?<FirstLevel player={readGameState().player} preview/>:(scene==='game'||scene==='preview')?<FullPreview fromStart/>:scene==='wardrobe'?<DressingFlow/>:scene==='valley'?<DressingFlow resume/>:scene==='title'?<App onStart={()=>location.assign('/?scene=bedroom')}/>:scene==='bedroom'?<OpeningSequence/>:scene==='classroom'?<OpeningSequence initialScene="classroom"/>:scene==='cafeteria'?<OpeningSequence initialScene="cafeteria"/>:scene==='corridor'?<CorridorOpening/>:scene==='journey'?<CorridorOpening journeyOnly/>:<FullPreview />}</React.StrictMode>);




