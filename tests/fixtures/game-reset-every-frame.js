api.onFrame=(dt,keys)=>{
let score=0;
let x=120,y=120;
let stars=[];
for(let i=0;i<20;i++){
stars.push({x:Math.random()*480,y:Math.random()*280,r:3});
}
api.clear("#000");
api.text("Collect stars! Use arrow keys. Press Space to reset.",0,10,"#fff");
api.text("Score: "+score,340,10,"#fff");
if(keys.ArrowLeft)x-=5;
if(keys.ArrowRight)x+=5;
if(keys.ArrowUp)y-=5;
if(keys.ArrowDown)y+=5;
if(keys.Space){
score=0;
x=120;y=120;
stars=[];
for(let i=0;i<20;i++){
stars.push({x:Math.random()*480,y:Math.random()*280,r:3});
}
}
for(let s of stars){
api.circle(s.x,s.y,s.r,"#fff");
if(Math.hypot(x-s.x,y-s.y)<s.r+5){
score++;
stars.splice(stars.indexOf(s),1);
stars.push({x:Math.random()*480,y:Math.random()*280,r:3});
}
}
api.circle(x,y,10,"#ff0");
};
