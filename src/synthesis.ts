import {inventoryCatalog} from './inventory';

export const synthesisAssets={background:'/assets/synthesis/cottage.webp',wideBackground:'/assets/synthesis/cottage-wide.webp',gift:'/assets/level-four/gift-closed.webp',openedGift:'/assets/level-four/gift-open.webp',doll:'/assets/synthesis/final-doll.webp'};
export const synthesisDuration=10000;
// These IDs point to the original backpack rewards; the second is the mini bib.
// Positions belong to the untouched 1536 × 1024 background, not the outer frame.
export const synthesisSlots=[
 {id:'glasses',x:38,y:56,width:9.4,height:9.8,source:'第一关 · 神秘房间',scene:'room'},
 {id:'mini-bib',x:49.5,y:56,width:9.4,height:9.8,source:'第二关 · 裁缝的委托',scene:'tailor'},
 {id:'mystery-headpiece',x:61,y:56,width:9.4,height:9.8,source:'第四关 · 幸运盲盒',scene:'lucky'},
] as const;
export type SynthesisItemId=typeof synthesisSlots[number]['id'];
export const synthesisItemIds=synthesisSlots.map(slot=>slot.id);
export const synthesisItem=(id:SynthesisItemId)=>inventoryCatalog[id];
export function synthesisSourceUrl(scene:string){const params=new URLSearchParams(location.search);params.set('scene',scene);return `/?${params.toString()}`;}
