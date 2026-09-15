// Export the final frame artwork from the same React source used by Remotion.
const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');
const {createElement}=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const source=fs.readFileSync(path.join(__dirname,'src/Composition.tsx'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const temporary=path.join(__dirname,'.poster-source.cjs');
try{fs.writeFileSync(temporary,compiled);const {OverviewArtwork}=require(temporary);const svg=renderToStaticMarkup(createElement(OverviewArtwork,{frame:239,fps:30}));fs.writeFileSync(path.join(__dirname,'../../public/analysis/experiment-overview.svg'),svg);console.log('Exported vector final frame from Remotion artwork.');}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
