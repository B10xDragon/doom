import {buildLevel} from './levels.js?v=2';
export const WEAPONS=[
  {name:'PULSE DRIVER',cooldown:.27,damage:22,pellets:1,spread:.018,ammo:null,color:'#8dffcf'},
  {name:'ARC SCATTER',cooldown:.72,damage:15,pellets:7,spread:.19,ammo:'shells',color:'#ffd387'},
  {name:'PLASMA LANCE',cooldown:.13,damage:27,pellets:1,spread:.025,ammo:'cells',color:'#8ac7ff'}
];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function solid(level,x,y) {
  const tx=Math.floor(x),ty=Math.floor(y),v=level.grid[ty]?.[tx]??1;
  if(v===0)return false;
  const d=level.doors.find(d=>d.x===tx&&d.y===ty);
  return !(d&&d.open>.85);
}
export function ray(level,x,y,dx,dy,max=40) {
  let mx=Math.floor(x),my=Math.floor(y);
  const deltaX=Math.abs(1/(dx||1e-12)),deltaY=Math.abs(1/(dy||1e-12));
  const sx=dx<0?-1:1,sy=dy<0?-1:1;
  let sideX=(dx<0?x-mx:mx+1-x)*deltaX,sideY=(dy<0?y-my:my+1-y)*deltaY,side=0,depth=0;
  for(let i=0;i<128;i++){
    if(sideX<sideY){depth=sideX;sideX+=deltaX;mx+=sx;side=0;}else{depth=sideY;sideY+=deltaY;my+=sy;side=1;}
    if(depth>max)break;
    if((level.grid[my]?.[mx]??1)!==0){
      const door=level.doors.find(d=>d.x===mx&&d.y===my);
      let u=side===0?y+depth*dy:x+depth*dx;u-=Math.floor(u);
      if((side===0&&dx>0)||(side===1&&dy<0))u=1-u;
      if(door&&(door.open>.985||u<door.open))continue;
      return {depth:Math.max(.01,depth),side,u,tile:level.grid[my]?.[mx]??1,door,mx,my};
    }
  }
  return {depth:max,side:0,u:0,tile:1,mx,my};
}
export function visible(level,a,b){const d=distance(a,b);return d<.001||ray(level,a.x,a.y,(b.x-a.x)/d,(b.y-a.y)/d,d+.1).depth>=d-.12;}
export function moveActor(level,actor,dx,dy,radius=.2){
  const free=(x,y)=>!solid(level,x-radius,y-radius)&&!solid(level,x+radius,y-radius)&&!solid(level,x-radius,y+radius)&&!solid(level,x+radius,y+radius);
  if(free(actor.x+dx,actor.y))actor.x+=dx;
  if(free(actor.x,actor.y+dy))actor.y+=dy;
}
export class World {
  constructor(index=0,difficulty='standard',carry=null){
    this.level=buildLevel(index);this.difficulty=difficulty;
    this.player={...this.level.spawn,health:100,shield:50,weapon:0,shells:14,cells:45,owned:[true,false,false],keys:{blue:false,red:false}};
    if(carry){this.player.health=clamp(carry.health+25,65,100);this.player.shield=clamp(carry.shield+20,35,100);this.player.owned=carry.owned.slice();this.player.weapon=carry.weapon;this.player.shells=carry.shells+12;this.player.cells=carry.cells+35;}
    this.time=0;this.cooldown=0;this.flash=0;this.damageFlash=0;this.shot=0;this.kills=0;this.secrets=0;this.projectiles=[];this.particles=[];this.events=[];this.state='playing';this.flow=null;this.flowTimer=0;this.bob=0;this.hitMarker=0;this.useHeld=false;this.message=this.level.config.final?'Reach the command core. Something enormous is waiting.':this.level.config.subtitle;this.messageTime=5;this.mapOpen=false;
  }
  say(text){this.message=text;this.messageTime=3.2;}
  emit(type){this.events.push(type);}
  get relayCount(){return this.level.relays.filter(r=>r.on).length;}
  objective(){if(!this.player.keys.blue)return 'FIND BLUE ACCESS / EXPLORE';if(!this.player.keys.red)return 'FIND RED ACCESS / SECURITY';if(this.relayCount<2)return 'RESTORE RELAYS / '+this.relayCount+' OF 2';if(this.level.enemies.some(e=>(e.kind==='warden'||e.kind==='boss')&&!e.dead))return this.level.config.final?'DEFEAT THE CORE TITAN':'DISABLE THE REACTOR WARDEN';return 'REACH EVACUATION / USE AIRLOCK';}
  interactTarget(){
    const p=this.player,candidates=[];
    for(const d of this.level.doors){const at={x:d.x+.5,y:d.y+.5};const a=Math.atan2(at.y-p.y,at.x-p.x)-p.angle;const dist=distance(p,at);if(dist<1.9&&Math.cos(a)>.3&&visible(this.level,p,{x:p.x+(at.x-p.x)*.55,y:p.y+(at.y-p.y)*.55}))candidates.push({type:'door',object:d,dist});}
    for(const r of this.level.relays)if(!r.on&&distance(p,r)<1.65&&visible(this.level,p,r))candidates.push({type:'relay',object:r,dist:distance(p,r)});
    if(distance(p,this.level.exit)<1.65&&visible(this.level,p,this.level.exit))candidates.push({type:'exit',object:this.level.exit,dist:distance(p,this.level.exit)});
    return candidates.sort((a,b)=>a.dist-b.dist)[0];
  }
  prompt(){const t=this.interactTarget();if(!t)return '';if(t.type==='relay')return 'USE · RESTORE RELAY';if(t.type==='exit')return 'USE · EVACUATION AIRLOCK';const d=t.object;if(d.secret&&!d.found)return 'USE · LOOSE WALL PANEL';return d.open>.85?'':d.key&&!this.player.keys[d.key]?'LOCKED · '+d.key.toUpperCase()+' ACCESS':'USE · OPEN DOOR';}
  use(){
    const t=this.interactTarget();if(!t)return;
    if(t.type==='door'){
      const d=t.object;
      if(d.key&&!this.player.keys[d.key]){this.say('Requires '+d.key.toUpperCase()+' access card.');this.emit('locked');return;}
      if(d.secret&&!d.found){d.found=true;this.secrets++;this.say('SECRET FOUND / Emergency supply cache.');this.emit('secret');}
      if(d.target===0){d.target=1;this.emit('door');}
    }else if(t.type==='relay'){t.object.on=true;this.say('RELAY ONLINE / '+this.relayCount+' of 2 restored.');this.emit('relay');}
    else if(this.relayCount<2){this.say('Restore both power relays before evacuation.');this.emit('locked');}
    else if(this.level.enemies.some(e=>(e.kind==='warden'||e.kind==='boss')&&!e.dead)){this.say(this.level.config.final?'Command core sealed. Bring down the Core Titan.':'Reactor locked down. Disable the Warden.');this.emit('locked');}
    else{this.state='complete';this.emit('complete');}
  }
  selectWeapon(n){if(!this.player.owned[n]){this.say('Weapon not recovered yet.');return;}this.player.weapon=n;this.emit('switch');}
  cycleWeapon(){for(let i=1;i<=3;i++){const n=(this.player.weapon+i)%3;if(this.player.owned[n]){this.selectWeapon(n);return;}}}
  damage(amount){
    const factor={relaxed:.5,standard:1,intense:1.4}[this.difficulty]||1;amount*=factor;
    const absorb=Math.min(this.player.shield,amount*.65);this.player.shield-=absorb;this.player.health=Math.max(0,this.player.health-(amount-absorb));this.damageFlash=.35;this.emit('hurt');
    if(this.player.health<=0){this.state='dead';this.emit('dead');}
  }
  sparks(x,y,color,count=10){for(let i=0;i<count;i++)this.particles.push({x,y,z:.45,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,vz:Math.random()*2,life:.3+Math.random()*.3,color});}
  hurtEnemy(e,amount){if(e.dead)return;e.health-=amount;e.hurt=.17;e.alert=true;this.hitMarker=.1;this.sparks(e.x,e.y,e.kind==='boss'?'#ff7d96':'#aefbff',e.kind==='boss'?8:4);if(e.kind==='boss'&&e.health<=e.maxHealth*.66&&e.phase===0){e.phase=1;e.cooldown=.2;this.say('CORE TITAN / PHASE TWO: OVERDRIVE');this.emit('bossphase');}if(e.kind==='boss'&&e.health<=e.maxHealth*.33&&e.phase===1){e.phase=2;e.cooldown=.2;this.say('CORE TITAN / PHASE THREE: MELTDOWN');this.emit('bossphase');}if(e.health<=0){e.dead=true;this.kills++;this.sparks(e.x,e.y,e.kind==='boss'?'#ff6d86':'#ffc575',e.kind==='boss'?55:20);this.say(e.kind==='boss'?'CORE TITAN DISABLED / EVACUATION UNLOCKED':'TARGET DISABLED');this.emit('destroy');}else this.emit('hit');}
  fire(){
    if(this.state!=='playing'||this.cooldown>0)return;
    const p=this.player,w=WEAPONS[p.weapon];
    if(w.ammo&&p[w.ammo]<=0){this.say('Out of energy. Switching to pulse driver.');p.weapon=0;this.cooldown=.15;this.emit('empty');return;}
    if(w.ammo)p[w.ammo]--;
    this.cooldown=w.cooldown;this.flash=.1;this.shot=.22;this.emit('fire'+p.weapon);
    for(const e of this.level.enemies)if(distance(e,p)<9)e.alert=true;
    for(let i=0;i<w.pellets;i++){
      let angle=p.angle+(Math.random()-.5)*w.spread;
      // Narrow horizontal aim assist matches the fixed-height retro presentation.
      if(w.pellets===1){let aim=null,nearest=Infinity;for(const e of this.level.enemies){if(e.dead)continue;const d=distance(p,e),a=Math.atan2(Math.sin(Math.atan2(e.y-p.y,e.x-p.x)-angle),Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-angle));if(Math.abs(a)<.06&&d<nearest&&visible(this.level,p,e)){aim=e;nearest=d;}}if(aim)angle=Math.atan2(aim.y-p.y,aim.x-p.x);}
      const dx=Math.cos(angle),dy=Math.sin(angle);
      if(p.weapon===2){this.projectiles.push({x:p.x+dx*.25,y:p.y+dy*.25,dx:dx*11,dy:dy*11,friendly:true,damage:w.damage,life:3,kind:'plasma'});continue;}
      const wall=ray(this.level,p.x,p.y,dx,dy,24);let hit=null,nearest=wall.depth;
      for(const e of this.level.enemies){if(e.dead)continue;const ex=e.x-p.x,ey=e.y-p.y,along=ex*dx+ey*dy,cross=Math.abs(ex*dy-ey*dx),radius=e.kind==='boss'?.58:e.kind==='warden'?.48:.3;if(along>0&&along<nearest&&cross<radius){hit=e;nearest=along;}}
      if(hit)this.hurtEnemy(hit,w.damage);else this.sparks(p.x+dx*(wall.depth-.04),p.y+dy*(wall.depth-.04),w.color,2);
    }
  }
  rebuildFlow(){
    const l=this.level,n=l.size,flow=new Int16Array(n*n).fill(-1),start=Math.floor(this.player.y)*n+Math.floor(this.player.x),queue=[start];flow[start]=0;
    for(let j=0;j<queue.length;j++){const id=queue[j],x=id%n,y=Math.floor(id/n);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*n+nx;if(nx<0||ny<0||nx>=n||ny>=n||flow[k]>=0||solid(l,nx+.5,ny+.5))continue;flow[k]=flow[id]+1;queue.push(k);}}
    this.flow=flow;
  }
  pickup(item){
    const p=this.player;let label='';
    if(item.kind==='health'){if(p.health>=100)return;p.health=Math.min(100,p.health+30);label='SUIT REPAIRED +30';}
    else if(item.kind==='shield'){if(p.shield>=100)return;p.shield=Math.min(100,p.shield+40);label='SHIELD +40';}
    else if(item.kind==='ammo'){p.shells=Math.min(99,p.shells+12);p.cells=Math.min(200,p.cells+30);label='ENERGY CACHE / +12 ARC / +30 PLASMA';}
    else if(item.kind==='blue'||item.kind==='red'){p.keys[item.kind]=true;label=item.kind.toUpperCase()+' ACCESS ACQUIRED';}
    else {const n=item.kind==='scatter'?1:2;p.owned[n]=true;p.weapon=n;p.shells+=n===1?8:0;p.cells+=n===2?30:0;label=WEAPONS[n].name+' RECOVERED';}
    item.taken=true;this.say(label);this.emit('pickup');
  }
  update(dt,input={}){
    if(this.state!=='playing')return;
    dt=Math.min(dt,.04);this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.flash=Math.max(0,this.flash-dt);this.shot=Math.max(0,this.shot-dt);this.damageFlash=Math.max(0,this.damageFlash-dt);this.hitMarker=Math.max(0,this.hitMarker-dt);this.messageTime=Math.max(0,this.messageTime-dt);
    const p=this.player;p.angle+=(input.turn||0)*dt*2.5+(input.look||0);p.angle=Math.atan2(Math.sin(p.angle),Math.cos(p.angle));
    let f=input.forward||0,s=input.strafe||0;const length=Math.hypot(f,s);if(length>1){f/=length;s/=length;}
    const speed=input.sprint?4.3:3.1;
    moveActor(this.level,p,(Math.cos(p.angle)*f-Math.sin(p.angle)*s)*speed*dt,(Math.sin(p.angle)*f+Math.cos(p.angle)*s)*speed*dt);
    if(length>.08)this.bob+=dt*(input.sprint?14:10);
    if(input.fire)this.fire();if(input.use&&!this.useHeld)this.use();this.useHeld=!!input.use;
    if(this.state!=='playing')return;
    for(const d of this.level.doors)d.open=Math.min(d.target,d.open+dt*.9);
    for(const i of this.level.items)if(!i.taken&&distance(p,i)<.48)this.pickup(i);
    this.flowTimer-=dt;if(this.flowTimer<=0){this.rebuildFlow();this.flowTimer=.4;}
    for(const e of this.level.enemies){
      e.hurt=Math.max(0,e.hurt-dt);if(e.dead)continue;
      const d=distance(p,e),sight=d<13&&visible(this.level,e,p);
      if(sight&&d<10)e.alert=true;if(!e.alert)continue;
      e.cooldown-=dt;
      if(sight&&d<10&&e.cooldown<=0){
        const angle=Math.atan2(p.y-e.y,p.x-e.x);const count=e.kind==='warden'?3:1;
        const boss=e.kind==='boss',phase=e.phase||0,burst=boss?5+phase*2:e.kind==='warden'?3:1;
        for(let i=0;i<burst;i++){const a=angle+(i-(burst-1)/2)*(boss?.13:.16);const v=boss?3.5+phase*.45:e.kind==='drone'?3.1:3.8;this.projectiles.push({x:e.x+Math.cos(a)*.3,y:e.y+Math.sin(a)*.3,dx:Math.cos(a)*v,dy:Math.sin(a)*v,friendly:false,damage:boss?12+phase*4:e.kind==='warden'?22:e.kind==='sentinel'?16:10,life:5,kind:'bolt'});}
        if(boss&&phase>0){for(let i=0;i<phase*4;i++){const a=i/(phase*4)*Math.PI*2;this.projectiles.push({x:e.x,y:e.y,dx:Math.cos(a)*2.4,dy:Math.sin(a)*2.4,friendly:false,damage:8+phase*3,life:3,kind:'bolt'});}}
        if(boss&&phase>0&&this.level.enemies.filter(v=>!v.dead&&v.kind!=='boss').length<5){const kind=phase===2?'sentinel':'drone';this.level.enemies.push({kind,x:e.x+(phase===2?2:-2),y:e.y+(phase===2?-2:2),health:kind==='sentinel'?78:42,maxHealth:kind==='sentinel'?78:42,cooldown:1.5,alert:true,hurt:0,dead:false,phase:0});this.say('CORE TITAN DEPLOYING REINFORCEMENTS');}
        e.cooldown=(boss?Math.max(.55,1.25-phase*.2):e.kind==='warden'?1.3:2.2)+Math.random()*.45;this.emit(boss?'bossfire':'enemy');
      }
      if(d>.9&&(!sight||d>3.5)){
        let tx=p.x,ty=p.y;
        if(!sight){const gx=Math.floor(e.x),gy=Math.floor(e.y),n=this.level.size;let best=this.flow[gy*n+gx];if(best<0)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const v=this.flow[(gy+dy)*n+gx+dx];if(v>=0&&v<best){best=v;tx=gx+dx+.5;ty=gy+dy+.5;}}}
        const a=Math.atan2(ty-e.y,tx-e.x),v=e.kind==='boss'?.48:e.kind==='warden'?.65:e.kind==='sentinel'?.75:1.1;
        moveActor(this.level,e,Math.cos(a)*v*dt,Math.sin(a)*v*dt,.22);
      }
    }
    // Substep projectiles to prevent thin-wall and enemy tunnelling.
    for(const b of this.projectiles){
      const steps=Math.max(1,Math.ceil(Math.hypot(b.dx,b.dy)*dt/.1));
      for(let i=0;i<steps&&b.life>0;i++){
        b.x+=b.dx*dt/steps;b.y+=b.dy*dt/steps;
        if(solid(this.level,b.x,b.y)){b.life=0;this.sparks(b.x,b.y,b.friendly?'#95caff':'#ffc485',3);break;}
        if(b.friendly){const hit=this.level.enemies.find(e=>!e.dead&&distance(e,b)<(e.kind==='warden'?.5:.3));if(hit){this.hurtEnemy(hit,b.damage);b.life=0;}}
        else if(distance(p,b)<.23){this.damage(b.damage);b.life=0;}
      }b.life-=dt;
    }
    this.projectiles=this.projectiles.filter(b=>b.life>0);
    for(const q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.vz-=5*dt;q.life-=dt;}
    this.particles=this.particles.filter(q=>q.life>0).slice(-160);
    for(let y=Math.floor(p.y)-2;y<=Math.floor(p.y)+2;y++)for(let x=Math.floor(p.x)-2;x<=Math.floor(p.x)+2;x++)if(x>=0&&y>=0&&x<this.level.size&&y<this.level.size)this.level.seen[y*this.level.size+x]=1;
  }
}
