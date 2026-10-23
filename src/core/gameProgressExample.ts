export const GAME_PROGRESS_EXAMPLE=`let progress=api.loadProgress({best:0,level:1,bright:false});
let score=0,wasSpace=false;
function save(){api.saveProgress(progress);}
api.onFrame=(dt,keys)=>{
 if(keys.Space&&!wasSpace){score++;if(score>progress.best){progress.best=score;progress.level=1+Math.floor(score/5);save();}}
 wasSpace=!!keys.Space;
 api.clear(progress.bright?'#39466b':'#202637');
 api.text('Saved progress demo',130,30,'#ffffff');
 api.text('Score: '+score+' | Best: '+progress.best+' | Unlocked level: '+progress.level,30,70,'#ffffff');
 api.text('Space: score | Stop then Run to check saved progress',20,105,'#ffffff');
 if(api.button('Toggle theme',20,135,155,42)){progress.bright=!progress.bright;save();}
 if(api.button('Reset progress',200,135,170,42)){progress={best:0,level:1,bright:false};score=0;save();}
 api.text('Save status: '+api.progressStatus,30,220,'#ffffff');
 api.text('Best, unlock and theme persist. Current score resets.',20,255,'#ffffff');
};`;
