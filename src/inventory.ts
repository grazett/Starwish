import {gameProgressKey,readRoomProgress} from './gameState';

// All chapters share this save and catalog. Add future rewards here, then call
// collectInventoryItem only after the player actually takes the object.
export const inventoryKey=gameProgressKey('starwish-inventory-v1');
export const inventoryChanged='starwish:inventory-changed';
export const inventoryCatalog={
 glasses:{name:'小眼镜',image:'/assets/level-one/glasses.webp',chapter:'第一关',description:'从神秘房间的宝箱里收下的小眼镜。'},
 'mini-bib':{name:'迷你小围兜',image:'/assets/memory-catch/mini-bib.webp',chapter:'第二关',description:'找回八种回忆后，裁缝小姐送给你的粉色小围兜。'},
 'mystery-headpiece':{name:'小猪头饰',image:'/assets/level-four/pig-hat.webp',chapter:'第四关',description:'在幸运小屋第三次拆盲盒时获得的小猪头饰。'},
} as const;
export type InventoryItemId=keyof typeof inventoryCatalog;
type InventorySave={version:1;items:string[]};
function storedInventory():InventorySave{
 try{const value=JSON.parse(localStorage.getItem(inventoryKey)||'null');
  if(value?.version===1&&Array.isArray(value.items))return {version:1,items:[...new Set<string>(value.items.filter((id:unknown):id is string=>typeof id==='string'&&id.length>0))]};
 }catch{}
 return {version:1,items:[]};
}
export function readInventory():InventorySave{
 const saved=storedInventory(),room=readRoomProgress();
 // Migrate old saves without requiring players to collect their rewards again.
 // Drawer paper belongs to clue records, including in earlier backpack saves.
 saved.items=saved.items.filter(id=>id!=='drawer-note');
 if(room.giftCollected&&!saved.items.includes('glasses'))saved.items.push('glasses');
 return saved;
}
function persist(value:InventorySave){
 localStorage.setItem(inventoryKey,JSON.stringify(value));
 if(typeof window!=='undefined')window.dispatchEvent(new Event(inventoryChanged));
 return value;
}
export function syncInventory(){
 const value=readInventory();
 return JSON.stringify(storedInventory())===JSON.stringify(value)?value:persist(value);
}
export function collectInventoryItem(id:InventoryItemId){
 const value=readInventory();
 if(!value.items.includes(id))value.items.push(id);
 return JSON.stringify(storedInventory())===JSON.stringify(value)?value:persist(value);
}
export function isInventoryItem(id:string):id is InventoryItemId{return Object.hasOwn(inventoryCatalog,id);}
