import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/input.js';

class Node {
  constructor(){this.events={};this.style={};this.captures=[];}
  addEventListener(k,f){(this.events[k]??=[]).push(f);}
  send(k,e={}){e={pointerId:1,clientX:0,clientY:0,preventDefault(){},...e};for(const f of this.events[k]??[])f(e);}
  setPointerCapture(id){this.captures.push(id);}
  getBoundingClientRect(){return {left:0,top:0,width:132,height:132};}
}
test('three simultaneous touch pointers can move, look, and fire independently',()=>{
  const nodes=new Map(),doc=new Node(),win=new Node();doc.getElementById=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
  globalThis.document=doc;globalThis.window=win;
  const input=new Input(new Node(),{playing:()=>true,pause(){},map(){},cycle(){},weapon(){},message(){}});
  nodes.get('stick').send('pointerdown',{pointerId:1,clientX:66,clientY:20});
  nodes.get('look-zone').send('pointerdown',{pointerId:2,clientX:300});nodes.get('look-zone').send('pointermove',{pointerId:2,clientX:350});
  nodes.get('touch-fire').send('pointerdown',{pointerId:3});let result=input.poll();assert.equal(result.forward,1);assert.ok(result.look>0);assert.equal(result.fire,true);
  doc.send('pointerup',{pointerId:3});result=input.poll();assert.equal(result.forward,1);assert.equal(result.fire,false);
  doc.send('pointercancel',{pointerId:1});result=input.poll();assert.equal(result.forward,0);
  nodes.get('touch-fire').send('pointerdown',{pointerId:4});input.clear();assert.equal(input.poll().fire,false);
});
