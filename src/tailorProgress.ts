import {gameProgressKey} from './gameState';
export const tailorProgressKey=gameProgressKey('starwish-tailor-progress-v1');
export type TailorProgress={version:1;accepted:boolean;collectionRequested:boolean};
export function readTailorProgress():TailorProgress{
 let input:Partial<TailorProgress>={};try{input=JSON.parse(localStorage.getItem(tailorProgressKey)||'null')||{};}catch{}
 const accepted=input.version===1&&input.accepted===true;
 return {version:1,accepted,collectionRequested:accepted&&input.collectionRequested===true};
}
export function saveTailorProgress(progress:TailorProgress){localStorage.setItem(tailorProgressKey,JSON.stringify(progress));return progress;}
export function acceptTailorRequest(progress:TailorProgress):TailorProgress{return progress.accepted?progress:{...progress,accepted:true};}
export function requestMemoryCollection(progress:TailorProgress):TailorProgress{return !progress.accepted||progress.collectionRequested?progress:{...progress,collectionRequested:true};}
