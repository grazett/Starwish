export type OpeningCue='elevator'|'paper';
export function openingCueSamples(kind:OpeningCue,sampleRate:number){
 const duration=kind==='elevator'?1.15:2,samples=new Float32Array(Math.ceil(sampleRate*duration));
 let random=7321,low=0;
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate;
  if(kind==='elevator'){
   const attack=Math.min(1,t/.006),decay=Math.exp(-t*5.2)*Math.min(1,(duration-t)/.12);
   samples[i]=attack*decay*(Math.sin(2*Math.PI*1046.5*t)*.5+Math.sin(2*Math.PI*2093*t)*.16+Math.sin(2*Math.PI*3139.5*t)*.045);
  }else{
   random^=random<<13;random^=random>>>17;random^=random<<5;const white=(random>>>0)/2147483648-1;
   low=low*.7+white*.3;
   let envelope=0;for(const [start,length,level] of [[.1,.48,.65],[.64,.65,.8],[1.28,.55,.5]]){const p=(t-start)/length;if(p>0&&p<1)envelope+=Math.sin(p*Math.PI)**1.2*level;}
   samples[i]=(white-low)*envelope*.37;
  }
 }
 return samples;
}
