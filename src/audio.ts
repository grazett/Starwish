import {bgm,musicAssets} from './music';
import {openingCueSamples,type OpeningCue} from './openingCueSamples';
import {gameEffectSamples,gameEffectDurations,type GameEffect} from './gameEffectSamples';
export {setMusic} from './music';
export const audioAssets: Record<string,string|null>={...musicAssets,click:null,parcel:null,letter:null,confirm:null};
let context:AudioContext|undefined;
let effectsVolume:GainNode|undefined;
let doorRecording:Promise<AudioBuffer|null>|undefined;
function loadDoorRecording(ac:AudioContext){
 return doorRecording??=fetch('/audio/effects/wood-door-open.mp3').then(response=>{if(!response.ok)throw Error('Door audio unavailable');return response.arrayBuffer();}).then(data=>ac.decodeAudioData(data)).catch(()=>null);
}
export function setGameEffectsMuted(muted:boolean){if(context&&effectsVolume)effectsVolume.gain.setTargetAtTime(muted?0:1,context.currentTime,.015);}
export function playGameEffect(kind:GameEffect,elapsed=0){
 let source:AudioBufferSourceNode|undefined,stopped=false;
 const stop=()=>{stopped=true;try{source?.stop();}catch{}source?.disconnect();};
 try{
  let muted=false;try{muted=localStorage.getItem('starwish-title-muted')==='true';}catch{}
  if(muted||document.hidden||elapsed>=gameEffectDurations[kind])return {stop};
  unlockAudio();const ac=context!;const requested=performance.now();
  const start=async()=>{
   const recording=kind==='door'?await loadDoorRecording(ac):null;
   if(stopped||document.hidden||performance.now()-requested>250)return;
   try{muted=localStorage.getItem('starwish-title-muted')==='true';}catch{}
   if(!effectsVolume){effectsVolume=ac.createGain();effectsVolume.connect(ac.destination);}setGameEffectsMuted(muted);
   let buffer=recording;
   if(!buffer){const samples=gameEffectSamples(kind,ac.sampleRate);buffer=ac.createBuffer(1,samples.length,ac.sampleRate);buffer.getChannelData(0).set(samples);}
   if(elapsed>=buffer.duration)return;
   source=ac.createBufferSource();source.buffer=buffer;
   const gain=ac.createGain();gain.gain.value=recording?.55:1;source.connect(gain);gain.connect(effectsVolume);
   source.onended=()=>{source?.disconnect();gain.disconnect();};source.start(0,Math.max(0,elapsed));
  };
  if(ac.state==='running')void start().catch(()=>{});else void ac.resume().then(start).catch(()=>{});
 }catch{/* Audio failure must never block the game. */}
 return {stop};
}
export function unlockAudio(){bgm.resume();try{context??=new AudioContext();void context.resume().catch(()=>{});void loadDoorRecording(context);}catch{/* 无音频支持时静默运行 */}}
export function sound(kind:string,muted:boolean){if(muted)return;try{if(audioAssets[kind]){void new Audio(audioAssets[kind]!).play().catch(()=>{});return;}if(!context)return;const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.setValueAtTime(kind==='confirm'?660:kind==='parcel'?220:440,context.currentTime);g.gain.setValueAtTime(.035,context.currentTime);g.gain.exponentialRampToValueAtTime(.001,context.currentTime+.16);o.connect(g);g.connect(context.destination);o.start();o.stop(context.currentTime+.18);}catch{}}

export function playOpeningCue(kind:OpeningCue,muted:boolean){
 let stopped=muted,quiet=muted,source:AudioBufferSourceNode|undefined,gain:GainNode|undefined;
 const requested=performance.now();
 if(!muted)try{
  unlockAudio();const ac=context!;
  const start=()=>{
   // Never queue an elevator chime to ring several seconds after its door opened.
   if(stopped||performance.now()-requested>300)return;
   const samples=openingCueSamples(kind,ac.sampleRate),buffer=ac.createBuffer(1,samples.length,ac.sampleRate);buffer.getChannelData(0).set(samples);
   source=ac.createBufferSource();source.buffer=buffer;gain=ac.createGain();gain.gain.value=quiet?0:.28;
   source.connect(gain);gain.connect(ac.destination);source.onended=()=>{source?.disconnect();gain?.disconnect();};source.start();
  };
  if(ac.state==='running')start();else void ac.resume().then(start).catch(()=>{});
 }catch{}
 return {setMuted(value:boolean){quiet=value;if(context&&gain)gain.gain.setTargetAtTime(value?0:.28,context.currentTime,.015);},stop(){if(stopped)return;stopped=true;try{source?.stop();}catch{}source?.disconnect();gain?.disconnect();}};
}

