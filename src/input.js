export class Input {
  constructor(canvas,hooks){
    this.canvas=canvas;this.hooks=hooks;this.keys=new Set();this.firePointers=new Set();this.axis={x:0,y:0};this.look=0;this.sensitivity=1;this.stickId=null;this.lookId=null;this.dragId=null;this.usePending=false;
    const $=id=>document.getElementById(id);
    this.stick=$('stick');this.knob=$('stick-knob');this.zone=$('look-zone');
    document.addEventListener('keydown',e=>{
      if(e.target.matches('input,select'))return;
      if(e.code==='Escape'&&hooks.playing()){e.preventDefault();hooks.pause();return;}
      if(!hooks.playing())return;
      if(['Tab','Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
      if(!e.repeat){if(e.code==='Tab'||e.code==='KeyM')hooks.map();if(e.code==='KeyE')this.usePending=true;if(e.code==='KeyQ')hooks.cycle();if(/^Digit[123]$/.test(e.code))hooks.weapon(+e.code.slice(-1)-1);}
      this.keys.add(e.code);
    });
    document.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>{this.clear();if(hooks.playing())hooks.pause();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clear();if(hooks.playing())hooks.pause();}});
    document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&this.hadLock&&hooks.playing())hooks.pause();this.hadLock=document.pointerLockElement===canvas;});
    document.addEventListener('pointerlockerror',()=>hooks.message('Mouse capture unavailable. Hold and drag to aim, or use arrow keys.'));
    document.addEventListener('mousemove',e=>{if(hooks.playing()&&document.pointerLockElement===canvas)this.look+=e.movementX*.0024*this.sensitivity;});
    canvas.addEventListener('pointerdown',e=>{
      if(!hooks.playing()||e.pointerType==='touch'||e.button!==0)return;e.preventDefault();
      if(document.pointerLockElement===canvas){this.firePointers.add(e.pointerId);}
      else{this.capture();this.dragId=e.pointerId;this.dragX=e.clientX;canvas.setPointerCapture(e.pointerId);}
    });
    canvas.addEventListener('pointermove',e=>{if(e.pointerId===this.dragId&&document.pointerLockElement!==canvas){this.look+=(e.clientX-this.dragX)*.005*this.sensitivity;this.dragX=e.clientX;}});
    const release=e=>{this.firePointers.delete(e.pointerId);if(e.pointerId===this.stickId){this.stickId=null;this.axis={x:0,y:0};this.knob.style.transform='';}if(e.pointerId===this.lookId)this.lookId=null;if(e.pointerId===this.dragId)this.dragId=null;};
    document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);
    const touch=(node,down,move=()=>{})=>{
      node.addEventListener('pointerdown',e=>{if(!hooks.playing())return;e.preventDefault();node.setPointerCapture(e.pointerId);down(e);});
      node.addEventListener('pointermove',move);node.addEventListener('lostpointercapture',release);
      node.addEventListener('contextmenu',e=>e.preventDefault());node.addEventListener('dblclick',e=>e.preventDefault());
    };
    const moveStick=e=>{if(e.pointerId!==this.stickId)return;const r=this.stick.getBoundingClientRect(),radius=r.width*.32;let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const length=Math.hypot(dx,dy);if(length>radius){dx*=radius/length;dy*=radius/length;}this.axis={x:dx/radius,y:-dy/radius};this.knob.style.transform='translate('+dx+'px,'+dy+'px)';};
    touch(this.stick,e=>{if(this.stickId!==null)return;this.stickId=e.pointerId;moveStick(e);},moveStick);
    touch(this.zone,e=>{if(this.lookId!==null)return;this.lookId=e.pointerId;this.lookX=e.clientX;},e=>{if(e.pointerId!==this.lookId)return;const delta=e.clientX-this.lookX;this.lookX=e.clientX;this.look+=delta*.005*this.sensitivity;});
    touch($('touch-fire'),e=>this.firePointers.add(e.pointerId));
    touch($('touch-use'),()=>{this.usePending=true;});
    touch($('touch-weapon'),()=>hooks.cycle());
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
  }
  capture(){if(document.body.classList.contains('touch'))return;try{const r=this.canvas.requestPointerLock?.();r?.catch?.(()=>this.hooks.message('Hold and drag to aim; Space fires.'));}catch{this.hooks.message('Hold and drag to aim; Space fires.');}}
  poll(){const k=this.keys,down=(...names)=>names.some(n=>k.has(n))?1:0;const v={forward:down('KeyW','ArrowUp')-down('KeyS','ArrowDown')+this.axis.y,strafe:down('KeyD')-down('KeyA')+this.axis.x,turn:down('ArrowRight')-down('ArrowLeft'),look:this.look,fire:k.has('Space')||this.firePointers.size>0,use:this.usePending,sprint:down('ShiftLeft','ShiftRight')};this.look=0;this.usePending=false;return v;}
  clear(){this.keys.clear();this.firePointers.clear();this.axis={x:0,y:0};this.look=0;this.usePending=false;this.stickId=null;this.lookId=null;this.dragId=null;if(this.knob)this.knob.style.transform='';}
}
