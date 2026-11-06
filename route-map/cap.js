// usage: node cap.js startFrame endFrame outPrefix [dpr]
const {chromium}=require('playwright'); const {spawn}=require('child_process');
const [s,e,out,dprArg]=process.argv.slice(2); const S=+s,E=+e,FPS=30,DPR=+(dprArg||2);
(async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:DPR});
 p.on('pageerror',x=>console.log('ERR',x.message));
 await p.goto('http://localhost:8765/index.html?capture'); await p.waitForFunction(()=>window.ready,{timeout:180000});
 await p.evaluate(()=>renderAt(0));
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-vf',`scale=${1920*DPR}:${1080*DPR}`,out],{stdio:['pipe','inherit','inherit']});
 const t0=Date.now();
 for(let f=S;f<E;f++){ await p.evaluate(t=>renderAt(t),f/FPS); const buf=await p.screenshot({type:'jpeg',quality:95});
   if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
   if((f-S)%60===0||f===E-1) console.log(out,f,((Date.now()-t0)/(f-S+1)).toFixed(0),'ms/frame'); }
 ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close(); console.log('done',out);
})();
