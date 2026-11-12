import type { SandboxFrameResult } from "./codeSandbox";

export const STAR_COLLECTOR_MARKER = "// Mana check: Star Collector";
export const STAR_COLLECTOR_FRAMES = 60;
export const STAR_COLLECTOR_REQUEST = `Build a playable Star Collector game in the canvas.
Start the player at (60,140) and put one star at (180,140). Move with all four arrow keys using dt, at 150 to 200 pixels per second. Keep the player on the canvas. Score starts at zero. Touching the star removes it, scores exactly one point and wins. Space restarts from the original position with score zero and the star restored.
The app checks visible draw commands. Draw exactly one yellow player circle with api.circle(x,y,10,"#ffff00"). Draw the star as a white circle with api.circle(180,140,5,"#ffffff") while available. Draw the score as its own api.text("Score: " + score,...). When won, draw a separate api.text("You win!",...). Draw brief control instructions. Keep all gameplay in the single JavaScript file.`;

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
    if (player.length !== 1) throw Error("Draw exactly one yellow player circle.");
    const x = Number(player[0].args[0]);
    const y = Number(player[0].args[1]);
    const text = commands.filter(command => command.type === "text").map(command => command.args[0]);
    const scores = text.filter(label => /^Score: /i.test(String(label)));
    const won = text.includes("You win!");
    const starVisible = commands.some(command => command.type === "circle" && command.args[0] === 180 &&
      command.args[1] === 140 && command.args[2] === 5 && String(command.args[3]).toLowerCase() === "#ffffff");

    if (frame === 0 || frame >= 58) {
      if (x !== 60 || y !== 140 || scores.length !== 1 || scores[0] !== "Score: 0" || won || !starVisible) {
        throw Error(frame === 0 ? "Start with the player, star and score in their starting states." : "Space must reset the player, star, score and win state.");
      }
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
