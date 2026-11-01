export const ambienceAssets={writing:'/audio/ambience/writing.mp3',cafeteria:'/audio/ambience/cafeteria.mp3',nature:'/audio/ambience/nature.mp3'};
export type AmbienceKind=keyof typeof ambienceAssets;
export function playAmbience(kind:AmbienceKind,muted:boolean,volume=.15){
 const audio=new Audio(ambienceAssets[kind]);audio.loop=true;audio.preload='auto';audio.volume=0;audio.hidden=true;audio.dataset.gameAmbience=kind;document.body.append(audio);
 let stopped=false,quiet=muted,fade:ReturnType<typeof setInterval>|undefined;
 const cancelFade=()=>{if(fade!==undefined)clearInterval(fade);fade=undefined;};
 const resume=()=>{
  if(stopped||quiet||document.hidden||!audio.paused)return;
  void audio.play().then(()=>{
   if(stopped||quiet||document.hidden){audio.pause();return;}
   cancelFade();const start=performance.now();fade=setInterval(()=>{const t=Math.min(1,(performance.now()-start)/500);audio.volume=volume*t;if(t===1)cancelFade();},25);
  }).catch(()=>{/* A real pointer/key gesture retries browser-blocked playback. */});
 };
 const silence=()=>{cancelFade();audio.volume=0;audio.pause();};
 const visibility=()=>{if(document.hidden)silence();else resume();};
 document.addEventListener('pointerdown',resume);document.addEventListener('keydown',resume);document.addEventListener('visibilitychange',visibility);resume();
 return {setMuted(value:boolean){quiet=value;if(value)silence();else resume();},stop(){if(stopped)return;stopped=true;silence();document.removeEventListener('pointerdown',resume);document.removeEventListener('keydown',resume);document.removeEventListener('visibilitychange',visibility);audio.remove();}};
}
