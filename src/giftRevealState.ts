import {gameProgressKey} from './gameState';
import {openSynthesisGift,readSynthesisProgress} from './synthesisState';

export const giftRevealKey=gameProgressKey('starwish-gift-reveal-v1');
export const giftOpeningDuration=5000,revealDuration=3200,storyDuration=8800;
export type RevealPhase='sealed'|'opening'|'silhouette'|'revealed'|'card'|'blessing';
export type GiftRevealProgress={version:1;phase:RevealPhase;startedAt:number;dollRevealed:boolean;cardVisited:boolean};
const phases:RevealPhase[]=['sealed','opening','silhouette','revealed','card','blessing'];
export function readGiftReveal():GiftRevealProgress{
 const synthesis=readSynthesisProgress(),raw=localStorage.getItem(giftRevealKey);
 if(!raw)return {version:1,phase:synthesis.giftOpened?'silhouette':'sealed',startedAt:0,dollRevealed:false,cardVisited:false};
 const value=JSON.parse(raw);
 if(!value||value.version!==1||!phases.includes(value.phase)||!Number.isFinite(value.startedAt)||value.startedAt<0)throw Error('揭晓进度暂时无法读取。');
 if(!synthesis.completed)return {version:1,phase:'sealed',startedAt:0,dollRevealed:false,cardVisited:false};
 const dollRevealed=['revealed','card','blessing'].includes(value.phase),cardVisited=['card','blessing'].includes(value.phase)||value.cardVisited===true;
 return {version:1,phase:value.phase,startedAt:value.startedAt,dollRevealed,cardVisited:dollRevealed&&cardVisited};
}
function write(value:GiftRevealProgress){localStorage.setItem(giftRevealKey,JSON.stringify(value));return value;}
function ready(){if(!readSynthesisProgress().completed)throw Error('请先完成神秘合成。');}
export function beginGiftOpening(now=Date.now()){
 ready();const current=readGiftReveal();if(current.phase!=='sealed')return current;
 return write({...current,phase:'opening',startedAt:now});
}
export function restoreGiftReveal(now=Date.now()){
 const current=readGiftReveal();
 // Earlier versions already opened the gift. Start at the silhouette, preserving the old save.
 return current.phase==='silhouette'&&current.startedAt===0?write({...current,startedAt:now}):current;
}
export function finishGiftOpening(now=Date.now()){
 ready();const current=readGiftReveal();if(current.phase!=='opening')return current;
 if(now-current.startedAt<giftOpeningDuration)throw Error('礼盒还在开启。');
 openSynthesisGift();
 return write({...current,phase:'silhouette',startedAt:now});
}
export function revealDoll(now=Date.now()){
 ready();const current=readGiftReveal();if(current.phase!=='silhouette')return current;
 if(now-current.startedAt<storyDuration)throw Error('请先看完剪影提示。');
 return write({...current,phase:'revealed',startedAt:now,dollRevealed:true});
}
export function visitGiftCard(now=Date.now()){
 ready();const current=readGiftReveal();if(current.phase!=='revealed')return current;
 if(now-current.startedAt<revealDuration)throw Error('玩偶正在亮相。');
 return write({...current,phase:'card',startedAt:now,cardVisited:true});
}
export function continueGiftJourney(){ready();const current=readGiftReveal();if(current.phase!=='card')return current;return write({...current,phase:'blessing'});}
export function revisitGiftCard(){ready();const current=readGiftReveal();if(!current.dollRevealed)return current;return write({...current,phase:'card',cardVisited:true});}
