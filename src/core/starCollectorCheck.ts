import type { SandboxFrameResult } from "./codeSandbox";

export const STAR_COLLECTOR_MARKER = "// Mana check: Star Collector";
export const STAR_COLLECTOR_FRAMES = 60;
export const STAR_COLLECTOR_STARTER = `${STAR_COLLECTOR_MARKER}
let x = 60, y = 140, collected = false;
api.onFrame = (dt, keys) => {
  if (keys.Space) {
    x = 60;
    y = 140;
    collected = false;
  } else if (!collected) {
    x += 180 * dt * (Number(!!keys.ArrowRight) - Number(!!keys.ArrowLeft));
    y += 180 * dt * (Number(!!keys.ArrowDown) - Number(!!keys.ArrowUp));
    x = Math.max(10, Math.min(470, x));
    y = Math.max(10, Math.min(270, y));
    collected = Math.hypot(x - 180, y - 140) <= 15;
  }
  api.clear("#191832");
  api.text("Arrow keys move. Space restarts.", 12, 21, "#ffffff");
  api.text("Score: " + Number(collected), 12, 43, "#ffffff");
  api.circle(x, y, 10, "#ffff00");
  if (collected) api.text("You win!", 12, 65, "#ffffff");
  else api.circle(180, 140, 5, "#ffffff");
};`;
export const STAR_COLLECTOR_REQUEST = `Build a playable Star Collector game in the canvas.
Start the player at (60,140) and put one star at (180,140). Move with all four arrow keys using dt and a fixed speed between 150 and 200 pixels per second. Keep the player on the canvas. Start with score zero. On the first collision, set score to 1 and stop drawing the star. Keep that state until Space resets the player, score and star.
Draw exactly one player with api.circle(x,y,10,"#ffff00"). Only while score is zero, draw api.circle(180,140,5,"#ffffff"). Every frame draw api.text("Score: " + score,12,43,"#ffffff"). Draw control instructions in a separate call. While score is 1, draw api.text("You win!",12,65,"#ffffff"). Keep all gameplay in the single JavaScript file.`;

export function starCollectorKeys(frame: number): Record<string, boolean> {
  if ((frame >= 1 && frame <= 4) || (frame >= 17 && frame <= 56)) return { ArrowRight: true };
  if (frame >= 5 && frame <= 8) return { ArrowDown: true };
  if (frame >= 9 && frame <= 12) return { ArrowLeft: true };
  if (frame >= 13 && frame <= 16) return { ArrowUp: true };
  return frame === 58 ? { Space: true } : {};
}

export function starCollectorCheck() {
  let previousX = 60;
  let previousY = 140;
  let alreadyWon = false;
  return (frame: number, commands: SandboxFrameResult["commands"]) => {
    const player = commands.filter(command => command.type === "circle" && String(command.args[3]).toLowerCase() === "#ffff00");
    if (player.length !== 1) throw Error(`Frame ${frame}: expected one #ffff00 player circle, found ${player.length}.`);
    const x = Number(player[0].args[0]);
    const y = Number(player[0].args[1]);
    const text = commands.filter(command => command.type === "text").map(command => command.args[0]);
    const scores = text.filter(label => /^Score: /i.test(String(label)));
    const won = text.includes("You win!");
    const whiteCircles = commands.filter(command => command.type === "circle" && String(command.args[3]).toLowerCase() === "#ffffff");
    const starVisible = whiteCircles.some(command => command.args[0] === 180 && command.args[1] === 140 && command.args[2] === 5);

    if (frame === 0 || frame >= 58) {
      const mismatches: string[] = [];
      if (x !== 60 || y !== 140) mismatches.push(`player at (${x}, ${y}), expected (60, 140)`);
      if (!starVisible) {
        const drawn = whiteCircles.slice(0, 3).map(({args}) => `(${args[0]}, ${args[1]}, radius ${args[2]})`).join(", ");
        mismatches.push(`expected #ffffff star at (180, 140, radius 5), found ${drawn || "no white circle"}`);
      }
      if (scores.length !== 1 || scores[0] !== "Score: 0") {
        mismatches.push(`expected one exact "Score: 0" label, drew ${JSON.stringify(text.slice(0, 4).map(label => String(label).slice(0, 70)))}`);
      }
      if (won) mismatches.push('unexpected "You win!" label');
      if (mismatches.length) throw Error(`${frame === 0 ? "Starting frame" : "Space restart"} (frame ${frame}): ${mismatches.join("; ")}.`);
    }
    if (frame >= 1 && frame <= 16) {
      const keys = starCollectorKeys(frame);
      if ((keys.ArrowRight && !(x > previousX && y === previousY))
          || (keys.ArrowDown && !(y > previousY && x === previousX))
          || (keys.ArrowLeft && !(x < previousX && y === previousY))
          || (keys.ArrowUp && !(y < previousY && x === previousX))) throw Error("Arrow key movement is incorrect.");
      if (scores.length !== 1 || scores[0] !== "Score: 0" || won || !starVisible) throw Error("Score and star must stay unchanged before collection.");
    }
    if (frame >= 17 && frame <= 57) {
      if (frame <= 56 && !alreadyWon && (!(x > previousX) || x - previousX > 7 || y !== previousY)) {
        throw Error("Right must move the player toward the star at the requested speed.");
      }
      const closeToStar = Math.hypot(x - 180, y - 140) <= 15 || Math.hypot(previousX - 180, previousY - 140) <= 15;
      if (scores.length !== 1 || scores[0] !== (won ? "Score: 1" : "Score: 0") || won === starVisible) {
        throw Error("Collecting the star must remove it and show score one and the win message.");
      }
      if (won && !closeToStar && !alreadyWon) throw Error("The game awarded a win before the player touched the star.");
      if (!won && (alreadyWon || frame >= 56)) throw Error("Moving onto the star must win, and the win must persist until restart.");
      alreadyWon = won;
    }
    previousX = x;
    previousY = y;
  };
}
