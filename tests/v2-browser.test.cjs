/* Real Chromium: V1 -> V2 service-worker upgrade, offline, touch layouts, JSON files. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'), path=require('node:path'), http=require('node:http'), cp=require('node:child_process'), assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'), baseline=process.env.V1_REF||'f4e82ebf5670f323a6bf7196e3b417f687ee9965';
const gitDir=process.env.V1_GIT_DIR||path.join(dir,'work/github-v1/.git');
let release=1, checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
const baselineFiles=new Map(cp.execFileSync('git',[`--git-dir=${gitDir}`,'ls-tree','-r','--name-only',baseline],{encoding:'utf8'}).trim().split('\n').map(f=>[f,cp.execFileSync('git',[`--git-dir=${gitDir}`,'show',`${baseline}:${f}`]) ]));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0]).replace(/^\/Mathe-Abenteuer-Fino\//,'')||'index.html';
 if(name.includes('..') || name.startsWith('/')){res.writeHead(404).end();return;}
 const file=path.join(dir,name),data=release===1?baselineFiles.get(name):fs.existsSync(file)&&fs.statSync(file).isFile()?fs.readFileSync(file):null;
 if(!data){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/Mathe-Abenteuer-Fino/`;
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}),context=await browser.newContext({viewport:{width:768,height:1024},hasTouch:true,isMobile:true,acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 const fixture=fs.readFileSync(path.join(dir,'tests/fixtures/v1-realistic.json'),'utf8');
 await page.addInitScript(value=>{if(!localStorage.getItem('funkelpfad-v1'))localStorage.setItem('funkelpfad-v1',value);},fixture);
 await page.goto(url);await page.getByText('Bereit für dein Offline-Abenteuer',{exact:false}).waitFor();
 await page.reload();await page.getByText('Bereit für dein Offline-Abenteuer',{exact:false}).waitFor();
 await page.locator('[data-action=continue]').click();await page.locator('[data-action=map]').click();
 const before=await page.evaluate(()=>localStorage.getItem('funkelpfad-v1'));
 release=2;
 await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});
 await page.locator('#update-app').waitFor({timeout:15000});await page.locator('#update-app').click();
 await page.locator('[data-area=tables]').waitFor();
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('funkelpfad-v2')));
 let s=await saved();check(s.version===2,'V2 loaded');check(s.points===JSON.parse(before).points,'points survive update');check(JSON.stringify(s.completed)===JSON.stringify(JSON.parse(before).completed),'levels survive');check(await page.evaluate(()=>localStorage.getItem('funkelpfad-v1-backup-before-v2'))===before,'exact migration backup');
 const cacheKeys=await page.evaluate(()=>caches.keys());check(cacheKeys.some(k=>k.endsWith('v2.0.0'))&&!cacheKeys.some(k=>k.endsWith('v1.0.3')),'cache upgraded');
 async function parents(){await page.locator('#parent').click();await page.locator('#gate-answer').fill('56');await page.locator('#gate-form button').click();}
 await parents();await page.locator('[name=theme]').selectOption('dark');await page.locator('[name=tempo]').selectOption('off');await page.locator('#settings-form button[type=submit]').click();
 check(await page.locator('html').getAttribute('data-theme')==='dark','dark immediate');await page.reload();check(await page.locator('html').getAttribute('data-theme')==='dark','dark reload');
 await page.locator('[data-area=tables]').click();await page.locator('[data-select-tables=none]').click();await page.locator('[name=tables][value="8"]').check();await page.locator('[name=layout]').selectOption('rows');await page.locator('[name=row]').selectOption('8');await page.locator('[name=rowOp]').selectOption('div');await page.locator('[name=tempo]').selectOption('stopwatch');await page.locator('[data-action=training-start]').click();await page.locator('[data-action=training-replace]').click();
 check(await page.locator('.row-task').count()===10,'ten row inputs');check(await page.locator('#row-0').getAttribute('inputmode')==='numeric','native numeric input');
 const shots=process.env.SCREENSHOT_DIR;if(shots)fs.mkdirSync(shots,{recursive:true});
 for(const [width,height] of [[768,1024],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'rows fit '+width);
  const rect=await page.locator('#row-0').boundingBox();check(rect.height>=48&&rect.width>=44,'input touch size');
  if(shots)await page.screenshot({path:path.join(shots,`v2-reihe-dunkel-${width}.png`),fullPage:true});
 }
 await page.locator('#row-0').fill('99');await page.locator('[data-row-form="0"] button').click();check(await page.locator('#row-0').getAttribute('aria-invalid')==='true','correction');await page.locator('#row-0').fill('1');await page.locator('#row-0').press('Enter');check(await page.evaluate(()=>document.activeElement.id)==='row-1','native focus advances synchronously');
 await page.reload();await page.locator('[data-action=continue]').click();check(await page.locator('#row-0').inputValue()==='1','row reload');
 await context.setOffline(true);
 for(let i=1;i<10;i++){await page.locator('#row-'+i).fill(String(i+1));await page.locator('#row-'+i).press('Enter');}
 check(await page.locator('.result').textContent().then(t=>t.includes('10 Aufgaben gelöst')),'offline row result');check((await saved()).training.last.correct===10,'row score');
 await page.reload();await page.getByText('Bereit für dein Offline-Abenteuer',{exact:false}).waitFor();await page.locator('[data-area=tables]').click();check(await page.locator('#training-form').isVisible(),'offline new view');
 await parents();const pending=page.waitForEvent('download');await page.locator('[data-action=export]').click();const download=await pending;
 const file=path.join(dir,'work/browser-export.json');await download.saveAs(file);const exported=JSON.parse(fs.readFileSync(file,'utf8'));check(exported.state.points===(await saved()).points,'real JSON download');
 await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await page.getByText('Import abgebrochen:',{exact:false}).waitFor();check(!(await page.locator('#dialog').evaluate(e=>e.open)),'invalid import stays closed');
 exported.state.points=3210;await page.locator('#import-file').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await page.locator('[data-action=import-confirm]').click();check((await saved()).points===3210,'real file import');check(await page.evaluate(()=>!!localStorage.getItem('funkelpfad-backup-before-import')),'pre-import backup');
 await context.setOffline(false);await page.locator('[name=theme]').selectOption('light');await page.locator('[name=tempo]').selectOption('countdown');await page.locator('[name=duration]').selectOption('60');await page.locator('#settings-form button[type=submit]').click();await page.locator('[data-area=tables]').click();await page.locator('[data-action=training-start]').click();
 await page.clock.runFor(61000);check(await page.locator('.result').isVisible(),'real countdown expiry');check((await saved()).session===null,'countdown stops');await page.clock.resume();
 await page.locator('[data-area=arithmetic]').click();
 if(shots) await page.screenshot({path:path.join(shots,'v2-start-hell.png'),fullPage:true});
 check(errors.length===0,errors.join('\n'));await browser.close();server.close();console.log(`PASS: ${checks} Chromium V2 checks: V1 PWA update, migration, exact backup, offline training/reload, iPad portrait/landscape sizes, native input/focus, dark reload, real export/import and countdown.`);
})().catch(e=>{console.error(e);server.close();process.exit(1);});
