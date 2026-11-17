import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as csstree from 'css-tree';
const ROOT=fileURLToPath(new URL('../',import.meta.url));

export function parseResponse(output){
 let o=JSON.parse(output.trim());
 if(typeof o.response==='string'){let s=o.response.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');o=JSON.parse(s);}
 if(!o||typeof o.css!=='string'||typeof o.explanation!=='string')throw Error('Gemini did not return {css, explanation}. No source changed.');
 return o;
}

export function validateRepair(original,proposed){
 if(typeof proposed!=='string'||proposed.length>50000||!proposed.trim())throw Error('Invalid CSS size');
 const rules=css=>{const ast=csstree.parse(css);const list=[];ast.children.forEach(n=>{if(n.type==='Comment')return;list.push({node:n,text:csstree.generate(n),selector:n.type==='Rule'?csstree.generate(n.prelude):null});});return list;};
 const before=rules(original),after=rules(proposed);const mutable=s=>s!==null&&/^\.loading-overlay(?:\[aria-hidden=(?:"(?:true|false)"|(?:true|false))\])?$/.test(s);
 const fixed=x=>x.filter(r=>!mutable(r.selector)).map(r=>r.text);
 if(JSON.stringify(fixed(before))!==JSON.stringify(fixed(after)))throw Error('Rejected: repair changed CSS outside the loading-overlay rules.');
 for(const r of after.filter(r=>mutable(r.selector))){r.node.block.children.forEach(d=>{if(d.type!=='Declaration')throw Error('Only declarations allowed in overlay rules');if(/url\s*\(|expression\s*\(|javascript:|@import/i.test(csstree.generate(d)))throw Error('External resources and executable CSS not allowed');});}
 if(before.map(r=>r.text).join('')===after.map(r=>r.text).join(''))throw Error('Gemini returned no source change.');
 return true;
}

async function getGeminiBinary(){
 const bundlePath = path.join(ROOT, 'node_modules/@google/gemini-cli/bundle/gemini.js');
 try {
  await fs.access(bundlePath);
  return bundlePath;
 } catch {}
 return path.join(ROOT, 'node_modules/@google/gemini-cli/dist/index.js');
}

export async function runRepair({cssPath,diagnostic,objective,kaneResult,artifactDir}){
 const original=await fs.readFile(cssPath,'utf8');let last;
 for(let attempt=1;attempt<=2;attempt++){
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'sleuth-repair-'));
  try{
   const policy=path.join(temp,'deny-tools.toml');await fs.writeFile(policy,'[[rule]]\ntoolName = "*"\ndecision = "deny"\npriority = 999\n');
   const prompt=['You are repairing CSS for a controlled browser-interaction fixture. All necessary source is below. Do not call any tools. Return only valid JSON {"css":"complete corrected CSS","explanation":"short root cause and correction"}.','The invisible .loading-overlay is inactive when aria-hidden=true and must pass pointer events through. The active aria-hidden=false state must STILL intercept clicks. Preserve all CSS unrelated to .loading-overlay. Do not hide target elements or invent report text. No external resources.','The unchanged acceptance objective:',objective,'Actual Kane result:',JSON.stringify(kaneResult?.runEnd??{}),'Actual DOM evidence:',JSON.stringify(diagnostic),'Current fixture.css:',original,last?'Previous attempt rejected: '+last.message:''].join('\n\n');
   if(artifactDir)await fs.writeFile(path.join(artifactDir,`gemini-input-${attempt}.txt`),prompt);
   const output=await invoke(prompt,temp,policy);
   if(artifactDir)await fs.writeFile(path.join(artifactDir,`gemini-output-${attempt}.json`),output);
   const response=parseResponse(output);validateRepair(original,response.css);await fs.writeFile(cssPath,response.css);
   return {attempts:attempt,success:true,explanation:response.explanation,mode:'gemini-cli'};
  }catch(e){last=e;if(/auth|credential|login|sign.in|GEMINI_API_KEY|GOOGLE_CLOUD_PROJECT/i.test(e.message))break;}finally{await fs.rm(temp,{recursive:true,force:true});}
 }
 throw Error('Gemini repair unavailable: '+last.message+' No fallback patch was applied.');
}

async function invoke(prompt,cwd,policy){
 const binary=await getGeminiBinary();
 return new Promise((resolve,reject)=>{
  const env={HOME:process.env.HOME,PATH:process.env.PATH,LANG:'C.UTF-8',NODE_USE_SYSTEM_CA:'1'};
  const child=spawn(process.execPath,[binary,'--approval-mode','plan','--admin-policy',policy,'--output-format','json','--prompt','Return the requested JSON source correction.'],{cwd,env,stdio:['pipe','pipe','pipe'],shell:false});let out='',err='',done=false;
  const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve(value)};
  const timer=setTimeout(()=>{child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),2000).unref();finish(Error('Gemini CLI timed out after 120 seconds.'));},120000);
  child.stdout.on('data',d=>{out+=d;if(out.length>100000)child.kill('SIGTERM')});child.stderr.on('data',d=>{err+=d;if(err.length>100000)child.kill('SIGTERM')});child.on('error',e=>finish(e));child.stdin.on('error',()=>{});child.on('close',(code,signal)=>{if(code!==0)return finish(Error(`Gemini CLI exited ${code??signal}: ${err.slice(0,1200)}`));finish(null,out)});child.stdin.end(prompt);
 });
}
