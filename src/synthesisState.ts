import {gameProgressKey} from './gameState';
import {readInventory} from './inventory';
import {synthesisDuration,synthesisItemIds,type SynthesisItemId} from './synthesis';

export const synthesisProgressKey=gameProgressKey('starwish-synthesis-v1');
export type SynthesisProgress={version:1;introSeen:boolean;placed:SynthesisItemId[];startedAt:number|null;completed:boolean;giftOpened:boolean};
export function ownedSynthesisItems(){const owned=readInventory().items;return synthesisItemIds.filter(id=>owned.includes(id));}
export function readSynthesisProgress():SynthesisProgress{
 const raw=localStorage.getItem(synthesisProgressKey);
 let value:Partial<SynthesisProgress>={};
 if(raw){value=JSON.parse(raw);if(!value||value.version!==1)throw new Error('合成存档暂时无法读取。');}
 const owned=ownedSynthesisItems();
 const placed=synthesisItemIds.filter(id=>owned.includes(id)&&Array.isArray(value.placed)&&value.placed.includes(id));
 const full=placed.length===3,introSeen=value.introSeen===true;
 const completed=full&&introSeen&&value.completed===true;
 const startedAt=full&&introSeen&&typeof value.startedAt==='number'&&Number.isFinite(value.startedAt)&&value.startedAt>=0?value.startedAt:null;
 return {version:1,introSeen,placed,startedAt,completed,giftOpened:completed&&value.giftOpened===true};
}
function write(progress:SynthesisProgress){localStorage.setItem(synthesisProgressKey,JSON.stringify(progress));return progress;}
export function startSynthesisGuide(){const current=readSynthesisProgress();return current.introSeen?current:write({...current,introSeen:true});}
export function placeSynthesisItem(id:SynthesisItemId){
 const current=readSynthesisProgress();
 if(!synthesisItemIds.includes(id)||!ownedSynthesisItems().includes(id))throw new Error('这件宝物还没有放进背包。');
 if(!current.introSeen)throw new Error('请先点击开始合成。');
 if(current.completed||current.startedAt!==null)throw new Error('合成期间不能更改槽位。');
 if(current.placed.includes(id))return current;
 return write({...current,placed:synthesisItemIds.filter(key=>key===id||current.placed.includes(key))});
}
export function removeSynthesisItem(id:SynthesisItemId){
 const current=readSynthesisProgress();
 if(current.completed||current.startedAt!==null)throw new Error('合成期间不能更改槽位。');
 if(!current.placed.includes(id))return current;
 return write({...current,placed:current.placed.filter(key=>key!==id)});
}
export function beginSynthesis(now=Date.now()){
 const current=readSynthesisProgress();
 if(current.completed||current.startedAt!==null)return current;
 if(!current.introSeen||current.placed.length!==3||ownedSynthesisItems().length!==3)throw new Error('请先把三件宝物放入槽位。');
 if(!Number.isFinite(now)||now<0)throw new Error('合成计时暂时不可用。');
 return write({...current,startedAt:now});
}
export function completeSynthesis(now=Date.now()){
 const current=readSynthesisProgress();if(current.completed)return current;
 if(current.startedAt===null||now-current.startedAt<synthesisDuration||current.placed.length!==3)throw new Error('合成还没有完成。');
 return write({...current,completed:true});
}
export function openSynthesisGift(){
 const current=readSynthesisProgress();if(!current.completed)throw new Error('礼物还在合成中。');
 return current.giftOpened?current:write({...current,giftOpened:true});
}
