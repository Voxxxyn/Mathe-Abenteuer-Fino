/* V2 DOM integration, with deterministic active time and isolated storage. */
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom'), fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..');let checks=0;
const check=(v,m)=>{assert.ok(v,m);checks++;};
const equal=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
function app(data={}) {
 const dom=new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'),{url:'http://localhost:8080',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 let now=0, interval, hidden=false, systemDark=false, colorListener;const errors=[], downloads=[];
 w.scrollTo=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.performance.now=()=>now;w.setInterval=f=>{interval=f;return 1;};Object.defineProperty(d,'hidden',{get:()=>hidden});
 w.matchMedia=()=>({get matches(){return systemDark;},addEventListener:(event,fn)=>{colorListener=fn;}});
 w.URL.createObjectURL=blob=>{downloads.push(blob.parts.join(''));return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.Blob=class{constructor(parts){this.parts=parts;}};w.HTMLAnchorElement.prototype.click=()=>{};
 for(const [k,v] of Object.entries(data))w.localStorage.setItem(k,v);
 w.addEventListener('error',e=>errors.push(e.message));for(const f of ['version.js','core.js','app.js'])w.eval(fs.readFileSync(path.join(dir,f),'utf8'));
 const click=s=>{const el=d.querySelector(s);assert.ok(el,'missing '+s);el.click();}, submit=s=>d.querySelector(s).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const saved=()=>JSON.parse(w.localStorage.getItem('funkelpfad-v2'));
 const parents=()=>{click('#parent');d.querySelector('#gate-answer').value='56';submit('#gate-form');};
 const advance=ms=>{now+=ms;interval();};
 const hide=flag=>{hidden=flag;d.dispatchEvent(new w.Event('visibilitychange'));};
 const solve=()=>{const q=saved().session.question;for(const n of String(q.answer))click(`[data-digit="${n}"]`);click('[data-action=submit]');};
 return {dom,w,d,errors,downloads,click,submit,saved,parents,advance,hide,solve,setSystemDark:value=>{systemDark=value;colorListener();}};
}
(async()=>{
 const legacy=fs.readFileSync(path.join(dir,'tests/fixtures/v1-realistic.json'),'utf8'), a=app({'funkelpfad-v1':legacy}), {d,w,click,submit,saved,parents,advance,hide,solve}=a;
 equal(saved().points,JSON.parse(legacy).points,'migration points');equal(w.localStorage.getItem('funkelpfad-v1-backup-before-v2'),legacy,'backup');
 parents();check(d.querySelector('#main').textContent.includes('Version 2.0.0'),'version visible');d.querySelector('[name=theme]').value='system';submit('#settings-form');a.setSystemDark(true);equal(d.documentElement.dataset.theme,'dark','system dark');a.setSystemDark(false);equal(d.documentElement.dataset.theme,'light','system light');d.querySelector('[name=theme]').value='dark';submit('#settings-form');equal(d.documentElement.dataset.theme,'dark','instant theme');
 click('[data-area=tables]');check(d.querySelector('#training-form'),'child switch');click('[data-select-tables=none]');d.querySelector('[name=tables][value="8"]').checked=true;
 d.querySelector('[name=layout]').value='rows';d.querySelector('[name=row]').value='8';d.querySelector('[name=rowOp]').value='div';d.querySelector('[name=tempo]').value='stopwatch';click('[data-action=training-start]');check(d.querySelector('#dialog').open,'old round prompt');click('[data-action=training-replace]');
 equal(d.querySelectorAll('.row-task').length,10,'all ten inputs');const input=d.querySelector('#row-0');equal(input.getAttribute('inputmode'),'numeric','native keyboard hint');equal(input.getAttribute('autocorrect'),'off','no autocorrect');check(!d.querySelector('.keypad'),'no keypad in rows');
 input.value='99';submit('[data-row-form="0"]');check(input.getAttribute('aria-invalid')==='true','error marking');input.value='1';advance(1500);submit('[data-row-form="0"]');equal(d.activeElement.id,'row-1','focus advances');
 const points=saved().points;submit('[data-row-form="0"]');equal(saved().points,points,'duplicate row blocked');
 click('[data-action=map]');equal(d.querySelector('[data-area=arithmetic]').getAttribute('aria-pressed'),'true','map shows arithmetic');advance(100000);click('[data-action=continue]');equal(d.querySelector('[data-area=tables]').getAttribute('aria-pressed'),'true','resumed rows show tables');check(saved().session.timer.elapsed<2000,'navigation pause');equal(d.querySelector('#row-0').value,'1','completed row preserved');
 hide(true);advance(100000);hide(false);advance(1000);
 for(let i=1;i<10;i++){d.querySelector('#row-'+i).value=String(i+1);advance(1000);submit(`[data-row-form="${i}"]`);}
 check(d.querySelector('.result').textContent.includes('10 Aufgaben gelöst'),'row summary');equal(saved().training.last.correct,10,'row count');equal(saved().training.last.errors,1,'correction counted');check(saved().training.last.elapsed<15000,'hidden time excluded');equal(Object.keys(saved().training.records).length,0,'wrong excludes record');
 equal(saved().completed,JSON.parse(legacy).completed,'adventure retained');
 parents();d.querySelector('[name=mode]').value='keypad';submit('#settings-form');click('[data-action=export]');const payload=JSON.parse(a.downloads.at(-1));equal(payload.state,saved(),'full export');
 const f=d.querySelector('#import-file');Object.defineProperty(f,'files',{value:[{size:100,text:async()=>'{broken'}],configurable:true});f.dispatchEvent(new w.Event('change',{bubbles:true}));await new Promise(r=>setImmediate(r));check(d.querySelector('#save-status').textContent.includes('abgebrochen'),'invalid import rejected');
 const restored={...payload,state:{...payload.state,points:1234}};Object.defineProperty(f,'files',{value:[{size:1000,text:async()=>JSON.stringify(restored)}],configurable:true});f.dispatchEvent(new w.Event('change',{bubbles:true}));await new Promise(r=>setImmediate(r));check(d.querySelector('#dialog').open,'import confirmation');const previous=saved();click('[data-action=import-confirm]');equal(saved().points,1234,'import');equal(JSON.parse(w.localStorage.getItem('funkelpfad-backup-before-import')),previous,'import backup');
 const reload=app({'funkelpfad-v2':w.localStorage.getItem('funkelpfad-v2'),'funkelpfad-v1':legacy,'funkelpfad-v1-backup-before-v2':legacy});equal(reload.saved().points,1234,'reload');equal(reload.d.documentElement.dataset.theme,'dark','theme persists');reload.dom.window.close();
 click('[data-area=tables]');d.querySelector('[name=tempo]').value='countdown';d.querySelector('[name=duration]').value='60';click('[data-action=training-start]');solve();click('[data-action=next]');advance(60001);check(d.querySelector('.result'),'countdown result');equal(saved().session,null,'countdown closed');const p=saved().points;advance(60001);equal(saved().points,p,'timer no extra rewards');
 parents();d.querySelector('[name=area]').value='arithmetic';d.querySelector('[name=tempo]').value='stopwatch';d.querySelector('[name=length]').value='5';submit('#settings-form');click('[data-area=arithmetic]');click('[data-action=continue]');for(let i=0;i<5;i++){advance(1500);solve();if(i<4)click('[data-action=next]');}click('[data-action=result]');check(d.querySelector('.result').textContent.includes('5 Aufgaben gelöst'),'arithmetic stopwatch result');check(Object.keys(saved().training.records).length===1,'record saved');
 check(a.errors.length===0,a.errors.join('\n'));a.dom.window.close();
 const corrupt=app({'funkelpfad-v1':'broken'});corrupt.click('[data-action=continue]');equal(corrupt.w.localStorage.getItem('funkelpfad-v1'),'broken','malformed legacy untouched');equal(corrupt.w.localStorage.getItem('funkelpfad-v2'),null,'malformed never replaced');check(!corrupt.d.querySelector('#storage-warning').hidden,'warning visible');corrupt.dom.window.close();
 console.log(`PASS: ${checks} V2 UI checks: migration, child switch, native input attributes, focus, correction, row results, pause/navigation, hidden time, timers, records, dark reload, JSON export/import and corruption protection.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
