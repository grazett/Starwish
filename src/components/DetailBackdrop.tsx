import {useEffect,useRef} from 'react';

// Use only empty edge texture from the outpaint. Furniture stays on the original
// registered image above it, so no generated book/handle can move a click target.
export default function DetailBackdrop({kind}:{kind:'bookshelf'|'drawer'}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  let active=true;const image=new Image();
  const draw=()=>{
   const canvas=ref.current;if(!active||!canvas||!image.complete||!image.naturalWidth)return;
   const picture=canvas.parentElement?.querySelector('.puzzle-picture')?.getBoundingClientRect();if(!picture)return;
   const w=innerWidth,h=innerHeight;canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
   const sourceBands=kind==='bookshelf'?[0,.757,.823,1]:[0,.687,.776,1];
   const wall=kind==='bookshelf'?.843:.721,floor=kind==='bookshelf'?.927:.826;
   const target=[0,picture.top+picture.height*wall,picture.top+picture.height*floor,h];
   for(let i=0;i<3;i++)ctx.drawImage(image,0,sourceBands[i]*image.height,image.width*.25,(sourceBands[i+1]-sourceBands[i])*image.height,0,target[i],w,Math.max(1,target[i+1]-target[i]));
  };
  const resize=new ResizeObserver(draw);if(ref.current?.parentElement)resize.observe(ref.current.parentElement);
  image.onload=draw;image.src=`/assets/level-one/${kind}-wide.webp`;window.addEventListener('resize',draw);
  return()=>{active=false;resize.disconnect();window.removeEventListener('resize',draw);};
 },[kind]);
 return <canvas ref={ref} className="detail-scene-fill" aria-hidden="true"/>;
}
