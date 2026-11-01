import {gameProgressKey} from './gameState';
import {collectInventoryItem,readInventory} from './inventory';
import {isLuckyReward,luckyRewardIds,type LuckyRewardId} from './luckyCottage';

export const luckyProgressKey=gameProgressKey('starwish-lucky-cottage-v1');
export type LuckyProgress={version:1;rewardOrder:LuckyRewardId[];openingOrder:number[];claimed:number[];introSeen:boolean;headpieceClaimed:boolean;completed:boolean;finalEntered:boolean;openedCount:number;boxes:{opened:boolean;reward:LuckyRewardId|null;claimed:boolean}[]};
const indices=(value:unknown)=>Array.isArray(value)?[...new Set(value.filter((n:unknown):n is number=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<9))]:[];
function normalized(value:Partial<LuckyProgress>):LuckyProgress{
 const rewardOrder=value.rewardOrder;
 if(value.version!==1||!Array.isArray(rewardOrder)||rewardOrder.length!==9||new Set(rewardOrder).size!==9||!rewardOrder.every(isLuckyReward)||rewardOrder[2]!=='headpiece')throw new Error('幸运小屋存档暂时无法读取，请保留存档后重试。');
 const openingOrder=indices(value.openingOrder),claimed=indices(value.claimed).filter(index=>openingOrder.includes(index));
 const headIndex=openingOrder[2];
 const headpieceClaimed=headIndex!==undefined&&(claimed.includes(headIndex)||readInventory().items.includes('mystery-headpiece'));
 if(headpieceClaimed&&!claimed.includes(headIndex))claimed.push(headIndex);
 const boxes=Array.from({length:9},(_,index)=>{const order=openingOrder.indexOf(index);return {opened:order>=0,reward:order>=0?rewardOrder[order]:null,claimed:claimed.includes(index)};});
 return {version:1,rewardOrder:[...rewardOrder],openingOrder,claimed,introSeen:value.introSeen===true,headpieceClaimed,completed:headpieceClaimed,finalEntered:headpieceClaimed&&value.finalEntered===true,openedCount:openingOrder.length,boxes};
}
function write(value:LuckyProgress){const next=normalized(value);localStorage.setItem(luckyProgressKey,JSON.stringify(next));return next;}
export function readLuckyProgress():LuckyProgress|null{
 const raw=localStorage.getItem(luckyProgressKey);if(!raw)return null;
 return normalized(JSON.parse(raw));
}
export function initializeLuckyProgress(random:()=>number=Math.random){
 const saved=readLuckyProgress();
 if(saved){if(saved.headpieceClaimed)collectInventoryItem('mystery-headpiece');return saved;}
 const order=luckyRewardIds.filter(id=>id!=='headpiece') as LuckyRewardId[];
 for(let index=order.length-1;index>0;index--){const target=Math.floor(random()*(index+1));[order[index],order[target]]=[order[target],order[index]];}
 // Freeze the sequence on first entry. Assign on opening so any third chosen
 // slot wins the headpiece; bindings already revealed never move or reroll.
 order.splice(2,0,'headpiece');
 return write(normalized({version:1,rewardOrder:order,openingOrder:[],claimed:[],introSeen:false,finalEntered:false}));
}
function required(){const saved=readLuckyProgress();if(!saved)throw new Error('请先进入幸运小屋。');return saved;}
export function startLuckyBoxes(){return write({...required(),introSeen:true});}
export function openLuckyBox(index:number){
 const current=required();if(!Number.isInteger(index)||index<0||index>=9)throw new Error('未知礼物盒');
 if(!current.introSeen)throw new Error('请先听完店主的问候。');
 if(current.boxes[index].opened)return current;
 return write({...current,openingOrder:[...current.openingOrder,index]});
}
export function claimLuckyBox(index:number){
 const current=required(),box=current.boxes[index];if(!box?.opened)throw new Error('请先打开这个盒子。');
 if(box.reward==='headpiece')collectInventoryItem('mystery-headpiece');
 if(box.claimed)return current;
 return write({...current,claimed:[...current.claimed,index]});
}
export function enterSynthesis(){const current=required();if(!current.headpieceClaimed)throw new Error('请先收下神秘头饰。');return write({...current,finalEntered:true});}
export function returnToLuckyBoxes(){return write({...required(),finalEntered:false});}
