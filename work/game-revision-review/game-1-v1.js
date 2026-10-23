let score = 0;
let x = 120, y = 120;
let stars = [];
let wasSpace = false;
function newStar() {
  return {x: 12 + Math.random() * 456, y: 65 + Math.random() * 203, r: 3};
}
function reset() {
  score = 0; x = 120; y = 120;
  stars = Array.from({length: 20}, newStar);
}
reset(); // Initialize once, before the frame callback.
api.onFrame = (dt, keys) => {
  if (keys.Space && !wasSpace) reset();
  wasSpace = !!keys.Space;
  const speed = 150;
  x += ((keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)) * speed * dt;
  y += ((keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)) * speed * dt;
  x = Math.max(10, Math.min(470, x));
  y = Math.max(65, Math.min(270, y));
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    if (Math.hypot(x - star.x, y - star.y) < star.r + 10) {
      score++; stars[i] = newStar();
    }
  }
  api.clear("#000000");
  api.text("Collect stars! Arrow keys move.", 12, 21, "#ffffff");
  api.text("Space resets. Score: " + score, 12, 43, "#ffffff");
  for (const star of stars) api.circle(star.x, star.y, star.r, "#ffffff");
  api.circle(x, y, 10, "#ffff00");
};