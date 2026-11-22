import {journalClock} from './clock';

export type PondSketchGoal={
 status:'invited'|'deferred'|'finished';
 updatedAt:string;
};

export function validatePondSketch(value:unknown):PondSketchGoal|undefined{
 if(!value||typeof value!=='object'||!('status' in value)||!('updatedAt' in value))return;
 const {status,updatedAt}=value;
 if((status!=='invited'&&status!=='deferred'&&status!=='finished')||typeof updatedAt!=='string')return;
 const time=new Date(updatedAt);
 if(!Number.isFinite(time.getTime())||time.toISOString()!==updatedAt)return;
 return {status,updatedAt};
}

export function pondSketchDue(goal:PondSketchGoal|undefined,now:Date,timeZone:string){
 const {date,time}=journalClock(now,timeZone);
 if(time<'08:00'||time>='18:00'||goal?.status==='finished')return false;
 return goal?.status!=='deferred'||date>journalClock(new Date(goal.updatedAt),timeZone).date;
}
