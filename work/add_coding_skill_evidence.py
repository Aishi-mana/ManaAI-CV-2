from pathlib import Path
p=Path('src/core/skills.ts');s=p.read_text(encoding='utf-8');s="import {validateCodingEvidence,CODING_CHECKS,ASSESSMENT_LIMIT,type CodingEvidence,type CodingCheck} from './codingEvidence';\nimport type {CodeGame,GameRunReport} from './codeGames';\n"+s;s=s.replace("kind:'work'|'activity'", "kind:'work'|'activity'|'game-report'").replace('source:PracticeSource}', 'source:PracticeSource;assessment?:CodingEvidence}')
s=s.replace("const ids=new Set<string>(),links=new Set<string>();", "const ids=new Set<string>(),links=new Set<string>();let assessments=0;")
s=s.replace("(s.kind!=='work'&&s.kind!=='activity')", "(s.kind!=='work'&&s.kind!=='activity'&&s.kind!=='game-report')")
s=s.replace('  const link=`${p.skill}:${s.kind}:${s.id}`;', "  const assessment=p.assessment===undefined?undefined:validateCodingEvidence(p.assessment);\n  if(s.kind==='game-report'&&(!assessment||p.skill!=='coding'||s.id!==assessment.report.id||assessments>=ASSESSMENT_LIMIT)||p.assessment!==undefined&&(!assessment||s.kind!=='game-report'))return [];\n  const link=`${p.skill}:${s.kind}:${s.id}${assessment?':'+assessment.criterion:''}`;")
s=s.replace('ids.add(p.id);links.add(link);','ids.add(p.id);links.add(link);if(assessment)assessments++;')
s=s.replace('createdAt:s.createdAt}}];', 'createdAt:s.createdAt},...(assessment?{assessment}:{})}];')
s=s.replace("entries.filter(p=>p.skill===skill).length", "entries.filter(p=>p.skill===skill&&!p.assessment).length")
s=s.replace("  return `\\nUSER-CONFIRMED", "  return `\\nUSER-CONFIRMED")
s=s.replace('Do not infer mastery, assign grades or claim autonomous practice.\\n`;', "Do not infer mastery, assign grades or claim autonomous practice.\\nUSER-REVIEWED CODING CHECKS (limited examples, not general proficiency): ${JSON.stringify(codingProgress(entries).latest.map(p=>({criterion:p.assessment!.criterion,result:p.assessment!.result,observation:p.assessment!.observation,game:p.assessment!.game.title,version:p.assessment!.game.version,reportId:p.assessment!.report.id,runReason:p.assessment!.report.reason})))}\\nThese are explicit user assessments of specific manual runs. Smoke checks alone never qualify. Do not claim mastery, independent verification, autonomous practice or improved model weights.\\n`;")
s+='''
export function confirmCodingCheck(entries:Practice[],game:CodeGame,report:GameRunReport,criterion:CodingCheck,result:CodingEvidence['result'],observation:string,now=new Date()):Practice[]{
 if(entries.length>=PRACTICE_LIMIT||entries.filter(p=>p.assessment).length>=ASSESSMENT_LIMIT)throw Error('Skill records are full. Delete a record first.');
 if(game.code!==report.code||report.gameId&&report.gameId!==game.id)throw Error('Choose a report for this exact saved source.');
 if(entries.some(p=>p.assessment?.report.id===report.id&&p.assessment.criterion===criterion))throw Error('This report already has a review for this check.');
 const assessment=validateCodingEvidence({criterion,result,observation:observation.trim(),game:{id:game.id,title:game.title,version:game.version,createdAt:game.createdAt},report:{...report}});
 if(!assessment)throw Error('Use a reviewed manual run and describe what you checked. Demonstrated results need a worked run ending normally; movement/restart need recorded arrow/Space input. Smoke checks do not qualify.');
 return validatePractice([...entries,{id:uid(),skill:'coding',notes:observation.trim(),confirmedAt:now.toISOString(),source:{id:report.id,kind:'game-report',title:game.title+' · v'+game.version,outcome:CODING_CHECKS[criterion]+': '+result+' (user-reviewed manual run)',createdAt:report.endedAt},assessment}]);
}
export function codingProgress(entries:Practice[]){
 const reviewed=entries.filter(p=>p.assessment),latest:Practice[]=[];
 for(const criterion of Object.keys(CODING_CHECKS)){
  const check=reviewed.filter(p=>p.assessment!.criterion===criterion).sort((a,b)=>b.confirmedAt.localeCompare(a.confirmedAt)||entries.indexOf(b)-entries.indexOf(a))[0];if(check)latest.push(check);
 }
 return {records:reviewed.length,latest,demonstrated:latest.filter(p=>p.assessment!.result==='demonstrated').length};
}
''';p.write_text(s,encoding='utf-8')
