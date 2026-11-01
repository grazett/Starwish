export type MusicStage='title'|'intro'|'letter'|'story'|'wardrobe'|'cabin'|'room'|'reveal'|'silent'|'beach';
export const musicAssets={title:'/audio/stardew/title.mp3',story:'/audio/stardew/spring.mp3',room:'/audio/stardew/cloud-country.mp3',letter:'/audio/stardew/music-box.mp3'};
const priority:Record<MusicStage,number>={title:0,intro:1,letter:1,story:1,wardrobe:2,cabin:3,room:4,reveal:5,silent:5,beach:6};
const sourceFor=(stage:MusicStage)=>stage==='silent'||stage==='intro'?null:stage==='title'?musicAssets.title:stage==='letter'||stage==='beach'||stage==='reveal'?musicAssets.letter:stage==='room'?musicAssets.room:musicAssets.story;
const loopFor=(stage:MusicStage)=>stage!=='wardrobe'&&stage!=='cabin';
type Lease={stage:MusicStage;volume:number};
export type MusicPlayback='idle'|'loading'|'playing'|'blocked'|'muted'|'paused'|'ended'|'error';
// Parent story components can remain mounted behind the wardrobe or first level.
// Scene ownership prevents their mute updates from switching back to story music.
export class BgmController{
 private owners=new Map<symbol,Lease>();
 private current:HTMLAudioElement|undefined;
 private retiring=new Set<HTMLAudioElement>();
 private fades=new Map<HTMLAudioElement,ReturnType<typeof setInterval>>();
 private wanted:Lease={stage:'silent',volume:.2};
 private muted=false;
 private hidden=false;
 private playback:MusicPlayback='idle';
 private listeners=new Set<()=>void>();
 private resolveQueued=false;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 getPlayback=()=>this.playback;
 private report(value:MusicPlayback){if(value===this.playback)return;this.playback=value;for(const listener of this.listeners)listener();}
 constructor(private makeAudio:(url:string)=>HTMLAudioElement=url=>{const el=new Audio(url);el.hidden=true;el.dataset.gameBgm='true';document.body.append(el);return el;}){}
 acquire(stage:MusicStage,volume=.2){
  const id=Symbol(stage);this.owners.set(id,{stage,volume});this.resolve();
  return Object.assign(()=>{this.owners.delete(id);this.deferResolve();},{update:(nextStage:MusicStage,nextVolume=.2)=>{if(!this.owners.has(id))return;this.owners.set(id,{stage:nextStage,volume:nextVolume});this.resolve();}});
 }
 // React removes the previous screen's effect before mounting the next one.
 // Resolve releases after that commit so a temporary parent/empty ownership
 // state cannot switch away from the same track and restart its playhead.
 private deferResolve(){if(this.resolveQueued)return;this.resolveQueued=true;queueMicrotask(()=>{this.resolveQueued=false;this.resolve();});}
 private resolve(){let selected:Lease={stage:'silent',volume:.2};let rank=-1;for(const owner of this.owners.values())if(priority[owner.stage]>=rank){selected=owner;rank=priority[owner.stage];}this.select(selected);}
 setMuted(value:boolean){this.muted=value;if(value)this.silence();else this.resume();}
 setHidden(value:boolean){this.hidden=value;if(value)this.silence();else this.resume();}
 select(lease:Lease){
  this.wanted=lease;const url=sourceFor(lease.stage);
  // Bedroom/classroom/cafeteria/corridor have only scene sound. Cut the title
  // tail here too, including a track retiring from the title's unmount.
  if(lease.stage==='intro'){this.silence();this.current?.remove();this.current=undefined;this.report(this.muted?'muted':'idle');return;}
  if(this.current?.getAttribute('src')===url){this.current.loop=loopFor(lease.stage);if(this.muted||this.hidden)this.silence();else if(this.current.ended&&!this.current.loop)this.report('ended');else if(this.current.paused)this.resume();else this.fade(this.current,lease.volume,450);return;}
  if(this.current){const old=this.current;this.retiring.add(old);this.fade(old,0,this.muted||this.hidden?0:650,()=>{old.pause();old.remove();this.retiring.delete(old);});this.current=undefined;}
  if(!url){this.report('idle');return;}
  this.current=this.makeAudio(url);this.current.loop=loopFor(lease.stage);this.current.preload='auto';this.current.volume=0;
  const track=this.current;track.onended=()=>{if(track===this.current&&!track.loop)this.report('ended');};
  this.report(this.muted?'muted':this.hidden?'paused':'loading');
  if(!this.muted&&!this.hidden)this.resume();
 }
 resume(){
  const audio=this.current;if(!audio||this.muted||this.hidden)return;
  if(audio.ended&&!audio.loop){this.report('ended');return;}
  // Retrying an already-playing track on each pointer gesture must not restart
  // its volume envelope or reset its playhead.
  if(!audio.paused)return;
  this.report('loading');
  try{void audio.play().then(()=>{if(audio!==this.current||this.muted||this.hidden){audio.pause();return;}this.fade(audio,this.wanted.volume,650);this.report('playing');}).catch((error:unknown)=>{if(audio!==this.current||this.muted||this.hidden)return;this.report(error instanceof Error&&error.name==='NotAllowedError'?'blocked':'error');});}catch{this.report('error');}
 }
 private silence(){
  this.report(this.muted?'muted':'paused');
  if(this.current){this.cancelFade(this.current);this.current.pause();this.current.volume=0;}
  for(const audio of this.retiring){this.cancelFade(audio);audio.pause();audio.remove();}this.retiring.clear();
 }
 private cancelFade(audio:HTMLAudioElement){const timer=this.fades.get(audio);if(timer!==undefined){clearInterval(timer);this.fades.delete(audio);}}
 private fade(audio:HTMLAudioElement,to:number,duration:number,done?:()=>void){
  this.cancelFade(audio);if(duration===0){audio.volume=to;done?.();return;}
  const from=audio.volume,start=performance.now();
  const timer=setInterval(()=>{const t=Math.min(1,(performance.now()-start)/duration);audio.volume=Math.max(0,Math.min(1,from+(to-from)*t));if(t===1){this.cancelFade(audio);done?.();}},25);this.fades.set(audio,timer);
 }
}
export const bgm=new BgmController();
let installed=false;
export function installMusicControls(){
 if(installed)return;installed=true;
 try{bgm.setMuted(localStorage.getItem('starwish-title-muted')==='true');}catch{}
 document.addEventListener('pointerdown',()=>bgm.resume());
 document.addEventListener('keydown',()=>bgm.resume());
 document.addEventListener('visibilitychange',()=>bgm.setHidden(document.hidden));
}
// Preserve the old audio API for the older standalone entry point.
export function setMusic(stage:string,muted:boolean){installMusicControls();bgm.setMuted(muted);bgm.select({stage:stage==='title'?'title':'story',volume:.2});}
