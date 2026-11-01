export type GameEffect='drawer'|'book'|'chest'|'door'|'catch'|'catch-new'|'bubble'|'box'|'slot'|'synthesis'|'gift-open';
export const gameEffectDurations:Record<GameEffect,number>={drawer:1,book:.07,chest:.24,door:3.2,catch:.3,'catch-new':.3,bubble:.22,box:.09,slot:.45,synthesis:10,'gift-open':5};

// Material-specific foley. Musical layers are reserved for magic and a soft
// accent on the first catch of a memory, rather than beeps for every action.
export function gameEffectSamples(kind:GameEffect,rate:number){
 const data=new Float32Array(Math.ceil(rate*gameEffectDurations[kind]));
 let seed=713;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2147483648-1;};
 const add=(at:number,length:number,signal:(t:number,p:number)=>number)=>{
  const start=Math.round(at*rate),count=Math.round(length*rate);
  for(let j=0;j<count&&start+j<data.length;j++)data[start+j]+=signal(j/rate,j/count);
 };
 const impact=(at:number,volume:number,base:number,damping=.065)=>{
  // Quickly damped inharmonic modes give wood/wicker a hollow, unpitched knock.
  add(at,damping*5,t=>Math.min(1,t/.0015)*volume*(Math.sin(2*Math.PI*base*t)*Math.exp(-t/damping)
   +.38*Math.sin(2*Math.PI*base*2.73*t)*Math.exp(-t/(damping*.45))+.15*random()*Math.exp(-t/.009)));
 };
 const friction=(at:number,length:number,volume:number,cutoff:number,roughness:number,highpass=false)=>{
  let low=0;const alpha=1-Math.exp(-2*Math.PI*cutoff/rate);
  add(at,length,(t,p)=>{
   const n=random();low+=alpha*(n-low);
   const grain=.6+.25*Math.sin(2*Math.PI*roughness*t)+.15*Math.sin(2*Math.PI*roughness*2.31*t);
   return (highpass?n-low:low)*volume*Math.pow(Math.sin(Math.PI*p),.65)*grain;
  });
 };
 const hinge=(at:number,length:number,volume:number,base:number)=>{
  let phase=0;
  add(at,length,(t,p)=>{
   const hz=base*(1+.28*Math.sin(p*4.7)+.05*Math.sin(2*Math.PI*19*t));phase+=2*Math.PI*hz/rate;
   const slip=.45+.55*Math.pow(.5+.5*Math.sin(2*Math.PI*(14*t+3*t*t)),3);
   return volume*Math.sin(Math.PI*p)*slip*(Math.sin(phase)+.3*Math.sin(phase*3)+.12*random());
  });
 };
 const bell=(at:number,length:number,hz:number,volume:number)=>{
  add(at,length,(t,p)=>volume*Math.min(1,t/.006)*Math.pow(1-p,2)*Math.exp(-t/Math.max(.1,length*.55))
   *(Math.sin(2*Math.PI*hz*t)+.23*Math.sin(2*Math.PI*hz*2.756*t)*Math.exp(-t*12)));
 };
 const air=(at:number,length:number,volume:number)=>{
  let low=0,slow=0;
  add(at,length,(_,p)=>{low+=.18*(random()-low);slow+=.015*(low-slow);return (low-slow)*volume*Math.sin(Math.PI*p);});
 };
 const pad=(at:number,length:number,volume:number)=>{
  add(at,length,(t,p)=>volume*Math.pow(Math.sin(Math.PI*p),1.5)
   *[261.63,329.63,392].reduce((sum,hz,i)=>sum+Math.sin(2*Math.PI*hz*t+.16*Math.sin(t*(2+i)))/3,0));
 };
 switch(kind){
  case 'drawer':
   impact(0,.07,155,.035);friction(.035,.77,.38,650,33);friction(.12,.62,.065,1700,57,true);impact(.83,.1,110,.04);break;
  case 'book':impact(0,.07,1100,.005);friction(.002,.018,.035,1800,40,true);break;
  case 'chest':
   impact(0,.11,1450,.006);friction(.002,.014,.08,2400,60,true);impact(.065,.13,430,.013);break;
  case 'door':
   // Quiet fallback if the recorded door cannot load; no pitched hinge squeal.
   impact(0,.065,920,.009);impact(.07,.05,135,.02);friction(.12,.75,.13,550,12);break;
  case 'catch':
  case 'catch-new':
   // One small rounded ding, identical for new and repeated catches.
   add(0,.3,(t,p)=>.075*Math.min(1,t/.006)*Math.exp(-t*13)*(1-p)
    *(Math.sin(2*Math.PI*1047*t)+.06*Math.sin(2*Math.PI*2094*t)));break;
  case 'bubble':
   // Soft low water pop, without the sharp hiss or high-frequency sweep.
   {let phase=0;add(0,.2,t=>{phase+=2*Math.PI*(220+220*Math.exp(-t*30))/rate;return .075*Math.min(1,t/.005)*Math.exp(-t*28)*Math.sin(phase);});}break;
  case 'box':
   impact(0,.065,820,.009);break;
  case 'slot':impact(0,.09,395,.023);friction(.005,.09,.05,1300,35);bell(.05,.38,1760,.034);break;
  case 'synthesis':
   [0,.8,1.6].forEach((at,i)=>bell(at,.85,[659,831,988][i],.055));
   air(2.6,3.1,.28);pad(3.2,4.5,.075);
   [3,3.45,3.9,4.35,4.8].forEach((at,i)=>bell(at,1.1,[784,988,1175,1568,1976][i],.035));
   [1047,1318,1568,2093].forEach((hz,i)=>bell(7.6+i*.1,1.5,hz,.045));break;
  case 'gift-open':
   friction(0,.8,.18,700,19);[.12,.36,.62].forEach(at=>impact(at,.04,165,.025));
   friction(1,.65,.14,1200,31,true);hinge(1.2,.65,.025,260);
   air(2,2.8,.3);pad(2.4,2.6,.065);[784,1175,1568,2349].forEach((hz,i)=>bell(2.05+i*.3,1.4,hz,.04));break;
 }
 const edge=Math.round(rate*.004);
 for(let i=0;i<edge;i++){data[i]*=i/edge;data[data.length-1-i]*=i/edge;}
 return data;
}
