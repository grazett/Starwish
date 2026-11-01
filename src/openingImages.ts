// Lossless WebP variants have the same dimensions and visible pixels as the
// original PNGs. Keep the originals for source art and existing save references.
export function openingImageSource(src:string){return src.endsWith('.png')?src.slice(0,-4)+'.webp':src;}
export function openingAssets<T extends Record<string,string>>(assets:T):T{
 return Object.fromEntries(Object.entries(assets).map(([key,src])=>[key,openingImageSource(src)])) as T;
}
const decodedImages=new Map<string,Promise<HTMLImageElement>>();
export function loadOpeningImage(src:string):Promise<HTMLImageElement>{
 const existing=decodedImages.get(src);if(existing)return existing;
 const pending=requestOpeningImage(src).catch(error=>{decodedImages.delete(src);throw error;});
 if(decodedImages.size>=24)decodedImages.delete(decodedImages.keys().next().value!);
 decodedImages.set(src,pending);return pending;
}
function requestOpeningImage(src:string,retry=true):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{
  const image=new Image();
  const cleanup=()=>{clearTimeout(timer);image.onload=null;image.onerror=null;};
  const timer=setTimeout(()=>{cleanup();image.src='';reject(new Error(`Image timed out: ${src}`));},20000);
  image.onload=()=>{cleanup();resolve(image);};
  image.onerror=()=>{cleanup();reject(new Error(`Image unavailable: ${src}`));};
  image.src=src;
 }).catch((error:unknown)=>{if(retry)return requestOpeningImage(src,false);throw error;}) as Promise<HTMLImageElement>;
}

// Warm the next scene with limited concurrency; foreground requests reuse these images.
export function preloadOpeningImages(sources:readonly string[]){
 let index=0,stopped=false;
 const worker=async()=>{while(!stopped&&index<sources.length){const src=sources[index++];try{await loadOpeningImage(src);}catch{/* Foreground loading can retry. */}}};
 for(let i=0;i<3;i++)void worker();
 return()=>{stopped=true;};
}

// Fonts are decorative: slow font downloads must not hold a scene behind black.
export async function prepareOpeningFont(font:string,text:string){
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{await Promise.race([document.fonts.load(font,text).catch(()=>[]),new Promise(resolve=>{timer=setTimeout(resolve,2500);})]);}
 finally{clearTimeout(timer);}
}
