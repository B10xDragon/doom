import test from 'node:test';
import assert from 'node:assert/strict';
import {World,solid,ray,visible,moveActor} from '../src/world.js';
import {buildLevel} from '../src/levels.js';

function reachable(level,from){
  const todo=[[Math.floor(from.x),Math.floor(from.y)]],seen=new Set();
  for(let i=0;i<todo.length;i++){const [x,y]=todo[i],id=x+','+y;if(seen.has(id)||solid(level,x+.5,y+.5))continue;seen.add(id);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])todo.push([x+dx,y+dy]);}return seen;
}
const has=(seen,p)=>seen.has(Math.floor(p.x)+','+Math.floor(p.y));
for(let i=0;i<10;i++){
  test('sector '+i+': every actor and pickup is on traversable floor',()=>{
    const l=buildLevel(i);for(const p of [l.spawn,l.exit,...l.items,...l.enemies,...l.props,...l.relays])assert.equal(solid(l,p.x,p.y),false,JSON.stringify(p));
    for(let j=0;j<l.size;j++){assert.ok(l.grid[0][j]);assert.ok(l.grid[l.size-1][j]);assert.ok(l.grid[j][0]);assert.ok(l.grid[j][l.size-1]);}
  });
  test('sector '+i+': blue, red, relays, exit, secret have a solvable progression',()=>{
    const l=buildLevel(i),blue=l.items.find(i=>i.kind==='blue'),red=l.items.find(i=>i.kind==='red');
    l.doors.filter(d=>!d.key&&!d.secret).forEach(d=>d.open=1);
    let seen=reachable(l,l.spawn);assert.ok(has(seen,blue));assert.ok(!has(seen,red));assert.ok(!has(seen,l.exit));
    l.doors.filter(d=>d.key==='blue').forEach(d=>d.open=1);seen=reachable(l,l.spawn);assert.ok(has(seen,red));assert.ok(!has(seen,l.exit));
    l.doors.filter(d=>d.key==='red').forEach(d=>d.open=1);seen=reachable(l,l.spawn);for(const r of l.relays)assert.ok(has(seen,r));assert.ok(has(seen,l.exit));
    l.doors.forEach(d=>d.open=1);seen=reachable(l,l.spawn);for(const item of l.items)assert.ok(has(seen,item));
  });
}
test('doors require the correct key and transition to traversable',()=>{
  const w=new World(),d=w.level.doors.find(d=>d.key==='blue');w.player.x=d.x-.65;w.player.y=d.y+.5;w.player.angle=0;
  w.use();assert.equal(d.target,0);assert.match(w.message,/Requires/);w.player.keys.blue=true;w.use();assert.equal(d.target,1);
  w.level.enemies=[];for(let i=0;i<150;i++)w.update(1/120);assert.ok(!solid(w.level,d.x+.5,d.y+.5));
});
test('walls block movement, sight, and rays',()=>{
  const l=buildLevel(),p={x:2.3,y:23.5};moveActor(l,p,-.4,0);assert.equal(p.x,2.3);
  const hit=ray(l,2.5,23.5,-1,0);assert.equal(hit.depth,.5);assert.equal(visible(l,{x:2.5,y:23.5},{x:.5,y:23.5}),false);
});
test('hitscan harms visible robots, never robots behind walls',()=>{
  const w=new World();w.player.x=3.5;w.player.y=24.5;w.player.angle=0;
  const e={kind:'drone',x:6.5,y:24.5,health:42,dead:false,hurt:0};w.level.enemies=[e];w.fire();assert.equal(e.health,20);
  w.cooldown=0;w.fire();assert.equal(e.dead,true);assert.equal(w.kills,1);
  e.dead=false;e.health=42;e.x=12.5;w.cooldown=0;w.fire();assert.equal(e.health,42);
});
test('energy ammo, pickup caps and fallback are correct',()=>{
  const w=new World();w.pickup({kind:'scatter',taken:false});assert.equal(w.player.weapon,1);assert.equal(w.player.owned[1],true);
  w.player.shells=0;w.fire();assert.equal(w.player.weapon,0);
  w.player.health=96;w.pickup({kind:'health'});assert.equal(w.player.health,100);
  w.player.shield=92;w.pickup({kind:'shield'});assert.equal(w.player.shield,100);
});
test('projectiles collide without tunnelling and shield absorbs damage',()=>{
  const w=new World();w.level.enemies=[];const p=w.player,shield=p.shield,health=p.health;
  w.projectiles=[{x:p.x-.6,y:p.y,dx:30,dy:0,friendly:false,damage:20,life:1}];w.update(.04);
  assert.ok(p.shield<shield);assert.ok(p.health<health);assert.equal(w.projectiles.length,0);
  const w2=new World();w2.level.enemies=[];w2.projectiles=[{x:2.2,y:24.5,dx:-30,dy:0,friendly:false,damage:20,life:1}];w2.update(.04);assert.equal(w2.projectiles.length,0);
});
test('exit requires relays and final-sector boss',()=>{
  const w=new World(9);w.player.x=w.level.exit.x;w.player.y=w.level.exit.y;w.use();assert.equal(w.state,'playing');
  w.level.relays.forEach(r=>r.on=true);w.use();assert.equal(w.state,'playing');assert.match(w.message,/Core Titan/);
  assert.ok(w.level.enemies.some(e=>e.kind==='boss'&&!e.dead));
  w.level.enemies.forEach(e=>e.dead=true);w.use();assert.equal(w.state,'complete');
});
test('sector carryover restores supplies and preserves recovered weapons',()=>{
  const w=new World(1,'standard',{health:30,shield:10,owned:[true,true,true],weapon:2,shells:5,cells:7});
  assert.equal(w.player.health,65);assert.equal(w.player.shield,35);assert.equal(w.player.shells,17);assert.equal(w.player.cells,42);assert.deepEqual(w.player.owned,[true,true,true]);assert.equal(w.player.keys.red,false);
});
test('diagonal movement is normalized; damage and physics stop after defeat',()=>{
  const a=new World(),b=new World();a.level.enemies=[];b.level.enemies=[];a.update(.04,{forward:1});b.update(.04,{forward:1,strafe:1});
  assert.ok(Math.abs(Math.hypot(a.player.x-6.5,a.player.y-26.5)-Math.hypot(b.player.x-6.5,b.player.y-26.5))<1e-8);
  a.damage(10000);assert.equal(a.state,'dead');const before={...a.player};a.update(.04,{forward:1,fire:true});assert.deepEqual(a.player,before);
});
