export const journeyDuration=7.7;
export const journeyCaptionStart=.8+(960-360+760)/2860*6.6;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};
export function journeyPose(seconds:number){
 const t=Math.max(0,Math.min(journeyDuration,seconds)),travel=t;
 return {t,
  roadBlack:1-ease(t/.8),busX:-760+2860*clamp((t-.8)/6.6),busVisible:t>=.8&&t<7.4,
  farOffset:travel*20,roadOffset:travel*110,cloudOffset:travel*6,
  text:ease((t-journeyCaptionStart)/1.2)*(1-ease((t-7)/.7)),
  endBlack:ease((t-7)/.7),ended:t>=journeyDuration};
}
