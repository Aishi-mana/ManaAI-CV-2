import {SHARED_LABELS} from './sharedActivities';
import type {SharedSession} from './sharedActivities';

export function activityText(session:SharedSession,name:string):string {
 const header=`${SHARED_LABELS[session.kind]} with ${name}\nStatus: ${session.status}\nStarted: ${session.createdAt}\nUpdated: ${session.updatedAt}\n\nPrompt\n${session.prompt}`;
 const turns=session.turns.map(turn=>`${turn.role==='user'?'You':name} (${turn.createdAt})\n${turn.text}`).join('\n\n');
 return `${header}\n\nSaved transcript\n${turns||'No saved turns yet.'}${session.result?`\n\nResult\n${session.result}`:''}\n`;
}
