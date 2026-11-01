import {colors,freshOutfit,garments,type Outfit,type Slot,type Appearance} from './catalog';
export const outfitStorageKey='starwish-outfit-v1';
// Full-play links retain their own resume checkpoint without replacing the
// player's existing adventure. Outfit and nickname preferences remain shared.
const previewRun=typeof location==='undefined'?null:new URLSearchParams(location.search).get('previewRun');
export const stageStorageKey=previewRun&&/^[a-zA-Z0-9-]{1,64}$/.test(previewRun)?`starwish-preview-${previewRun}:starwish-next-stage`:'starwish-next-stage';
export const nicknameLimit=10;
export function limitNickname(value:string){return Array.from(value).slice(0,nicknameLimit).join('');}
export function normalizeOutfit(value:unknown):Outfit{
 const result=freshOutfit();if(!value||typeof value!=='object')return result;
 const input=value as Partial<Outfit>;if(input.version!==1)return result;
 if(typeof input.nickname==='string')result.nickname=limitNickname(input.nickname.trim())||'小裴';
 result.mode=input.mode==='dress'?'dress':'separates';
 for(const slot of Object.keys(result.items) as Slot[]){const item=input.items?.[slot] as Partial<Appearance>|undefined;
  if(item&&garments.some(g=>g.slot===slot&&g.id===item.id))result.items[slot]={id:item.id!,color:colors.some(c=>c.id===item.color)?item.color!:'original'};
 }return result;
}
export function readOutfit():Outfit{try{return normalizeOutfit(JSON.parse(localStorage.getItem(outfitStorageKey)||'null'));}catch{return freshOutfit();}}
export function saveOutfit(outfit:Outfit){localStorage.setItem(outfitStorageKey,JSON.stringify(normalizeOutfit(outfit)));}
export function readNextStage(){try{const value=localStorage.getItem(stageStorageKey);return value==='wardrobe'||value==='valley'||value==='adventure'?value:null;}catch{return null;}}
