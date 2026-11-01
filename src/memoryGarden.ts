import {memoryTargets,type MemoryId} from './memoryCatch';

export const gardenWideBackground='/assets/level-three/memory-garden-wide.webp';
export const gardenBackground='/assets/level-three/memory-garden.webp';
export const pondBackground='/assets/level-three/pond-closeup.webp';
// Percent coordinates match the expanded 16:9 garden; the original asset is retained.
export const gardenPond={left:38,top:40,width:22,height:19};
export const gardenPlayer={left:50,top:66,width:8.4375,height:20};
// Bubble centers belong to the 16:9 pond closeup, entirely inside its water.
export const gardenSlots=[{x:43,y:37},{x:55,y:37},{x:35.5,y:53},{x:48,y:53},{x:61,y:53},{x:39,y:69},{x:48.5,y:72},{x:58,y:69}] as const;
export type MemoryCard={id:MemoryId;name:string;icon:string;title:string;photo:string|null;date:string|null;message:string;x:number;y:number};
// Photos and captions are supplied by the player; unfilled memories stay placeholders.
const memories:Partial<Record<MemoryId,Pick<MemoryCard,'photo'|'date'|'message'>>>={
 ticket:{photo:'/assets/level-three/photos/ticket.webp',date:'2021-10-06',message:'我们第一次一起看电影，留下了第一张照片。'},
 mask:{photo:'/assets/level-three/photos/mask.webp',date:'2021-12-26',message:'一起去冬游，虽然下雨了，但前一天一起去买零食的经历很开心哟。'},
 sunglasses:{photo:'/assets/level-three/photos/sunglasses.webp',date:'2022-01-13',message:'四大天王终于要逃离苦海，露出幸福的微笑！'},
 cake:{photo:'/assets/level-three/photos/cake.webp',date:'2022-01-29',message:'给15岁的五月七过生日，后面两个人在发光。'},
 wand:{photo:'/assets/level-three/photos/wand.webp',date:'2026-05-04',message:'在霍格沃兹，狮院和蛇院的我们留下了和谐的一张照片。'},
 photo:{photo:'/assets/level-three/photos/photo.webp',date:'2023-09-15',message:'有你们的成年礼，我很开心~~'},
 temple:{photo:'/assets/level-three/photos/temple.webp',date:'2026-05-02',message:'北京天坛打卡！'},
 rabbit:{photo:'/assets/level-three/photos/rabbit.webp',date:'2025-10-07',message:'国庆旅游团来到了河南洛阳'},
};
export const gardenCards:MemoryCard[]=memoryTargets.map((item,index)=>({id:item.id,name:item.name,icon:item.image,title:item.name,photo:null,date:null,message:'这是回忆留言的测试占位内容，真实照片与文字等待你来补充。',...memories[item.id],...gardenSlots[index]}));
