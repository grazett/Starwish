// Lossless WebP variants have the same dimensions and visible pixels as the
// original PNGs. Keep the originals for source art and existing save references.
export function openingImageSource(src:string){return src.endsWith('.png')?src.slice(0,-4)+'.webp':src;}
export function openingAssets<T extends Record<string,string>>(assets:T):T{
 return Object.fromEntries(Object.entries(assets).map(([key,src])=>[key,openingImageSource(src)])) as T;
}
export function loadOpeningImage(src:string,retry=true):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{
  const image=new Image();
  const cleanup=()=>{clearTimeout(timer);image.onload=null;image.onerror=null;};
  const timer=setTimeout(()=>{cleanup();image.src='';reject(new Error(`Image timed out: ${src}`));},20000);
  image.onload=()=>{cleanup();resolve(image);};
  image.onerror=()=>{cleanup();reject(new Error(`Image unavailable: ${src}`));};
  image.src=src;
 }).catch((error:unknown)=>{if(retry)return loadOpeningImage(src,false);throw error;}) as Promise<HTMLImageElement>;
}

// Fonts are decorative: slow font downloads must not hold a scene behind black.
export async function prepareOpeningFont(font:string,text:string){
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{await Promise.race([document.fonts.load(font,text).catch(()=>[]),new Promise(resolve=>{timer=setTimeout(resolve,2500);})]);}
 finally{clearTimeout(timer);}
}
