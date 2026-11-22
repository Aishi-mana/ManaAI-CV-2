const fs=require('fs'),ts=require('typescript'),vm=require('vm'),exportsForCleaner={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/core/generatedAccessories.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsForCleaner,Uint8ClampedArray});
const [file,w,h]=process.argv.slice(2);
const result=exportsForCleaner.cleanAccessory(new Uint8ClampedArray(fs.readFileSync(file)),+w,+h);
fs.writeFileSync(file,result.data);
console.log(JSON.stringify(result.bounds));
