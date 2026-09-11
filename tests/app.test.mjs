import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('all HTML assets and module imports resolve under a GitHub Pages subpath',()=>{
  const html=readFileSync(resolve(root,'index.html'),'utf8');
  for(const [,raw]of html.matchAll(/(?:src|href)="([^"]+)"/g)){const url=raw.split('?')[0];if(url==='./')continue;assert.ok(!url.startsWith('/'));assert.ok(existsSync(resolve(root,url)),url);}
  for(const name of ['main','renderer','world','art','levels','input','audio','save']){
    const source=readFileSync(resolve(root,'src',name+'.js'),'utf8');for(const [,raw]of source.matchAll(/from ['"]([^'"]+)['"]/g)){const path=raw.split('?')[0];assert.ok(existsSync(resolve(root,'src',path)),path);}
  }
});

test('application starts, pauses, resumes and restarts with unavailable storage/audio/capture',async()=>{
  const nodes=new Map(),frames=[];
  class Node {
    constructor(id=''){this.id=id;this.width=64;this.height=96;this.value='';this.checked=false;this.hidden=false;this.style={};this.events={};this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c),contains:c=>this.classes.has(c)};}
    addEventListener(k,f){(this.events[k]??=[]).push(f);}focus(){}setPointerCapture(){}matches(){return false;}
    getBoundingClientRect(){return {left:0,top:0,width:640,height:360};}
    getContext(){const c=this;return new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Node(id));return nodes.get(id);};
  let statusTool;
  const doc=new Node();doc.modelContext={registerTool:t=>{statusTool=t;}};doc.getElementById=get;doc.createElement=()=>new Node();doc.body=new Node();doc.exitPointerLock=()=>{};doc.hidden=false;
  globalThis.document=doc;const win=new Node();win.matchMedia=()=>({matches:true});globalThis.window=win;
  Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:5},configurable:true});
  globalThis.localStorage={getItem(){throw Error('storage unavailable');},setItem(){throw Error('storage unavailable');}};
  globalThis.ResizeObserver=class{observe(){}};globalThis.requestAnimationFrame=f=>frames.push(f);
  get('difficulty').value='standard';get('quality').value='480';get('sensitivity').value='1';get('sound').checked=true;
  await import('../src/main.js');
  assert.equal(statusTool.name,'get_mission_status');assert.equal(statusTool.execute().paused,true);assert.throws(()=>statusTool.execute({bad:true}));
  assert.equal(get('menu').hidden,false);assert.equal(get('continue').hidden,true);
  get('start').onclick();assert.equal(get('menu').hidden,true);assert.equal(get('health').textContent,100);assert.ok(doc.body.classList.contains('touch'));
  assert.equal(statusTool.execute().paused,false);
  let now=performance.now();for(let i=0;i<5;i++){now+=16;frames.shift()(now);}
  get('pause').onclick();assert.equal(get('menu').hidden,false);assert.equal(get('resume').hidden,false);
  get('resume').onclick();assert.equal(get('menu').hidden,true);get('map').onclick();frames.shift()(now+16);
  get('pause').onclick();get('start').onclick();assert.equal(get('health').textContent,100);assert.equal(get('level-number').textContent,'01');
});
