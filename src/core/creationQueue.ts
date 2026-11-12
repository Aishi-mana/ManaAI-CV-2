// Synchronous lease shared by all occasional wearable creation timers.
let occupied=false;
export function claimCreationQueue(){if(occupied)return false;occupied=true;return true;}
export function releaseCreationQueue(){occupied=false;}
