import type {Outfit} from './wardrobe/catalog';
import {nicknameLimit,readNextStage,readOutfit,saveOutfit,stageStorageKey} from './wardrobe/store';

export type GameStage='wardrobe'|'valley'|'adventure';
// A shareable fresh playthrough can be reviewed without clearing the player's
// real progress. Outfit, nickname and audio preferences still use their saves.
export function gameProgressKey(key:string){
 const run=typeof location==='undefined'?null:new URLSearchParams(location.search).get('previewRun');
 return run&&/^[a-zA-Z0-9-]{1,64}$/.test(run)?`starwish-preview-${run}:${key}`:key;
}
export type PlayerState=Outfit&{nickname:string};
export type RoomProgress={version:1;books:[boolean,boolean];drawerOpen:boolean;clues:[boolean,boolean,boolean];chestOpened:boolean;giftCollected:boolean;doorOpened:boolean;exitedRoom:boolean};
// Separate real play from the previously collected development preview save.
// Keep the old key untouched so the earlier snapshot remains recoverable.
export const roomProgressKey=gameProgressKey('starwish-first-level-progress-v2');
export function readRoomProgress():RoomProgress{
 let input:Partial<RoomProgress>={};try{input=JSON.parse(localStorage.getItem(roomProgressKey)||'null')||{};}catch{}
 if(input.version!==1)input={};
 const books:[boolean,boolean]=[input.books?.[0]===true,input.books?.[1]===true];
 const clues:RoomProgress['clues']=[books.every(Boolean),input.clues?.[1]===true,input.clues?.[2]===true];
 const chestOpened=clues.every(Boolean)&&input.chestOpened===true;
 const giftCollected=chestOpened&&input.giftCollected===true;
 const doorOpened=giftCollected&&input.doorOpened===true;
 return {version:1,books,drawerOpen:input.drawerOpen===true,clues,chestOpened,giftCollected,doorOpened,exitedRoom:doorOpened&&input.exitedRoom===true};
}
export function saveRoomProgress(progress:RoomProgress):RoomProgress{
 localStorage.setItem(roomProgressKey,JSON.stringify(progress));return progress;
}
// These ordered transitions are shared by the scene and password interface.
// Password input itself is never stored or prefilled.
export function unlockRoomChest(progress:RoomProgress,code:string):RoomProgress|null{
 if(!progress.clues.every(Boolean)||code!=='206')return null;
 return progress.chestOpened?progress:{...progress,chestOpened:true};
}
export function takeRoomGift(progress:RoomProgress):RoomProgress{
 return progress.chestOpened&&!progress.giftCollected?{...progress,giftCollected:true}:progress;
}
export function openRoomDoor(progress:RoomProgress):RoomProgress{
 return progress.chestOpened&&progress.giftCollected&&!progress.doorOpened?{...progress,doorOpened:true}:progress;
}
export function leaveRoom(progress:RoomProgress):RoomProgress{
 return progress.doorOpened&&!progress.exitedRoom?{...progress,exitedRoom:true}:progress;
}
export type GameState={player:PlayerState;stage:GameStage|null;room:RoomProgress};

// Keep the existing save keys as the single source of truth. Old outfits and
// existing players migrate through readOutfit rather than a duplicate name save.
export function readGameState():GameState{
 const outfit=readOutfit();
 return {player:{...outfit,nickname:outfit.nickname||'小裴'},stage:readNextStage(),room:readRoomProgress()};
}
export function nicknameError(value:string){
 if(!value.trim())return '请输入昵称，不能只填写空格。';
 if(Array.from(value.trim()).length>nicknameLimit)return '昵称最多输入十个字符。';
 return '';
}
export function savePlayer(outfit:Outfit):PlayerState{
 const nickname=outfit.nickname?.trim()??'',error=nicknameError(nickname);
 if(error)throw new Error(error);
 const player={...outfit,nickname};saveOutfit(player);return player;
}
export function completeDressing(outfit:Outfit):GameState{
 const player=savePlayer(outfit);localStorage.setItem(stageStorageKey,'valley');
 return {player,stage:'valley',room:readRoomProgress()};
}
export function beginAdventure():GameState{
 const state=readGameState();
 localStorage.removeItem(gameProgressKey('starwish-first-level-room'));
 localStorage.removeItem(roomProgressKey);
 localStorage.setItem(stageStorageKey,'adventure');return {...state,room:readRoomProgress(),stage:'adventure'};
}
// Dialogues, hints and greetings share this formatter and the same player save.
export function playerText(template:string,player:PlayerState=readGameState().player){
 return template.replaceAll('{nickname}',player.nickname);
}
