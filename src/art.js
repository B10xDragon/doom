// Procedural pixel assets. No external textures, sprites, fonts, or game data.
export function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function noise(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};}
export function makeArt(){
  const textures={},sprites={};
  for(let type=1;type<=6;type++){
    const c=surface(64,64),x=c.getContext('2d'),rnd=noise(type*101);
    const base={1:[54,66,72],2:[64,74,76],3:[40,56,66],4:[10,19,31],5:[38,54,61],6:[55,66,72]}[type];
    for(let y=0;y<64;y++)for(let i=0;i<64;i++){const n=Math.floor(rnd()*12)-6;x.fillStyle='rgb('+base.map(b=>b+n).join(',')+')';x.fillRect(i,y,1,1);}
    const rect=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
    if(type===1||type===6){
      rect(0,0,64,3,'#111c23');rect(0,61,64,3,'#15212a');rect(0,3,3,58,'#23323a');rect(61,3,3,58,'#26353b');
      rect(7,9,50,1,'#78828a');rect(7,10,1,40,'#77868b');rect(8,50,49,2,'#25323a');rect(56,10,2,40,'#27373e');
      for(let i=0;i<4;i++)rect(15,31+i*4,34,2,'#192c36');
      rect(8,5,48,2,'#7fbfb4');rect(10,56,6,2,'#c4ac75');
      for(const a of [4,58])for(const b of [6,56]){rect(a,b,2,2,'#b0bab5');rect(a+1,b+1,1,1,'#19272e');}
      if(type===6){rect(44,16,3,11,'#161d25');rect(44,25,2,2,'#bfab65');}
    }
    if(type===2){
      for(let i=0;i<8;i++){rect(i*8,0,1,64,'#1d2d34');rect(i*8+1,0,1,64,'#748287');}
      rect(0,0,64,6,'#182a30');rect(0,58,64,6,'#182a30');rect(29,6,6,52,'#111d23');
      rect(6,20,18,20,'#23363c');rect(8,23,14,2,'#7dc8b7');rect(8,29,9,2,'#879699');rect(8,34,12,2,'#879699');
      for(let i=-8;i<64;i+=12){x.fillStyle='#b9974c';x.beginPath();x.moveTo(i,52);x.lineTo(i+6,52);x.lineTo(i+12,58);x.lineTo(i+6,58);x.fill();}
    }
    if(type===3){rect(8,0,12,64,'#1b2c34');rect(21,0,4,64,'#81999b');rect(28,0,8,64,'#254047');rect(45,0,7,64,'#203038');for(let y=8;y<64;y+=16){rect(4,y,56,4,'#71858c');rect(4,y+4,56,2,'#132934');}rect(29,10,5,44,'#68b2a3');}
    if(type===4){
      rect(5,7,54,48,'#020811');for(let i=0;i<45;i++)rect(6+rnd()*52,8+rnd()*46,1,1,rnd()>.7?'#b2bebe':'#4c626b');
      x.fillStyle='#34596b';x.beginPath();x.arc(49,40,15,0,Math.PI*2);x.fill();x.fillStyle='#1b344d';x.beginPath();x.arc(53,38,14,0,Math.PI*2);x.fill();
      rect(0,0,64,6,'#5b737c');rect(0,56,64,8,'#273e49');rect(0,0,5,64,'#465c65');rect(59,0,5,64,'#465c65');rect(31,5,2,51,'#233b47');
    }
    if(type===5){rect(6,8,52,44,'#111f29');rect(9,11,46,34,'#24423f');for(let i=0;i<12;i++){const px=10+Math.floor(rnd()*42),py=12+Math.floor(rnd()*30);rect(px,py,2+Math.floor(rnd()*10),1,'#84bba5');}rect(8,54,8,3,'#d3994f');rect(19,54,8,3,'#529b81');}
    textures[type]=c;
  }
  for(const kind of ['drone','sentinel','warden','boss'])for(let frame=0;frame<2;frame++){
    const c=surface(96,128),x=c.getContext('2d'),r=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
    const armor=kind==='drone'?'#849693':kind==='warden'?'#a78b6b':kind==='boss'?'#8f3f62':'#778696';
    const dark=kind==='boss'?'#281c35':'#23343d',light=kind==='boss'?'#ffb1c0':'#b7c7bd',eye=kind==='warden'?'#ffd389':kind==='boss'?'#ff6d86':'#ff8874';
    x.fillStyle='#0005';x.beginPath();x.ellipse(48,119,30,7,0,0,7);x.fill();
    if(kind==='drone'){
      const yy=frame*3;r(15,46+yy,66,28,dark);r(21,37+yy,54,37,armor);r(25,34+yy,46,5,light);r(6,51+yy,15,14,armor);r(75,51+yy,15,14,armor);
      r(26,45+yy,44,13,'#152733');r(31,48+yy,34,5,eye);r(32,67+yy,32,11,'#475e64');r(39,73+yy,18,19,'#203948');r(42,78+yy,12,9,'#71898b');
      r(18,79+yy,11,12,'#3c8090');r(67,79+yy,11,12,'#3c8090');r(21,90+yy,5,6+frame*3,'#88e2e9');r(70,90+yy,5,6+frame*3,'#88e2e9');
    }else{
      const step=frame?4:-4;
      r(22,79,21,32+step,dark);r(53,79,21,32-step,dark);r(23,80,17,24+step,armor);r(55,80,17,24-step,armor);r(17,109+step,28,10,'#435460');r(53,109-step,28,10,'#435460');
      r(23,36,50,47,dark);r(27,37,42,39,armor);r(27,37,42,4,light);r(32,46,32,16,'#364c55');r(37,49,22,6,eye);r(33,70,30,5,'#b2a57c');
      r(10,38,16,33,armor);r(71,38,16,33,armor);r(8,67,18,23,dark);r(70,64,20,26,dark);r(72,60,16,8,'#bac0a4');r(74,78,12,8,'#d99158');
      r(31,14,34,24,dark);r(33,12,30,20,armor);r(35,11,26,4,light);r(35,23,26,7,'#182932');r(38,25,20,3,eye);
      if(kind==='warden'){r(4,30,25,13,'#b29a6d');r(67,30,25,13,'#b29a6d');r(3,26,23,5,'#d9c290');r(69,26,23,5,'#d9c290');r(39,39,18,6,'#edbb74');}
      if(kind==='boss'){r(0,28,20,20,'#542b55');r(76,28,20,20,'#542b55');r(13,20,70,6,'#f06c87');r(24,4,48,10,'#3b2546');r(30,0,36,8,'#ff8ca1');r(19,73,58,8,'#fa6d82');r(28,83,40,12,'#432542');r(34,86,28,5,'#ffb1c0');}
    }
    sprites[kind+frame]=c;
  }
  for(const kind of ['health','shield','ammo','blue','red','scatter','plasma','lamp','terminal','relay','relay-on','exit','bolt','plasma-bolt']){
    const c=surface(64,96),x=c.getContext('2d'),r=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
    if(kind==='lamp') {r(28,19,8,73,'#354e5c');r(21,17,22,8,'#5d7981');r(22,0,20,20,'#c0e8c9');r(26,0,12,20,'#eeffcf');r(18,87,28,7,'#1a2c37');}
    else if(kind==='terminal'||kind.startsWith('relay')||kind==='exit'){
      r(9,25,46,61,'#1d303d');r(12,22,40,62,'#536f78');r(12,22,40,4,'#879d9c');r(17,31,30,29,'#122936');const color=kind==='relay-on'?'#91ffba':kind==='exit'?'#9ebfff':'#ffbf72';
      r(21,36,22,3,color);r(21,43,17,2,color);r(21,49,20,2,color);r(19,67,7,4,'#82bfa4');r(30,67,7,4,'#d8ac77');r(14,83,38,8,'#1c2c35');
    }else if(kind==='bolt'||kind==='plasma-bolt'){
      const color=kind==='bolt'?'#ffb568':'#7ac7ff';x.fillStyle=color+'30';x.beginPath();x.arc(32,48,16,0,7);x.fill();x.fillStyle=color;x.beginPath();x.arc(32,48,9,0,7);x.fill();r(28,44,8,8,'#f3fff0');
    }else{
      const col={health:'#91ffbb',shield:'#84bfff',ammo:'#ffd58f',blue:'#77bfff',red:'#ff8d84',scatter:'#debd88',plasma:'#8ae9ff'}[kind];
      x.fillStyle='#0006';x.beginPath();x.ellipse(32,88,22,5,0,0,Math.PI*2);x.fill();
      if(kind==='blue'||kind==='red'){r(17,52,30,20,'#1b2d3c');r(19,54,26,16,col);r(22,57,7,8,'#e4edc9');r(33,59,11,2,'#344f59');}
      else{r(12,57,40,25,'#203542');r(15,53,34,24,'#7d9694');r(17,57,30,17,'#2b4350');r(20,63,24,3,col);r(29,58,6,14,col);r(16,52,32,3,col);}
    }
    sprites[kind]=c;
  }
  const weapons=[];
  for(let kind=0;kind<3;kind++){
    const c=surface(220,190),x=c.getContext('2d'),r=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
    // Gauntlets, receiver, cooling ribs and a centered barrel: native game geometry.
    r(10,161,59,29,'#23313a');r(22,148,48,38,'#3c5059');r(151,157,59,33,'#263640');r(150,147,45,35,'#4c6169');r(31,144,35,5,'#81908b');r(159,146,31,5,'#82958d');
    r(62,130,96,60,'#1a2935');r(72,109,76,81,'#4a626c');r(76,109,68,5,'#a6b5a9');
    const wide=kind===1?29:kind===2?23:17;
    r(110-wide-5,50,wide*2+10,85,'#172630');r(110-wide,43,wide*2,89,'#536f7b');r(112-wide,43,5,78,'#9eb5b7');r(110+wide-6,45,6,84,'#2d434f');
    r(110-wide-2,39,wide*2+4,19,'#273b47');r(110-wide+2,42,wide*2-4,9,'#0e1e29');
    for(let y=63;y<109;y+=9)r(110-wide+6,y,wide*2-12,3,'#203844');
    r(79,137,62,37,'#1e3943');r(84,141,52,18,'#142b36');
    const col=['#8dffd4','#ffd48c','#8acbff'][kind];r(91,147,38,4,col);r(91,153,24,2,col);r(107,31,6,9,col);
    if(kind===1){r(73,74,14,59,'#7a8180');r(133,74,14,59,'#667d81');r(77,75,4,55,'#c1bda4');r(137,75,4,55,'#c1bda4');}
    if(kind===2){r(81,66,10,59,'#285066');r(129,66,10,59,'#285066');for(let y=68;y<125;y+=10){r(83,y,6,5,col);r(131,y,6,5,col);}}
    weapons.push(c);
  }
  return {textures,sprites,weapons};
}
