import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {colors,freshOutfit,garments,garment,type Category,type Outfit,type Slot,type Garment} from '../wardrobe/catalog';
import {loadWardrobeImages,renderOutfit,renderThumbnail,type WardrobeImages} from '../wardrobe/render';
import {readOutfit,saveOutfit,nicknameLimit,limitNickname} from '../wardrobe/store';
import {completeDressing,nicknameError} from '../gameState';
import {sound,unlockAudio} from '../audio';
import {useGameMusic} from '../useGameMusic';
import {useAmbience} from '../useAmbience';
import type {MusicStage} from '../music';
import '../wardrobe.css';

export function OutfitPortrait({outfit,images}:{outfit:Outfit;images:WardrobeImages}){
 const ref=useRef<HTMLCanvasElement>(null);
 useLayoutEffect(()=>{const ctx=ref.current?.getContext('2d');if(ctx)renderOutfit(ctx,images,outfit);},[images,outfit]);
 return <canvas ref={ref} width={738} height={1072} aria-label="当前搭配的像素主角" role="img"/>;
}
function Thumbnail({item,images}:{item:Garment;images:WardrobeImages}){
 const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const ctx=ref.current?.getContext('2d');if(ctx)renderThumbnail(ctx,images,item);},[item,images]);
 return item.src||item.thumbnail?<canvas ref={ref} width={160} height={128} aria-hidden="true"/>:<span className="wardrobe-no-item" aria-hidden="true">✧</span>;
}
export function WardrobeMusic({stage='wardrobe',onMutedChange}:{stage?:MusicStage;onMutedChange?:(muted:boolean)=>void}={}){
 const [muted,setMuted]=useState(()=>{try{return localStorage.getItem('starwish-title-muted')==='true';}catch{return false;}});
 useGameMusic(stage,muted,stage==='beach');
 useAmbience('nature',muted,stage==='cabin',.12);
 return <button className={`music-button ${muted?'muted':''}`} aria-label={muted?'开启音乐':'关闭音乐'} aria-pressed={!muted} onClick={()=>{unlockAudio();const next=!muted;setMuted(next);onMutedChange?.(next);try{localStorage.setItem('starwish-title-muted',String(next));}catch{}}}><svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 3h2v8H6zM8 2h6v3H8zM12 3h2v7h-2zM3 10h5v3H3zM2 11h2v2H2zM9 9h5v3H9zM8 10h2v2H8z"/></svg></button>;
}
const categories:{id:Category;name:string;icon:string}[]=[{id:'hair',name:'发型',icon:'发'},{id:'top',name:'上衣',icon:'衣'},{id:'bottom',name:'下装',icon:'裳'},{id:'head',name:'头饰',icon:'冠'},{id:'dress',name:'连衣裙',icon:'裙'}];
export default function WardrobePage({onComplete}:{onComplete:(images:WardrobeImages)=>void}){
 const [outfit,setOutfit]=useState(readOutfit),[category,setCategory]=useState<Category>(outfit.mode==='dress'?'dress':'top'),[active,setActive]=useState<Slot>(outfit.mode==='dress'?'dress':'top');
 const [images,setImages]=useState<WardrobeImages|null>(null),[error,setError]=useState(''),[saved,setSaved]=useState(false),[leaving,setLeaving]=useState(false);
 const [status,setStatus]=useState('选一套喜欢的衣服，带上好心情出发。');
 const savedOnce=useRef(false),inventoryRef=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{if(inventoryRef.current)inventoryRef.current.scrollTop=0;},[category]);
 useEffect(()=>{let cancelled=false;Promise.all([loadWardrobeImages(),document.fonts.load('24px "Wardrobe Pixel"','换上喜欢的模样')]).then(([loaded])=>{if(!cancelled)setImages(loaded);}).catch(()=>{if(!cancelled)setError('服饰素材未能加载，请刷新重试。');});return()=>{cancelled=true;};},[]);
 useEffect(()=>{if(!savedOnce.current){savedOnce.current=true;return;}const invalid=nicknameError(outfit.nickname??'');if(invalid){setSaved(false);setError(invalid);return;}const timer=setTimeout(()=>{try{saveOutfit(outfit);setSaved(true);setError('');}catch{setError('浏览器暂时无法保存装扮，请允许本地存储后重试。');}},180);return()=>clearTimeout(timer);},[outfit]);
 const click=()=>{unlockAudio();let muted=false;try{muted=localStorage.getItem('starwish-title-muted')==='true';}catch{}sound('click',muted);};
 const changeCategory=(id:Category)=>{click();setCategory(id);setActive(id);if(id==='top'||id==='bottom')setOutfit(o=>({...o,mode:'separates'}));};
 const choose=(item:Garment)=>{click();setActive(item.slot);setSaved(false);setOutfit(o=>({...o,mode:item.slot==='dress'?'dress':item.slot==='top'||item.slot==='bottom'?'separates':o.mode,items:{...o.items,[item.slot]:{id:item.id,color:o.items[item.slot].id===item.id?o.items[item.slot].color:'original'}}}));setStatus(`已换上${item.name==='不戴头饰'?'自然发型':item.name}。`);};
 const invalidNickname=nicknameError(outfit.nickname??'');
 const finish=()=>{if(leaving||!images)return;if(invalidNickname){setError(invalidNickname);return;}try{completeDressing(outfit);setError('');setLeaving(true);click();onComplete(images);}catch{setError('装扮未能保存，请允许本地存储后再完成。');}};
 const item=garment(outfit.items[active].id),canColor=!!item.src&&item.id!=='bare-feet'&&active!=='hair'&&(active!=='dress'||outfit.mode==='dress');
 const wearing=(g:Garment)=>outfit.items[g.slot].id===g.id&&(g.slot!=='dress'||outfit.mode==='dress');
 const card=(g:Garment)=><button key={g.id} className={`garment-card ${wearing(g)?'selected':''}`} aria-pressed={wearing(g)} onClick={()=>choose(g)} disabled={!images||leaving}>{images&&<Thumbnail item={g} images={images}/>}<span>{g.name}</span>{wearing(g)&&<b aria-hidden="true">✓</b>}</button>;
 return <main className="wardrobe-root"><section className="wardrobe-stage" aria-label="星愿谷换装">
  <header className="wardrobe-header"><span className="wardrobe-eyebrow">✦ 星愿谷换装间 ✦</span><h1>换上喜欢的模样</h1><p>到站啦，为今天的旅程挑一套穿搭吧。</p></header><WardrobeMusic/>
  <div className="wardrobe-layout"><section className="wardrobe-preview" aria-label="角色预览"><span className="wardrobe-spark">✧</span><div className="wardrobe-portrait">{images?<OutfitPortrait images={images} outfit={outfit}/>:<p role="status">{error||'正在打开衣橱……'}</p>}</div><div className="wardrobe-pedestal"/><p className="wardrobe-status" role="status">{error||(saved?'装扮已自动记住 ✧':status)}</p><div className="wardrobe-actions"><button className="wardrobe-reset" disabled={leaving} onClick={()=>{click();setOutfit(freshOutfit());setCategory('top');setActive('top');setStatus('已恢复默认搭配。');setSaved(false);}}>重置</button><button className="wardrobe-finish" disabled={!images||leaving||!!invalidNickname} onClick={finish}>完成 →</button></div></section>
  <section className="wardrobe-closet" aria-label="衣橱"><label className="wardrobe-nickname"><span>昵称</span><input aria-label="冒险者昵称" aria-describedby="wardrobe-nickname-hint" value={outfit.nickname??'小裴'} maxLength={nicknameLimit*2} required aria-invalid={!!invalidNickname} placeholder="小裴" disabled={leaving} onChange={e=>{setSaved(false);setOutfit(o=>({...o,nickname:limitNickname(e.target.value)}));}}/><span id="wardrobe-nickname-hint" className="wardrobe-nickname-hint">最多输入十个字符</span></label><nav className="wardrobe-tabs" aria-label="服饰分类">{categories.map(c=><button key={c.id} aria-pressed={category===c.id} className={category===c.id?'active':''} onClick={()=>changeCategory(c.id)} disabled={leaving}>{c.name}</button>)}</nav>
   <div className="wardrobe-inventory" ref={inventoryRef}><div className="inventory-heading"><h2>{categories.find(c=>c.id===category)?.name}</h2><span>点击即可试穿</span></div><div className="garment-grid" style={{gridTemplateColumns:`repeat(${Math.min(3,garments.filter(g=>g.slot===category).length)},minmax(0,1fr))`}}>{garments.filter(g=>g.slot===category).map(card)}</div>{category==='bottom'&&<><div className="inventory-heading shoes-heading"><h2>鞋子</h2><span>换一双舒适的鞋</span></div><div className="garment-grid shoe-grid">{garments.filter(g=>g.slot==='shoes').map(card)}</div></>}{category==='dress'&&<p className="dress-note">穿上连衣裙后暂时收起上衣、下装。<br/>切回「上衣」或「下装」，恢复之前的搭配。</p>}</div>
   <div className="wardrobe-colors"><div><span>{active==='hair'?'发型保留原色':'给服饰换个颜色'}</span><strong>{item.name}</strong></div><div className="color-swatches" aria-label={`为${item.name}选择颜色`}>{colors.map(c=><button key={c.id} aria-label={`${item.name} · ${c.name}`} aria-pressed={outfit.items[active].color===c.id} className={outfit.items[active].color===c.id?'selected':''} style={{background:c.hex}} disabled={!canColor||!images||leaving} onClick={()=>{click();setSaved(false);setOutfit(o=>({...o,items:{...o.items,[active]:{...o.items[active],color:c.id}}}));setStatus(`${item.name}已改为${c.name}。`);}}><span>{outfit.items[active].color===c.id?'✓':''}</span></button>)}</div></div>
  </section></div>
 </section></main>;
}





