import {normalizeMemories,type MemoryId} from './memoryCatch';
import {collectInventoryItem,readInventory} from './inventory';
import {gameProgressKey} from './gameState';
export const memoryCatchKey=gameProgressKey('starwish-memory-catch-v1');
export type MemoryCatchProgress={version:1;collected:MemoryId[];completed:boolean;rewardClaimed:boolean;farewellSeen:boolean};
export function readMemoryCatchProgress():MemoryCatchProgress{
 let value:Partial<MemoryCatchProgress>={};try{value=JSON.parse(localStorage.getItem(memoryCatchKey)||'null')||{};}catch{}
 const collected=normalizeMemories(value.version===1?value.collected:[]),completed=collected.length===8;
 const rewardClaimed=completed&&(value.rewardClaimed===true||readInventory().items.includes('mini-bib'));
 return {version:1,collected,completed,rewardClaimed,farewellSeen:rewardClaimed&&value.farewellSeen===true};
}
export function saveMemoryCatchProgress(collected:MemoryId[]):MemoryCatchProgress{
 const current=readMemoryCatchProgress(),merged=normalizeMemories([...current.collected,...collected]);
 const next={...current,collected:merged,completed:merged.length===8};
 localStorage.setItem(memoryCatchKey,JSON.stringify(next));return next;
}
export function claimTailorReward():MemoryCatchProgress{
 const current=readMemoryCatchProgress();if(!current.completed)throw new Error('尚未收齐回忆');
 // Inventory first; a failed second write reconciles from the awarded item.
 // Retrying is safe and never duplicates rewards or overwrites glasses.
 collectInventoryItem('mini-bib');
 const next={...current,rewardClaimed:true};localStorage.setItem(memoryCatchKey,JSON.stringify(next));return next;
}
export function restoreTailorReward(){const progress=readMemoryCatchProgress();if(progress.rewardClaimed)collectInventoryItem('mini-bib');return progress;}
export function finishTailorFarewell(){
 const current=readMemoryCatchProgress();if(!current.rewardClaimed)throw new Error('请先收下围兜');
 if(current.farewellSeen)return current;
 const next={...current,farewellSeen:true};localStorage.setItem(memoryCatchKey,JSON.stringify(next));return next;
}
