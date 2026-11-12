export const PORTRAIT_REACTIONS = {
  headpat: {label: 'Headpat', action: 'gives a headpat', reply: 'Hehe, that feels nice.', emotion: 'happy'},
  boop: {label: 'Boop', action: 'boops her nose', reply: 'Eep! You got my nose!', emotion: 'surprised'},
  hug: {label: 'Hug', action: 'gives a hug', reply: 'Mmm. That’s a nice hug.', emotion: 'gentle'},
  handhold: {label: 'Hold hand', action: 'holds her hand', reply: 'Your hand is warm.', emotion: 'happy'},
  surprise: {label: 'Surprise', action: 'double-clicks her portrait', reply: 'Oh! You surprised me.', emotion: 'embarrassed'},
} as const;

export type PortraitInteraction = keyof typeof PORTRAIT_REACTIONS;
export const PORTRAIT_ACTIONS = ['headpat', 'boop', 'hug', 'handhold'] as const;

export const PORTRAIT_MILESTONES = {
  headpat: {id: 'first_headpat', title: 'First headpat'},
  boop: {id: 'first_boop', title: 'First boop'},
  hug: {id: 'first_hug', title: 'First hug'},
  handhold: {id: 'first_handhold', title: 'First time holding hands'},
} as const;

// Percentages of the shared avatar canvas. Hands sit outside the torso target.
export const PORTRAIT_ZONES = [
  {id: 'headpat', left: 35, top: 5, width: 30, height: 11.5},
  {id: 'boop', left: 37, top: 16.5, width: 26, height: 11},
  {id: 'hug', left: 36, top: 30, width: 28, height: 23},
  {id: 'handhold', left: 26, top: 51.5, width: 8.5, height: 9},
  {id: 'handhold', left: 65.5, top: 51.5, width: 8.5, height: 9},
] as const;