// A distant sewing machine: repeating paired needle taps over a low motor hum.
// The buffer loops seamlessly without setInterval drift or accumulating nodes.
export function playSewingMachine(muted:boolean){
 let stopped=false,source:AudioBufferSourceNode|undefined,volume:GainNode|undefined,filter:BiquadFilterNode|undefined;
 try{
  unlockAudio();if(!context)throw Error('Audio unavailable');const ac=context;
  const buffer=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),samples=buffer.getChannelData(0),period=ac.sampleRate/12;
  for(let i=0;i<samples.length;i++){
   const t=i/ac.sampleRate,phase=(i%period)/ac.sampleRate;
   const tap=Math.exp(-phase*230),returnTap=phase>.035?Math.exp(-(phase-.035)*280):0;
   const needle=(Math.random()*2-1)*(.6*tap+.24*returnTap)+Math.sin(2*Math.PI*1350*t)*.18*tap;
   const motor=Math.sin(2*Math.PI*96*t)*.07*(.6+.4*Math.sin(2*Math.PI*12*t));
   samples[i]=needle+motor;
  }
  source=ac.createBufferSource();source.buffer=buffer;source.loop=true;
  filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2400;
  volume=ac.createGain();volume.gain.setValueAtTime(0,ac.currentTime);volume.gain.linearRampToValueAtTime(muted?0:.16,ac.currentTime+.65);
  source.connect(filter);filter.connect(volume);volume.connect(ac.destination);
  source.onended=()=>{source?.disconnect();filter?.disconnect();volume?.disconnect();};source.start();
 }catch{source?.disconnect();filter?.disconnect();volume?.disconnect();}
 return {stop(){if(stopped)return;stopped=true;if(context&&source&&volume){volume.gain.cancelScheduledValues(context.currentTime);volume.gain.setTargetAtTime(0,context.currentTime,.035);try{source.stop(context.currentTime+.15);}catch{}}},setMuted(next:boolean){if(context&&volume&&!stopped)volume.gain.setTargetAtTime(next?0:.16,context.currentTime,.06);}};
}

// Temporary distant engine: filtered rumble, a gentle idle pulse and slow approach.
// The separate mute gain preserves the cue envelope when the music switch changes.
export function playDepartureEngine(muted:boolean,driving=false){
 let stopped=false;const nodes:AudioNode[]=[],sources:AudioScheduledSourceNode[]=[];let volume:GainNode|undefined;
 const stop=()=>{if(stopped)return;stopped=true;for(const source of sources){try{source.stop();}catch{}}for(const node of nodes)node.disconnect();};
 try{
  unlockAudio();if(!context)throw new Error('Audio unavailable');const ac=context,start=ac.currentTime+(driving?.65:.4),end=driving?6.8:6.6;
  const envelope=ac.createGain();volume=ac.createGain();volume.gain.value=muted?0:1;
  const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=220;filter.Q.value=.65;
  envelope.gain.setValueAtTime(.0001,ac.currentTime);envelope.gain.linearRampToValueAtTime(driving?.08:.025,start+1.5);envelope.gain.linearRampToValueAtTime(driving?.13:.045,start+(driving?3.2:4));envelope.gain.exponentialRampToValueAtTime(.0001,start+end-.1);
  const buffer=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),samples=buffer.getChannelData(0);let low=0;
  for(let i=0;i<samples.length;i++){low=low*.96+(Math.random()*2-1)*.04;samples[i]=low*3;}
  const noise=ac.createBufferSource();noise.buffer=buffer;noise.loop=true;noise.connect(filter);sources.push(noise);
  const motor=ac.createOscillator(),motorGain=ac.createGain();motor.type='sawtooth';motor.frequency.setValueAtTime(46,start);motor.frequency.linearRampToValueAtTime(driving?92:66,start+3.2);if(driving)motor.frequency.linearRampToValueAtTime(44,start+end-.1);motorGain.gain.value=.25;motor.connect(motorGain);motorGain.connect(filter);sources.push(motor);
  if(driving){const road=ac.createBufferSource(),roadFilter=ac.createBiquadFilter(),roadGain=ac.createGain(),roadBuffer=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const roadSamples=roadBuffer.getChannelData(0);for(let i=0;i<roadSamples.length;i++)roadSamples[i]=(Math.random()*2-1)*.25;road.buffer=roadBuffer;road.loop=true;roadFilter.type='bandpass';roadFilter.frequency.value=850;roadFilter.Q.value=.5;roadGain.gain.value=.65;road.connect(roadFilter);roadFilter.connect(roadGain);roadGain.connect(envelope);sources.push(road);nodes.push(road,roadFilter,roadGain);}
  filter.connect(envelope);envelope.connect(volume);volume.connect(ac.destination);nodes.push(noise,motor,motorGain,filter,envelope,volume);
  for(const source of sources){source.start(start);source.stop(start+end);}noise.onended=stop;
 }catch{stop();}
 return {stop,setMuted(next:boolean){if(volume&&!stopped&&context)volume.gain.setTargetAtTime(next?0:1,context.currentTime,.06);}};
}

