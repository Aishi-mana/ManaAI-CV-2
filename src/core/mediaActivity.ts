// Shared synchronous gate: initiative must not begin while audio/microphone is occupied.
let occupied=false;
export const mediaOccupied=()=>occupied;
export const setMediaOccupied=(value:boolean)=>{occupied=value;};
