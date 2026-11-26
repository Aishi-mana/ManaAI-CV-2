/** Keep keyboard navigation inside an open dialog without changing normal tab order. */
export function keepDialogFocus(event:{key:string;shiftKey:boolean;currentTarget:HTMLElement;preventDefault:()=>void}){
 if(event.key!=='Tab')return;
 const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]')]
  .filter(control=>control.tabIndex>=0&&control.getClientRects().length>0);
 const first=controls[0],last=controls[controls.length-1];
 if(!first){event.preventDefault();return;}
 const active=event.currentTarget.ownerDocument.activeElement;
 if(!controls.includes(active as HTMLElement)||event.shiftKey&&active===first||!event.shiftKey&&active===last){
  event.preventDefault();(event.shiftKey?last:first).focus({preventScroll:true});
 }
}