// Beach effects share the existing unlocked AudioContext and music switch.
export const birthdayBurstTimes=[3400,4500,5700,6900,8100,9000];
// Fired by each visible CSS burst cue rather than by a second batch timer.
export function playBirthdayBurst(muted:boolean){
 let stopped=false,quiet=muted,source:AudioBufferSourceNode|undefined,filter:BiquadFilterNode|undefined,gain:GainNode|undefined,volume:GainNode|undefined;
 const requested=performance.now();
 const stop=()=>{if(stopped)return;stopped=true;try{source?.stop();}catch{}source?.disconnect();filter?.disconnect();gain?.disconnect();volume?.disconnect();};
 try{
  unlockAudio();if(!context)throw Error('Audio unavailable');const ac=context;
  const start=()=>{
   // A blocked/suspended device must never deliver an old explosion later.
   if(stopped||performance.now()-requested>150)return;
   const buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*.7),ac.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(ac.sampleRate*.2));
   source=ac.createBufferSource();filter=ac.createBiquadFilter();gain=ac.createGain();volume=ac.createGain();
   source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1250;volume.gain.value=quiet?0:1;
   const at=ac.currentTime;gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(.12,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+.68);
   source.connect(filter);filter.connect(gain);gain.connect(volume);volume.connect(ac.destination);
   source.onended=stop;source.start(at);source.stop(at+.7);
  };
  if(ac.state==='running')start();else void ac.resume().then(start).catch(stop);
 }catch{stop();}
 return {stop,setMuted(value:boolean){quiet=value;if(context&&volume&&!stopped)volume.gain.setTargetAtTime(value?0:1,context.currentTime,.04);}};
}
export function playBeachWaves(muted:boolean){
 let stopped=false,source:AudioBufferSourceNode|undefined,filter:BiquadFilterNode|undefined,gain:GainNode|undefined;
 try{
  unlockAudio();if(!context)throw Error('Audio unavailable');const ac=context,buffer=ac.createBuffer(1,ac.sampleRate*8,ac.sampleRate),data=buffer.getChannelData(0);let smooth=0;
  for(let i=0;i<data.length;i++){smooth=smooth*.9+(Math.random()*2-1)*.1;const swell=.35+.65*(.5-.5*Math.cos(2*Math.PI*i/data.length));data[i]=smooth*swell;}
  source=ac.createBufferSource();source.buffer=buffer;source.loop=true;filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;gain=ac.createGain();gain.gain.setValueAtTime(0,ac.currentTime);gain.gain.linearRampToValueAtTime(muted?0:.12,ac.currentTime+1.4);source.connect(filter);filter.connect(gain);gain.connect(ac.destination);source.start();
 }catch{source?.disconnect();filter?.disconnect();gain?.disconnect();}
 return {stop(){if(stopped)return;stopped=true;try{source?.stop();}catch{}source?.disconnect();filter?.disconnect();gain?.disconnect();},setMuted(value:boolean){if(context&&gain&&!stopped)gain.gain.setTargetAtTime(value?0:.12,context.currentTime,.15);}};
}
