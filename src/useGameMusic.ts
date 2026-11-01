import {useEffect,useRef} from 'react';
import {bgm,installMusicControls,type MusicStage} from './music';
import {setGameEffectsMuted} from './audio';
export function useGameMusic(stage:MusicStage,muted:boolean,subdued=false){
 const owner=useRef<ReturnType<typeof bgm.acquire>|null>(null);
 useEffect(()=>{installMusicControls();const lease=bgm.acquire(stage,subdued?.055:.2);owner.current=lease;return()=>{lease();owner.current=null;};},[]);
 useEffect(()=>{owner.current?.update(stage,subdued?.055:.2);},[stage,subdued]);
 useEffect(()=>{bgm.setMuted(muted);setGameEffectsMuted(muted);},[muted]);
}
