// Run before modules that calculate save keys. Replaying only the opening while
// retaining completed chapter saves would skip the rest of the adventure.
const params=new URLSearchParams(location.search);
const run=params.get('previewRun');
const fullGame=params.get('scene')==='game'||params.get('scene')==='preview';
if(params.get('replayOpening')==='1'||(fullGame&&(!run||!/^[a-zA-Z0-9-]{1,64}$/.test(run)))){
 params.set('previewRun',`fresh-${crypto.randomUUID()}`);
 params.delete('replayOpening');
 history.replaceState(null,'',`/?${params.toString()}`);
}
