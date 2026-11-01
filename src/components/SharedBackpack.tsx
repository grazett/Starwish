import {useEffect,useId,useRef,useState} from 'react';
import {inventoryCatalog,inventoryChanged,inventoryKey,isInventoryItem,readInventory,syncInventory,type InventoryItemId} from '../inventory';
import '../backpack.css';

export default function SharedBackpack({chapterLabel,overlay=false,refreshKey='',closeKey='',onOpen,onItemSelect,usedItems=[],interactionDisabled=false,defaultOpen=false,closeAfterSelect=false}:{chapterLabel?:string;overlay?:boolean;refreshKey?:string;closeKey?:string;onOpen?:()=>void;onItemSelect?:(id:InventoryItemId)=>void;usedItems?:readonly InventoryItemId[];interactionDisabled?:boolean;defaultOpen?:boolean;closeAfterSelect?:boolean}){
 const [open,setOpen]=useState(defaultOpen),[items,setItems]=useState(()=>readInventory().items),[error,setError]=useState('');
 const [selected,setSelected]=useState<string|null>(null);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),panelId=useId();
 const previousCloseKey=useRef(closeKey);
 useEffect(()=>{
  const update=()=>setItems(readInventory().items);
  const storage=(event:StorageEvent)=>{if(event.key===inventoryKey||event.key===null)update();};
  window.addEventListener(inventoryChanged,update);window.addEventListener('storage',storage);
  try{setItems(syncInventory().items);setError('');}catch{update();setError('背包暂时无法保存，请保留当前浏览器进度后重试。');}
  return()=>{window.removeEventListener(inventoryChanged,update);window.removeEventListener('storage',storage);};
 },[refreshKey]);
 useEffect(()=>{if(previousCloseKey.current!==closeKey){setOpen(false);setSelected(null);previousCloseKey.current=closeKey;}},[closeKey]);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 const visible=items.filter(isInventoryItem),detail=selected&&isInventoryItem(selected)?inventoryCatalog[selected]:null;
 return <div className={`shared-backpack ${overlay?'backpack-overlay':''}`} ref={root}>
  <button ref={trigger} className="backpack-trigger" aria-label="打开背包" title="背包" aria-expanded={open} aria-controls={panelId} disabled={interactionDisabled} onClick={()=>{if(!open)onOpen?.();setOpen(value=>!value);setSelected(null);}}><img src="/assets/ui/backpack.webp" alt="" draggable={false}/></button>
  {chapterLabel&&<span className="backpack-chapter-label">{chapterLabel}</span>}
  {open&&<aside className="backpack-panel" id={panelId} aria-label="背包物品"><div className="backpack-heading"><h2>背包</h2><button className="backpack-close" aria-label="关闭背包" disabled={interactionDisabled} onClick={()=>{setOpen(false);trigger.current?.focus();}}>×</button></div>
   {visible.length?<ul className="backpack-items">{visible.map(id=><li key={id}><button className="backpack-item" aria-pressed={onItemSelect?usedItems.includes(id):selected===id} aria-label={onItemSelect?`${usedItems.includes(id)?'已放入':'放入'}${inventoryCatalog[id].name}`:undefined} disabled={!!onItemSelect&&(interactionDisabled||usedItems.includes(id))} onClick={()=>{if(onItemSelect){onItemSelect(id);if(closeAfterSelect)setOpen(false);}else setSelected(value=>value===id?null:id);}}><img src={inventoryCatalog[id].image} alt=""/><span>{inventoryCatalog[id].name}<small>{onItemSelect&&usedItems.includes(id)?'已放入槽位':inventoryCatalog[id].chapter}</small></span></button></li>)}</ul>:<p>背包暂时是空的。</p>}
   {detail&&<p className="backpack-detail">{detail.description}</p>}
   <p className="backpack-key-progress">关键道具 {visible.filter(id=>id==='glasses'||id==='mini-bib'||id==='mystery-headpiece').length}/3</p>
   <small className="backpack-footnote">{onItemSelect?'点击宝物放入槽位，点击槽位可以取回。':'每一关收下的小物件，都会留在这里。'}</small>{error&&<p role="alert">{error}</p>}
  </aside>}
 </div>;
}
