// Lightweight synthesized SFX and an original ambient sequence. No audio downloads.
export class Audio {
  constructor(){this.ctx=null;this.enabled=true;this.musicTimer=0;this.note=0;}
  async unlock(){if(!this.enabled)return;try{if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.gain=this.ctx.createGain();this.gain.gain.value=.2;this.gain.connect(this.ctx.destination);}if(this.ctx.state!=='running')await this.ctx.resume();}catch{/* Audio is optional; gameplay remains available. */}}
  tone(freq,duration=.12,type='triangle',volume=.2,end=freq,delay=0){
    if(!this.ctx||!this.enabled||this.ctx.state!=='running')return;
    const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.009);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  effect(name){
    if(name==='fire0'){this.tone(540,.14,'sawtooth',.12,65);this.tone(1200,.06,'triangle',.14,200);}
    if(name==='fire1'){this.tone(190,.22,'sawtooth',.23,30);this.tone(940,.08,'square',.1,70);}
    if(name==='fire2')this.tone(740,.12,'sine',.25,200);
    if(name==='enemy')this.tone(220,.12,'triangle',.07,90);
    if(name==='hit')this.tone(160,.055,'square',.1,75);
    if(name==='destroy'){this.tone(90,.35,'sawtooth',.2,22);this.tone(410,.2,'triangle',.09,30);}
    if(name==='hurt')this.tone(85,.2,'triangle',.23,35);
    if(name==='door')this.tone(55,.6,'sawtooth',.08,100);
    if(name==='locked'||name==='empty')this.tone(90,.12,'square',.1,85);
    if(name==='switch')this.tone(440,.06,'triangle',.06,180);
    if(['pickup','secret','relay','complete'].includes(name)){this.tone(440,.14,'sine',.17,440);this.tone(660,.2,'sine',.13,660,.09);if(name!=='pickup')this.tone(880,.5,'sine',.12,880,.22);}
  }
  tick(dt,playing){if(!playing)return;this.musicTimer-=dt;if(this.musicTimer>0)return;this.musicTimer=.5;const notes=[55,55,82.41,65.41,55,110,73.42,65.41];this.tone(notes[this.note%8],.45,'triangle',.12);if(this.note%4===0)this.tone(notes[this.note%8]*4,1.4,'sine',.035);this.note++;}
}
