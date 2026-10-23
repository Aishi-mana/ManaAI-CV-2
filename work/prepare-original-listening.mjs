import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import path from 'node:path';
const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/originalSong.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
const prompt=exports.composeOriginalPrompt('A cozy, hopeful song about spending a quiet evening together.',{mood:'Warm and hopeful',instruments:'warm piano, fingerpicked guitar, soft strings',tempo:'92',structure:'intro, verse, chorus, verse, chorus, outro'});
const brief=exports.validateOriginalBrief({prompt,lyrics:'',style:'gentle-piano',instrumental:false,duration:15,seed:42});if(!brief)throw Error('Invalid test brief');
const output=path.resolve('exports/singing/original-direction-preview-2026-10-18');fs.mkdirSync(output,{recursive:true});if(fs.existsSync(path.join(output,'result.json')))throw Error('Existing preview result found; reuse it');
fs.writeFileSync(path.join(output,'request.json'),JSON.stringify({...brief,title:'A quiet evening together · direction preview',kind:'original',previewOnly:true,output,result:path.join(output,'result.json')},null,2));
