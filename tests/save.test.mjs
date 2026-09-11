import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {checkpoint,validSave,restoreEntry,loadout} from '../src/save.js';
test('entrance checkpoint survives JSON roundtrip without gaining supplies',()=>{
  const w=new World(1,'relaxed',{health:30,shield:12,owned:[true,true,true],weapon:2,shells:2,cells:3});
  const save=JSON.parse(JSON.stringify(checkpoint(w)));assert.ok(validSave(save));const restored=new World(save.index,save.difficulty);restoreEntry(restored,save.carry);assert.deepEqual(loadout(restored.player),loadout(w.player));
});
test('malformed checkpoint input is rejected',()=>{
  for(const data of [null,{},[],{index:4},{...checkpoint(new World()),carry:{health:10}}, {...checkpoint(new World()),carry:{...loadout(new World().player),owned:['yes',false,false]}}])assert.equal(validSave(data),false);
});
