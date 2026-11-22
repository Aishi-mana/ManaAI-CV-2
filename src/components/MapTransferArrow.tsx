import type {StreetPoint} from '../core/manaverseStreet';

export default function MapTransferArrow({point,direction,label,onClick,disabled}:{
 point:StreetPoint;direction:'left'|'right'|'down'|'up-left'|'down-left'|'down-right';label:string;onClick?:()=>void;disabled?:boolean;
}){
 return <button className="btn map-transfer-arrow" type="button" aria-label={label}
  data-direction={direction} style={{left:`${point.x}%`,top:`${point.y}%`}} onClick={onClick} disabled={disabled}>
  <svg viewBox="0 0 24 24" aria-hidden="true">
   <path d="M4 12h15m-6-6 6 6-6 6"/>
  </svg>
 </button>;
}
