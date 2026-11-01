import {useEffect,useRef} from 'react';
import {playAmbience,type AmbienceKind} from './ambience';
export function useAmbience(kind:AmbienceKind,muted:boolean,active=true,volume=.15){
 const playback=useRef<ReturnType<typeof playAmbience>|null>(null);
 useEffect(()=>{if(!active)return;const sound=playAmbience(kind,muted,volume);playback.current=sound;return()=>{sound.stop();playback.current=null;};},[kind,active,volume]);
 useEffect(()=>{playback.current?.setMuted(muted);},[muted]);
}
