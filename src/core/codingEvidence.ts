import {validateRunEvidence,type CodeGame,type CodeGamesState,type GameRunReport,type GameRunEvidence} from './codeGames';
export const CODING_CHECKS={movement:'Keyboard movement',state:'State persists between frames',scoring:'Score updates correctly',restart:'Restart resets correctly',powerups:'Power-up timing and effects'};
export type CodingCheck=keyof typeof CODING_CHECKS;
export interface CodingEvidence{criterion:CodingCheck;result:'demonstrated'|'needs-work';observation:string;game:{id:string;title:string;version:number;createdAt:string};report:GameRunEvidence&{id:string;outcome:'worked'|'needs-fix';notes:string}}
export const ASSESSMENT_LIMIT=50;
export function codingSources(state:CodeGamesState):{game:CodeGame;report:GameRunReport}[]{
 return state.reports.filter(r=>!r.checkKind&&r.outcome!=='not-reviewed'&&r.frames>0).flatMap(report=>{const game=state.games.find(g=>g.code===report.code&&(!report.gameId||report.gameId===g.id));return game?[{game,report}]:[];});
}
export function validateCodingEvidence(value:unknown):CodingEvidence|undefined{
 const v=value as CodingEvidence;if(!v||typeof v!=='object'||!Object.prototype.hasOwnProperty.call(CODING_CHECKS,v.criterion)||!['demonstrated','needs-work'].includes(v.result)||typeof v.observation!=='string'||!v.observation.trim()||v.observation.length>1000||!v.game||typeof v.game.id!=='string'||!/^[-a-zA-Z0-9]{1,64}$/.test(v.game.id)||typeof v.game.title!=='string'||!v.game.title.trim()||v.game.title.length>120||!Number.isInteger(v.game.version)||v.game.version<1||v.game.version>10000||typeof v.game.createdAt!=='string'||!Number.isFinite(Date.parse(v.game.createdAt))||!v.report||typeof v.report.id!=='string'||!/^[-a-zA-Z0-9]{1,64}$/.test(v.report.id)||!['worked','needs-fix'].includes(v.report.outcome)||typeof v.report.notes!=='string'||v.report.notes.length>1500)return;
 const report=validateRunEvidence(v.report);if(!report||report.checkKind||report.frames<1)return;
 if(v.result==='demonstrated'&&(v.report.outcome!=='worked'||!['stopped','limit'].includes(report.reason)||v.criterion==='movement'&&!report.keysUsed.some(k=>k.startsWith('Arrow'))||v.criterion==='restart'&&!report.keysUsed.includes('Space')))return;
 return {criterion:v.criterion,result:v.result,observation:v.observation,game:{id:v.game.id,title:v.game.title,version:v.game.version,createdAt:v.game.createdAt},report:{...report,id:v.report.id,outcome:v.report.outcome,notes:v.report.notes}};
}
