export default function StudioIcon({name}:{name:'play'|'pause'|'stop'|'restart'|'remove'|'mute'|'sound'|'edit'|'check'|'trash'}){
 const paths={play:'M8 5v14l11-7z',pause:'M8 5v14M16 5v14',stop:'M6 6h12v12H6z',restart:'M5 9a8 8 0 1 1-1 7M5 3v6h6',remove:'M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7',mute:'M4 9v6h4l5 4V5L8 9zM17 9l4 6M21 9l-4 6',sound:'M4 9v6h4l5 4V5L8 9zM17 8a6 6 0 0 1 0 8'};
 const extra={edit:'M4 16l12-12 4 4-12 12H4zM13 7l4 4',check:'M5 12l4 4L19 6',trash:paths.remove};
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={name in extra?extra[name as keyof typeof extra]:paths[name as keyof typeof paths]}/></svg>;
}
