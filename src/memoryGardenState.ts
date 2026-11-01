import {gameProgressKey} from './gameState';
import {isMemoryId,normalizeMemories,type MemoryId} from './memoryCatch';

export const gardenProgressKey=gameProgressKey('starwish-memory-garden-v1');
export type GardenProgress={version:1;awakened:boolean;viewed:MemoryId[];completed:boolean;nextEntered:boolean};
export function readGardenProgress():GardenProgress{
 let value:Partial<GardenProgress>={};try{value=JSON.parse(localStorage.getItem(gardenProgressKey)||'null')||{};}catch{}
 if(value.version!==1)value={};
 const viewed=normalizeMemories(value.viewed),completed=viewed.length===8;
 return {version:1,awakened:value.awakened===true||viewed.length>0,viewed,completed,nextEntered:completed&&value.nextEntered===true};
}
function writeGardenProgress(progress:GardenProgress){localStorage.setItem(gardenProgressKey,JSON.stringify(progress));return progress;}
export function awakenGarden(){const current=readGardenProgress();return current.awakened?current:writeGardenProgress({...current,awakened:true});}
export function viewGardenMemory(id:MemoryId){
 if(!isMemoryId(id))throw new Error('未知回忆卡片');
 const current=readGardenProgress();if(current.viewed.includes(id))return current;
 const viewed=normalizeMemories([...current.viewed,id]);
 return writeGardenProgress({...current,awakened:true,viewed,completed:viewed.length===8});
}
export function enterLuckyCabin(){const current=readGardenProgress();if(!current.completed)throw new Error('请先点亮全部回忆');return current.nextEntered?current:writeGardenProgress({...current,nextEntered:true});}
export function returnToGarden(){return writeGardenProgress({...readGardenProgress(),nextEntered:false});}
