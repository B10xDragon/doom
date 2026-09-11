import {World,WEAPONS,clamp} from './world.js';
import {Renderer} from './renderer.js';
import {Input} from './input.js';
import {Audio} from './audio.js';
import {SAVE_KEY,validSave,restoreEntry,checkpoint as makeCheckpoint,loadout} from './save.js';
const $=id=>document.getElementById(id),canvas=$('screen'),renderer=new Renderer(canvas),audio=new Audio();
const storage={get(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}};
let world=new World(),playing=false,last=0,hudTimer=0,previewTimer=0,runStart=null,checkpoint=storage.get(SAVE_KEY);
if(!validSave(checkpoint))checkpoint=null;
const prefs=storage.get('void-station-settings-v1');
if(prefs){for(const id of ['difficulty','quality','sensitivity'])if(prefs[id]!=null)$(id).value=prefs[id];for(const id of ['sound','motion'])if(prefs[id]!=null)$(id).checked=prefs[id];}
$('touch-setting').checked=!!window.matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1;
function savePrefs(){const p={};for(const id of ['difficulty','quality','sensitivity'])p[id]=$(id).value;for(const id of ['sound','motion'])p[id]=$(id).checked;storage.set('void-station-settings-v1',p);}
function resize(){const r=canvas.getBoundingClientRect();const width=Number($('quality').value)||640,ratio=r.height>0?r.width/r.height:16/9;const height=Math.round(clamp(width/ratio,240,800));if(renderer.w!==width||renderer.h!==height)renderer.resize(width,height);}
const input=new Input(canvas,{playing:()=>playing,pause:()=>pause(),map:()=>{world.mapOpen=!world.mapOpen;},cycle:()=>world.cycleWeapon(),weapon:n=>world.selectWeapon(n),message:text=>world.say(text)});
function applySettings(){audio.enabled=$('sound').checked;renderer.reduced=$('motion').checked;input.sensitivity=Number($('sensitivity').value)||1;document.body.classList.toggle('touch',$('touch-setting').checked);resize();savePrefs();}
for(const id of ['difficulty','quality','sensitivity','sound','motion','touch-setting'])$(id).addEventListener('change',applySettings);
window.addEventListener('resize',resize);new ResizeObserver(resize).observe($('viewport'));
function begin(index=0,data=null,difficulty=$('difficulty').value,entry=false){
  world=new World(index,difficulty,entry?null:data);if(entry&&data)restoreEntry(world,data);runStart=makeCheckpoint(world);
  // A checkpoint is at the entrance of each sector, not a mid-combat save.
  checkpoint=runStart;storage.set(SAVE_KEY,checkpoint);resume();
}
function resume(){applySettings();playing=true;world.mapOpen=false;input.clear();last=performance.now();$('menu').hidden=true;$('debrief').hidden=true;$('touch-controls').style.visibility='visible';$('objective').hidden=false;$('crosshair').hidden=false;audio.unlock();canvas.focus({preventScroll:true});input.capture();hud();}
function pause(){if(!playing)return;playing=false;input.clear();document.exitPointerLock?.();$('menu').hidden=false;$('resume').hidden=world.state!=='playing';$('start').textContent='NEW CAMPAIGN';$('continue').hidden=true;$('touch-controls').style.visibility='hidden';$('crosshair').hidden=true;$('menu-status').textContent='Paused. Change settings or resume your run.';$('resume').focus();}
function menu(){playing=false;input.clear();document.exitPointerLock?.();$('debrief').hidden=true;$('menu').hidden=false;$('resume').hidden=true;$('continue').hidden=!checkpoint;$('touch-controls').style.visibility='hidden';$('crosshair').hidden=true;$('menu-status').textContent='Progress saves at the start of each sector, on this device.';}
function hud(){const p=world.player,w=WEAPONS[p.weapon];$('health').textContent=Math.ceil(p.health);$('shield').textContent=Math.ceil(p.shield);$('health-bar').style.width=p.health+'%';$('shield-bar').style.width=p.shield+'%';$('health-bar').style.background=p.health<30?'#ff9a7f':'#8df8ce';$('weapon-name').textContent='0'+(p.weapon+1)+' / '+w.name;$('ammo').textContent=w.ammo?p[w.ammo]:'∞';$('blue-key').classList.toggle('active',p.keys.blue);$('red-key').classList.toggle('active',p.keys.red);$('relays').textContent='RELAYS '+world.relayCount+'/2';$('level-number').textContent='0'+(world.level.index+1);$('level-name').textContent=world.level.config.name;$('sector').textContent='SECTOR 0'+(world.level.index+1)+' / '+world.level.config.name;$('objective').textContent=world.objective();$('notice').textContent=world.messageTime>0?world.message:'';$('prompt').textContent=playing?world.prompt():'';}
function debrief(){
  playing=false;input.clear();document.exitPointerLock?.();$('debrief').hidden=false;$('menu').hidden=true;$('crosshair').hidden=true;$('touch-controls').style.visibility='hidden';
  const dead=world.state==='dead',win=!dead&&world.level.index===2;
  $('result-kicker').textContent=dead?'SUIT OFFLINE':win?'TRANSMISSION RECEIVED':'SECTOR SECURED';
  $('result-title').textContent=dead?'Signal interrupted.':win?'You brought the station back.':'Airlock reached.';
  $('result-body').textContent=dead?'Restart this sector with your entrance loadout.':win?'The evacuation shuttle is online. The relay carries your signal home.':'Supplies replenished. The next sector is waiting.';
  const mins=Math.floor(world.time/60),secs=Math.floor(world.time%60).toString().padStart(2,'0');
  $('stats').innerHTML='<div>ROBOTS DISABLED<br><strong>'+world.kills+' / '+world.level.enemies.length+'</strong></div><div>SECRETS<br><strong>'+world.secrets+' / 1</strong></div><div>TIME<br><strong>'+mins+':'+secs+'</strong></div>';
  $('next').textContent=dead?'RETRY SECTOR →':win?'PLAY AGAIN →':'NEXT SECTOR →';$('next').focus();
  if(!dead&&!win){checkpoint={version:1,index:world.level.index+1,difficulty:world.difficulty,entry:false,carry:loadout(world.player)};storage.set(SAVE_KEY,checkpoint);}
  if(win){checkpoint=null;storage.set(SAVE_KEY,null);}
}
$('start').onclick=()=>{audio.unlock();begin();};$('resume').onclick=resume;$('pause').onclick=()=>playing?pause():world.state==='playing'&&$('debrief').hidden?resume():menu();$('map').onclick=()=>{if(playing)world.mapOpen=!world.mapOpen;};
$('continue').onclick=()=>{if(checkpoint)begin(checkpoint.index,checkpoint.carry,checkpoint.difficulty,checkpoint.entry);};
$('next').onclick=()=>{if(world.state==='dead'){const r=runStart;begin(r.index,r.carry,r.difficulty,true);}else if(world.level.index<2)begin(world.level.index+1,loadout(world.player),world.difficulty);else begin();};
$('result-menu').onclick=menu;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();return;}if(!$('shell').requestFullscreen){$('menu-status').textContent='Fullscreen is not available here. Rotate to landscape for a larger view.';return;}await $('shell').requestFullscreen();}catch{$('menu-status').textContent='Fullscreen is unavailable in this browser. Landscape mode still works.';}};
function frame(now){
  const dt=Math.min((now-last)/1000||0,.04);last=now;
  if(playing){world.update(dt,input.poll());audio.tick(dt,true);for(const e of world.events.splice(0))audio.effect(e);if(world.state!=='playing')debrief();renderer.render(world);}
  else{previewTimer+=dt;if(previewTimer>.09){renderer.render(world);previewTimer=0;}}
  hudTimer+=dt;if(hudTimer>.08){hud();hudTimer=0;}requestAnimationFrame(frame);
}
applySettings();menu();hud();requestAnimationFrame(frame);
if(document.modelContext?.registerTool){
  try{Promise.resolve(document.modelContext.registerTool({name:'get_mission_status',description:'Read the current Void Station sector, objective, equipment, health and pause state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:(args={})=>{if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).length)throw new Error('This tool takes no parameters.');return {sector:world.level.index+1,name:world.level.config.name,objective:world.objective(),state:world.state,paused:!playing,health:Math.ceil(world.player.health),shield:Math.ceil(world.player.shield),weapon:WEAPONS[world.player.weapon].name,relays:world.relayCount};}})).catch(()=>{});}catch{/* Unsupported registrations do not affect gameplay. */}
}
