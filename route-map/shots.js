const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 p.on('console',m=>console.log('C:',m.text())); p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('http://localhost:8765/index.html?capture'); await p.waitForFunction(()=>window.ready,{timeout:120000});
 await p.evaluate(()=>renderAt(0)); const ts=process.argv.slice(2).map(Number);
 for(const t of ts){ const s=Date.now(); await p.evaluate(t=>renderAt(t),t); await p.screenshot({path:`shot_${t}.jpg`,quality:80,type:'jpeg'}); console.log(t,Date.now()-s,'ms'); }
 await b.close();})();
