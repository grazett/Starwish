import {gameProgressKey} from './gameState';
import {readGiftReveal} from './giftRevealState';

export const beachProgressKey=gameProgressKey('starwish-birthday-beach-v1');
export const beachTiming={entrance:6200,flameOut:1100,fireworks:2800,fireworksEnd:9800,blessing:10400} as const;
export const beachAssets={background:'/assets/birthday-beach/beach-wide.webp',originalBackground:'/assets/birthday-beach/beach.webp',cake:'/assets/memory-catch/cake.webp',letter:'/assets/birthday-beach/letter-paper-cutout.webp',originalLetter:'/assets/birthday-beach/letter-paper.webp'};
export type BeachProgress={version:1;entered:boolean;entranceAt:number|null;candleAt:number|null;candleExtinguished:boolean;fireworksPlayed:boolean;blessingShown:boolean;letterOpened:boolean;view:'beach'|'letter'};
export function canVisitBirthdayBeach(){const gift=readGiftReveal();return gift.dollRevealed&&gift.cardVisited;}
const fresh=():BeachProgress=>({version:1,entered:false,entranceAt:null,candleAt:null,candleExtinguished:false,fireworksPlayed:false,blessingShown:false,letterOpened:false,view:'beach'});
const validTime=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
export function readBeachProgress():BeachProgress{
 const raw=localStorage.getItem(beachProgressKey);if(!raw)return fresh();
 const value=JSON.parse(raw);if(!value||value.version!==1)throw Error('海滩进度暂时无法读取。');
 const entered=value.entered===true&&validTime(value.entranceAt),entranceAt=entered?value.entranceAt:null,candleAt=entered&&validTime(value.candleAt)?value.candleAt:null;
 const candleExtinguished=candleAt!==null&&value.candleExtinguished===true,fireworksPlayed=candleExtinguished&&value.fireworksPlayed===true,blessingShown=fireworksPlayed&&value.blessingShown===true,letterOpened=blessingShown&&value.letterOpened===true;
 return {version:1,entered,entranceAt,candleAt,candleExtinguished,fireworksPlayed,blessingShown,letterOpened,view:letterOpened&&value.view==='letter'?'letter':'beach'};
}
function write(value:BeachProgress){localStorage.setItem(beachProgressKey,JSON.stringify(value));return value;}
function ready(){if(!canVisitBirthdayBeach())throw Error('请先查看专属玩偶收藏卡。');}
export function enterBirthdayBeach(now=Date.now()){
 ready();const current=readBeachProgress();if(current.entered)return current;if(!validTime(now))throw Error('时间不可用。');return write({...current,entered:true,entranceAt:now});
}
export function lightBirthdayWish(now=Date.now()){
 ready();const current=readBeachProgress();if(current.candleAt!==null)return current;
 if(!validTime(now)||!current.entered||current.entranceAt===null||now-current.entranceAt<beachTiming.entrance)throw Error('请先看完海滩入场提示。');
 return write({...current,candleAt:now});
}
export function advanceBirthdayWish(now=Date.now()){
 ready();const current=readBeachProgress();if(current.candleAt===null)return current;
 const elapsed=now-current.candleAt;
 const candleExtinguished=current.candleExtinguished||elapsed>=beachTiming.flameOut,fireworksPlayed=current.fireworksPlayed||elapsed>=beachTiming.fireworksEnd,blessingShown=current.blessingShown||elapsed>=beachTiming.blessing;
 if(candleExtinguished===current.candleExtinguished&&fireworksPlayed===current.fireworksPlayed&&blessingShown===current.blessingShown)return current;
 return write({...current,candleExtinguished,fireworksPlayed,blessingShown});
}
export function openBirthdayLetter(){ready();const current=readBeachProgress();if(!current.blessingShown)throw Error('请先等待烟花和生日祝福。');return current.view==='letter'?current:write({...current,letterOpened:true,view:'letter'});}
export function returnToBirthdayBeach(){ready();const current=readBeachProgress();return current.view==='beach'?current:write({...current,view:'beach'});}
