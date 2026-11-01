// All rectangles are percentages of the complete, uncropped room image.
// Narrower overlapping objects (the desk lamp) come later and sit above the desk.
export type RoomItemId='diary'|'bookshelf'|'nightstand'|'lock'|'chest'|'doll'|'window'|'plant'|'deskLamp'|'bedLamp';
export type RoomHotspot={id:RoomItemId;label:string;title:string;content:string;rect:readonly [number,number,number,number];clip?:string};
export const roomHotspots:RoomHotspot[]=[
 {id:'diary',label:'书桌及日记本',title:'日记探索',content:'桌上摊开着一本日记，纸页里似乎藏着主人的小秘密。\n这里将接入日记翻页与数字线索，现在可以先看看这张书桌。',rect:[2.3,58,21.9,24],clip:'polygon(0 0,100% 0,100% 100%,91% 100%,91% 76%,12% 76%,12% 100%,0 100%)'},
 {id:'bookshelf',label:'左上角书架',title:'书架探索',content:'一排排彩色书脊整齐地靠在一起。\n这里将接入书本选择与线索探索。',rect:[9.6,10,21.6,43.5]},
 {id:'nightstand',label:'床右侧床头柜',title:'床头柜探索',content:'床头柜有两个小抽屉，也许某个抽屉里留着一张纸条。\n这里将接入抽屉交互。',rect:[62.3,46.5,8.2,12.5]},
 {id:'lock',label:'木门及密码锁',title:'密码锁',content:'房门上的锁安静地等待着答案。\n之后需要找到三个数字线索，再尝试打开房门。当前只展示密码锁窗口。',rect:[75,17,12.8,35.5]},
 {id:'chest',label:'最右侧宝箱',title:'神秘宝箱',content:'一个金边木箱，锁扣还牢牢地合着。\n这里将接入宝箱开启动画与道具。',rect:[89.3,47.6,9.6,15.5]},
 {id:'doll',label:'床上的玩偶',title:'玩偶的小声提醒',content:'“我只是一个可爱的玩偶，可不要把我当成密码呀！”\n它乖乖坐在枕头前，像是在陪你一起寻找。',rect:[50.6,43.5,4.3,7.1]},
 {id:'window',label:'窗户',title:'窗边的阳光',content:'阳光穿过窗户，把房间照得暖洋洋的。外面很安静。',rect:[42.8,8.2,14.3,22.5]},
 {id:'plant',label:'书架旁的盆栽',title:'绿意盎然',content:'这盆植物被照顾得很好，叶片正向着阳光舒展。',rect:[32.4,35.6,5.8,18.5]},
 {id:'deskLamp',label:'书桌上的台灯',title:'书桌台灯',content:'暖暖的灯光落在日记本上，正适合读一段悄悄话。',rect:[3.4,50,4.5,14.5]},
 {id:'bedLamp',label:'床头柜上的台灯',title:'床头台灯',content:'台灯散发着柔和的光，像一句轻轻的晚安。',rect:[64,32.5,4.7,13.3]},
];
