import {makeArt} from './art.js';
import {ray,clamp,distance,WEAPONS} from './world.js';
const pack=(r,g,b)=>((255<<24)|(b<<16)|(g<<8)|r)>>>0;
export class Renderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.art=makeArt();this.raw={};for(const [key,c] of Object.entries({...this.art.textures,...this.art.sprites}))this.raw[key]={width:c.width,height:c.height,data:new Uint32Array(c.getContext('2d').getImageData(0,0,c.width,c.height).data.buffer)};this.reduced=false;this.resize(640,360);}
  resize(w,h){this.canvas.width=w;this.canvas.height=h;this.w=w;this.h=h;this.ctx.imageSmoothingEnabled=false;this.buffer=this.ctx.createImageData(w,h);this.pixels=new Uint32Array(this.buffer.data.buffer);this.depth=new Float32Array(w);}
  render(world){
    const {w,h,ctx:x}=this,p=world.player,l=world.level,dirX=Math.cos(p.angle),dirY=Math.sin(p.angle),fov=.72;
    const planeX=-dirY*fov,planeY=dirX*fov,half=h/2,scale=w/(2*fov);
    // Perspective-correct floor/ceiling casting with distance shading and panel seams.
    for(let y=0;y<h;y++){
      const floor=y>half,offset=Math.max(1,Math.abs(y-half)),d=scale*.5/offset;
      let wx=p.x+d*(dirX-planeX),wy=p.y+d*(dirY-planeY);const stepX=2*d*planeX/w,stepY=2*d*planeY/w;
      const shade=clamp(1/(1+d*.095),.13,1);
      for(let col=0;col<w;col++,wx+=stepX,wy+=stepY){
        const fx=Math.floor(wx),fy=Math.floor(wy),u=wx-fx,v=wy-fy,hash=((fx*137+fy*97)&15);
        let r,g,b;
        if(floor){const edge=u<.015||v<.015,checker=(fx+fy)&1,grain=((Math.floor(u*64)*17+Math.floor(v*64)*31)&7)*.5;const tone=(edge?16:38+checker*4+hash*.4+grain)*shade;r=tone*.8;g=tone;b=tone*1.18;
          if((fx%4===0&&u>.88)||(fy%4===0&&v>.94)){r=31*shade;g=49*shade;b=53*shade;}
        }else{const light=(fy%4===0&&v>.3&&v<.52&&u>.08&&u<.92);const tone=(u<.03||v<.03?12:25+hash*.5)*shade;r=light?125*shade:tone*.7;g=light?161*shade:tone;b=light?153*shade:tone*1.14;}
        this.pixels[y*w+col]=pack(r|0,g|0,b|0);
      }
    }
    for(let col=0;col<w;col++){
      const camera=2*col/w-1,dx=dirX+planeX*camera,dy=dirY+planeY*camera;
      const hit=ray(l,p.x,p.y,dx,dy),depth=hit.depth;this.depth[col]=depth;
      const wallH=scale/depth,top=half-wallH/2,door=hit.door;
      let u=hit.u;if(door)u=(u-door.open+1)%1;
      const tex=this.raw[hit.tile]||this.raw[1],tx=Math.min(63,Math.floor(u*64));
      const shade=clamp(1/(1+depth*.09)-(hit.side===1?.12:0),.12,1);
      for(let y=Math.max(0,Math.floor(top));y<Math.min(h,top+wallH);y++){
        const ty=clamp(Math.floor((y-top)/wallH*64),0,63),pixel=tex.data[ty*64+tx];
        let r=(pixel&255)*shade,g=((pixel>>8)&255)*shade,b=((pixel>>16)&255)*shade;
        if(door?.key&&ty>=6&&ty<=8){r=door.key==='blue'?100:218;g=door.key==='blue'?190:125;b=door.key==='blue'?240:105;}
        this.pixels[y*w+col]=pack(r|0,g|0,b|0);
      }
      if(hit.mx>=0&&hit.my>=0&&hit.mx<l.size&&hit.my<l.size&&depth<12)l.seen[hit.my*l.size+hit.mx]=1;
    }
    const objects=[];
    for(const e of l.enemies)objects.push({...e,key:e.kind+Math.floor(world.time*4)%2,height:e.kind==='warden'?1.2:e.kind==='drone'?.85:.97,dead:e.dead});
    for(const i of l.items)if(!i.taken)objects.push({...i,key:i.kind,height:.55,item:true});
    for(const q of l.props)objects.push({...q,key:q.kind,height:1});
    for(const q of l.relays)objects.push({...q,key:q.on?'relay-on':'relay',height:.9});
    objects.push({...l.exit,key:'exit',height:1});
    for(const q of world.projectiles)objects.push({...q,key:q.friendly?'plasma-bolt':'bolt',height:.32,flying:true});
    objects.sort((a,b)=>distance(b,p)-distance(a,p));
    for(const obj of objects){
      const dx=obj.x-p.x,dy=obj.y-p.y,depth=dx*dirX+dy*dirY;if(depth<.12)continue;
      const side=-dx*dirY+dy*dirX,screenX=w/2+side/depth*scale;
      const sprite=this.raw[obj.key];if(!sprite)continue;
      const sh=scale/depth*obj.height*(obj.dead?.16:1),sw=sh*sprite.width/sprite.height*(obj.dead?3:1);
      const bottom=obj.flying?half+sh/2:half+scale/depth*.5;
      const top=bottom-sh+(obj.item&&!this.reduced?Math.sin(world.time*3)*scale/depth*.02:0);
      const left=screenX-sw/2,right=left+sw;if(right<0||left>w)continue;
      const brightness=clamp(1/(1+depth*.045),.45,1);
      for(let col=Math.max(0,Math.floor(left));col<Math.min(w,right);col++){
        if(depth>=this.depth[col])continue;
        const sx=Math.floor((col-left)/sw*sprite.width);if(sx<0||sx>=sprite.width)continue;
        for(let y=Math.max(0,Math.floor(top));y<Math.min(h,bottom);y++){
          const sy=clamp(Math.floor((y-top)/sh*sprite.height),0,sprite.height-1),pixel=sprite.data[sy*sprite.width+sx],alpha=(pixel>>>24)/255*(obj.dead?.6:1);
          if(alpha<.01)continue;
          const target=this.pixels[y*w+col],shade=obj.hurt>0?1:brightness;
          this.pixels[y*w+col]=pack(((pixel&255)*shade*alpha+(target&255)*(1-alpha))|0,(((pixel>>8)&255)*shade*alpha+((target>>8)&255)*(1-alpha))|0,(((pixel>>16)&255)*shade*alpha+((target>>16)&255)*(1-alpha))|0);
        }
      }
    }
    x.putImageData(this.buffer,0,0);
    for(const q of world.particles){const dx=q.x-p.x,dy=q.y-p.y,d=dx*dirX+dy*dirY;if(d<.1)continue;const sx=Math.round(w/2+(-dx*dirY+dy*dirX)/d*scale),sy=half+(.5-q.z)*scale/d;if(sx>=0&&sx<w&&d<this.depth[sx]){x.fillStyle=q.color;x.fillRect(sx,sy,Math.max(1,2/d),Math.max(1,2/d));}}
    if(world.state!=='dead'&&!world.mapOpen){
      const bob=this.reduced?0:Math.sin(world.bob)*2,recoil=this.reduced?0:Math.sin(world.shot/.22*Math.PI)*10;
      const weapon=this.art.weapons[p.weapon],wh=Math.min(h*.61,w*.48),ww=wh*weapon.width/weapon.height,wx=w/2-ww/2+bob,wy=h-wh+recoil+Math.abs(bob);
      if(world.flash>0){const color=WEAPONS[p.weapon].color;x.fillStyle=color+'80';x.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=(i%2?8:23)*h/360;const px=w/2+Math.cos(a)*r,py=wy+wh*.21+Math.sin(a)*r;if(i===0)x.moveTo(px,py);else x.lineTo(px,py);}x.closePath();x.fill();}
      x.drawImage(weapon,wx,wy,ww,wh);
    }
    // Restrained edge vignette; avoid full-screen flashing and camera shake.
    const v=x.createRadialGradient(w/2,h/2,h*.25,w/2,h/2,w*.62);v.addColorStop(0,'#0000');v.addColorStop(1,'#0009');x.fillStyle=v;x.fillRect(0,0,w,h);
    if(world.damageFlash>0){x.strokeStyle='rgba(231,119,61,'+world.damageFlash*1.4+')';x.lineWidth=Math.max(5,w*.025);x.strokeRect(0,0,w,h);}
    if(world.hitMarker>0){x.strokeStyle='#ffc58b';x.lineWidth=1;x.beginPath();x.moveTo(w/2-6,h/2-6);x.lineTo(w/2+6,h/2+6);x.moveTo(w/2-6,h/2+6);x.lineTo(w/2+6,h/2-6);x.stroke();}
    if(world.mapOpen)this.map(world);
  }
  map(world){
    const {ctx:x,w,h}=this,l=world.level,n=l.size,size=Math.min(h*.9,w*.85),z=size/n,ox=(w-size)/2,oy=(h-size)/2;
    x.fillStyle='#061218ee';x.fillRect(0,0,w,h);
    for(let y=0;y<n;y++)for(let i=0;i<n;i++)if(l.seen[y*n+i]){const tile=l.grid[y][i];x.fillStyle=tile===0?'#172d36':tile===2?'#dfae67':'#4a6d74';x.fillRect(ox+i*z,oy+y*z,z-.5,z-.5);}
    const dot=(p,color,r=2)=>{if(!l.seen[Math.floor(p.y)*n+Math.floor(p.x)])return;x.fillStyle=color;x.fillRect(ox+p.x*z-r,oy+p.y*z-r,r*2,r*2);};
    for(const i of l.items)if(!i.taken&&(i.kind==='blue'||i.kind==='red'))dot(i,i.kind==='blue'?'#71c8ff':'#ff8b82');
    l.relays.forEach(r=>dot(r,r.on?'#8ef0b9':'#ffd38a'));dot(l.exit,'#bac7ff');
    const p=world.player;x.save();x.translate(ox+p.x*z,oy+p.y*z);x.rotate(p.angle);x.fillStyle='#a6ffcf';x.beginPath();x.moveTo(6,0);x.lineTo(-4,-4);x.lineTo(-2,0);x.lineTo(-4,4);x.closePath();x.fill();x.restore();
    x.font='10px monospace';x.fillStyle='#b2d1c8';x.textAlign='left';x.fillText('AUTOMAP / EXPLORED AREAS',12,18);x.fillText('BLUE + RED: ACCESS / GOLD: RELAY / VIOLET: EXIT',12,h-12);
  }
}
