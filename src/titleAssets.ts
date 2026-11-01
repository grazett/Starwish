import {openingAssets} from './openingImages';
// 用户提供的正式素材：逐字节复制，保留尺寸、透明留白与原始图层。
const directory='/assets/title/formal/';
export const titleAssets=openingAssets({sky:directory+'sky.webp',cloud:directory+'cloud-large.webp',cloudWide:directory+'cloud-wide.webp',cloudSmall:directory+'cloud-small.webp',cloudRound:directory+'cloud-round.webp',sign:directory+'sign.webp',button:directory+'button.webp',noticeboard:'/assets/title/noticeboard.webp'});
type CloudSprite={layer:'far'|'middle'|'near';x:number;y:number;width:number;delay:number;asset:'cloud'|'cloudWide'|'cloudSmall'|'cloudRound'};
// 坐标均基于 1280×720；四种云形分别复用，不镜像、不压扁。
export const cloudSprites:CloudSprite[]=[
 {layer:'far',x:-5,y:17,width:15,delay:-8,asset:'cloudSmall'},
 {layer:'far',x:27,y:2,width:13,delay:-40,asset:'cloudWide'},
 {layer:'far',x:72,y:0,width:15,delay:-26,asset:'cloudSmall'},
 {layer:'far',x:89,y:43,width:17,delay:-10,asset:'cloudSmall'},
 {layer:'far',x:26,y:60,width:18,delay:-47,asset:'cloudSmall'},
 {layer:'far',x:85,y:62,width:16,delay:-63,asset:'cloudWide'},
 {layer:'middle',x:3,y:2,width:21,delay:-12,asset:'cloud'},
 {layer:'middle',x:85,y:9,width:25,delay:-35,asset:'cloudRound'},
 {layer:'middle',x:5,y:34,width:18,delay:-56,asset:'cloudRound'},
 {layer:'middle',x:-5,y:49,width:16,delay:-20,asset:'cloudSmall'},
 {layer:'middle',x:59,y:59,width:20,delay:-31,asset:'cloud'},
 {layer:'middle',x:41,y:88,width:20,delay:-62,asset:'cloudWide'},
 {layer:'near',x:-13,y:61,width:36,delay:-7,asset:'cloudRound'},
 {layer:'near',x:-5,y:87,width:38,delay:-46,asset:'cloud'},
 {layer:'near',x:11,y:96,width:32,delay:-35,asset:'cloudRound'},
 {layer:'near',x:87,y:73,width:34,delay:-53,asset:'cloud'},
 {layer:'near',x:73,y:88,width:33,delay:-15,asset:'cloudRound'},
 {layer:'near',x:64,y:99,width:28,delay:-67,asset:'cloudSmall'},
];
