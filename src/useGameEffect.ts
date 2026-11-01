import {useEffect} from 'react';
import {playGameEffect} from './audio';
import type {GameEffect} from './gameEffectSamples';

// Seek restored animations; clean up scheduled audio when switching scenes.
export function useGameEffect(kind:GameEffect,startedAt:number|null){
 useEffect(()=>{
  if(startedAt===null)return;
  const cue=playGameEffect(kind,Math.max(0,(Date.now()-startedAt)/1000));
  const visibility=()=>{if(document.hidden)cue.stop();};
  document.addEventListener('visibilitychange',visibility);
  return()=>{cue.stop();document.removeEventListener('visibilitychange',visibility);};
 },[kind,startedAt]);
}
