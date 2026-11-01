export const characterCanvas={width:738,height:1072,origin:[0,0],feet:[369,922]} as const;
export type Slot='top'|'bottom'|'head'|'dress'|'shoes'|'hair';
export type Category=Exclude<Slot,'shoes'>;
export type Direction='front'|'left'|'right'|'back';
export type Motion='idle'|'walk';
export const colors=[{id:'original',name:'原色',hex:'#d5b58b'},{id:'cream',name:'奶油',hex:'#e7cfa2'},{id:'rose',name:'莓粉',hex:'#d38d9d'},{id:'sage',name:'鼠尾草',hex:'#93ac87'},{id:'blue',name:'湖蓝',hex:'#86a9bb'}] as const;
export type ColorId=typeof colors[number]['id'];
export type Appearance={id:string;color:ColorId};
export type Outfit={version:1;nickname?:string;mode:'separates'|'dress';items:Record<Slot,Appearance>};
export type Garment={id:string;name:string;slot:Slot;src:string|null;thumbnail?:string;repairSrc?:string;bodyHem?:number;bounds:readonly [number,number,number,number];baseFeet?:boolean;preserveSkin?:boolean;hairFront?:readonly (readonly [number,number,number,number])[];poses?:Partial<Record<`${Direction}:${Motion}`,readonly string[]>>};
const asset=(name:string)=>`/assets/wardrobe/${name}.webp`;
export const baseAsset=asset('portraits-v5/default-long');
export const basePoses:Partial<Record<`${Direction}:${Motion}`,readonly string[]>>={'front:idle':[baseAsset]};
export const garments:readonly Garment[]=[
 {id:'hair-default-long',name:'默认长发',slot:'hair',src:baseAsset,bounds:[180,140,380,480],hairFront:[[190,414,153,180],[398,414,151,180]]},
 {id:'hair-single-braid',name:'单麻花辫',slot:'hair',src:asset('portraits-v5/single-braid'),bounds:[220,140,300,550],hairFront:[[258,414,85,265]]},
 {id:'hair-double-braids',name:'双麻花辫',slot:'hair',src:asset('portraits-v5/double-braids'),bounds:[175,140,390,510],hairFront:[[180,414,163,240],[398,414,165,240]]},
 {id:'hair-long-curls',name:'长卷发',slot:'hair',src:asset('portraits-v5/long-curls'),bounds:[145,140,455,520],hairFront:[[150,414,193,245],[398,414,195,245]]},
 {id:'hair-shoulder-bob',name:'齐肩短发',slot:'hair',src:asset('portraits-v5/shoulder-bob'),bounds:[225,140,285,290],hairFront:[]},
 {id:'hair-wavy-long',name:'波浪长发',slot:'hair',src:asset('portraits-v5/wavy-long'),bounds:[185,140,380,500],hairFront:[[190,414,153,220],[398,414,160,220]]},
 {id:'hair-side-ponytail',name:'侧马尾',slot:'hair',src:asset('portraits-v5/side-ponytail'),bounds:[170,110,350,450],hairFront:[]},
 {id:'base-top',name:'基础背心',slot:'top',src:null,thumbnail:baseAsset,bounds:[281,410,183,182]},
 {id:'cream-sweater',name:'卫衣',slot:'top',src:asset('top-cream'),repairSrc:asset('complete/top-cream'),thumbnail:'/assets/wardrobe/thumbnails/sweater.webp',bounds:[209,410,324,277]},
 {id:'striped-tee',name:'条纹 T 恤',slot:'top',src:asset('top-striped'),repairSrc:asset('complete/top-striped'),thumbnail:'/assets/wardrobe/thumbnails/tee.webp',bounds:[237,413,264,204]},
 {id:'cat-hoodie',name:'猫咪卫衣',slot:'top',src:asset('new/top-cat-hoodie'),repairSrc:asset('complete/top-cat-hoodie'),thumbnail:'/assets/wardrobe/thumbnails/cat-hoodie.webp',bounds:[209,394,326,278],preserveSkin:true,bodyHem:660},
 {id:'sailor-top',name:'水手服上衣',slot:'top',src:asset('new/top-sailor'),repairSrc:asset('complete/top-sailor'),thumbnail:'/assets/wardrobe/thumbnails/sailor-top.webp',bounds:[222,400,297,242],preserveSkin:true,bodyHem:603},
 {id:'blue-jeans',name:'牛仔裤',slot:'bottom',src:asset('bottom-jeans'),bounds:[219,494,298,406]},
 {id:'base-bottom',name:'基础短裤',slot:'bottom',src:null,thumbnail:baseAsset,bounds:[281,586,178,100]},
 {id:'cream-skirt',name:'短裙',slot:'bottom',src:asset('bottom-skirt'),bounds:[239,584,260,170]},
 {id:'star-jeans',name:'星星牛仔裤',slot:'bottom',src:asset('new/bottom-star-jeans'),bounds:[267,579,206,281],preserveSkin:true},
 {id:'pleated-skirt',name:'百褶裙',slot:'bottom',src:asset('new/bottom-pleated-skirt'),thumbnail:'/assets/wardrobe/thumbnails/pleated-skirt.webp',bounds:[210,550,325,268],preserveSkin:true},
 {id:'no-headwear',name:'不戴头饰',slot:'head',src:null,bounds:[0,0,1,1]},
 {id:'pink-bow',name:'蝴蝶结',slot:'head',src:asset('head-bow'),bounds:[231,182,106,98]},
 {id:'beret',name:'贝雷帽',slot:'head',src:asset('head-beret'),bounds:[222,127,299,157]},
 {id:'bubble-fish-clip',name:'泡泡鱼发夹',slot:'head',src:asset('new/head-bubble-fish'),bounds:[403,202,92,71]},
 {id:'fish-clip',name:'游鱼发夹',slot:'head',src:asset('new/head-fish'),bounds:[405,206,88,69]},
 {id:'round-glasses',name:'圆框眼镜',slot:'head',src:asset('new/head-glasses'),bounds:[283,281,174,78]},
 {id:'pink-dress',name:'连衣裙',slot:'dress',src:asset('dress-pink'),repairSrc:asset('complete/dress-pink'),thumbnail:'/assets/wardrobe/thumbnails/dress.webp',bounds:[247,413,249,372]},
 {id:'plaid-dress',name:'格纹蛋糕裙',slot:'dress',src:asset('new/dress-plaid'),repairSrc:asset('complete/dress-plaid'),thumbnail:'/assets/wardrobe/thumbnails/plaid-dress.webp',bounds:[225,408,297,339],preserveSkin:true},
 {id:'apple-dress',name:'苹果印花裙',slot:'dress',src:asset('new/dress-apple'),repairSrc:asset('complete/dress-apple-v2'),thumbnail:'/assets/wardrobe/thumbnails/apple-dress.webp',bounds:[202,418,337,378],preserveSkin:true},
 {id:'default-shoes',name:'日常布鞋',slot:'shoes',src:asset('base'),baseFeet:true,bounds:[262,841,215,81]},
 {id:'bare-feet',name:'赤足',slot:'shoes',src:asset('feet/bare-pixel-v1'),baseFeet:true,bounds:[277,841,194,90]},
 {id:'white-sneakers',name:'运动鞋',slot:'shoes',src:asset('shoes-sneakers'),bounds:[254,841,225,111]},
 {id:'red-shoes',name:'小皮鞋',slot:'shoes',src:asset('shoes-red'),bounds:[262,841,213,101]},
 {id:'brown-boots',name:'短靴',slot:'shoes',src:asset('shoes-boots'),bounds:[262,826,215,104]},
 {id:'loafers',name:'乐福鞋',slot:'shoes',src:asset('new/shoes-loafers'),bounds:[258,826,232,99],preserveSkin:true},
];
export const defaultOutfit:Outfit={version:1,nickname:'小裴',mode:'separates',items:{hair:{id:'hair-default-long',color:'original'},top:{id:'base-top',color:'original'},bottom:{id:'base-bottom',color:'original'},head:{id:'no-headwear',color:'original'},dress:{id:'pink-dress',color:'original'},shoes:{id:'bare-feet',color:'original'}}};
export function freshOutfit():Outfit{return structuredClone(defaultOutfit);}
export function garment(id:string){const item=garments.find(g=>g.id===id);if(!item)throw new Error(`未知服饰：${id}`);return item;}
// 只有素材实际存在时才返回动作帧；不会用正面图片平移、翻转或拉伸冒充行走。
export function resolveOutfitPose(outfit:Outfit,direction:Direction,motion:Motion){
 const slots:Slot[]=outfit.mode==='dress'?['dress','shoes','head']:['bottom','top','shoes','head'];
 const layers=slots.map(slot=>{const item=garment(outfit.items[slot].id);return {slot,item,frames:!item.src?[]:item.poses?.[`${direction}:${motion}`]??(direction==='front'&&motion==='idle'?[item.src]:null)};});
 const hair=garment(outfit.items.hair.id);
 const base=direction==='front'&&motion==='idle'?[hair.src!]:hair.poses?.[`${direction}:${motion}`]??null;
 return {supported:base!==null&&layers.every(l=>l.frames!==null),base,layers,missing:[...(base?[]:['base']),...layers.filter(l=>l.frames===null).map(l=>l.item.id)]};
}







