export default function StudioIcon({name}:{name:'play'|'trash'|'check'}){
 return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {name==='play'?<path d="m8 5 11 7-11 7Z"/>:name==='check'?<path d="m5 12 4 4L19 6"/>:<><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>}
 </svg>;
}
