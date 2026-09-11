// Layouts use whole tiles; actors occupy tile centers. All art and maps are original.
export const SECTORS = [
  {name:'DOCKING ARRAY',subtitle:'Recover access. Restore the docking relay.',accent:'#73e7c0',mirror:false,flip:false},
  {name:'RESEARCH DECK',subtitle:'The signal leads deeper. Restore the research deck.',accent:'#71b9ed',mirror:true,flip:false},
  {name:'REACTOR HEART',subtitle:'Disable the Warden. Bring the evacuation bay online.',accent:'#e8a26b',mirror:false,flip:true},
  {name:'CRYO VAULTS',subtitle:'Wake the navigation core before the cold locks you in.',accent:'#9de8ff',mirror:true,flip:true},
  {name:'ORBITAL FORGE',subtitle:'Cross the manufacturing ring and cut the weapons feed.',accent:'#ffb46b',mirror:false,flip:false},
  {name:'SIGNAL CATHEDRAL',subtitle:'Trace the impossible transmission through the antenna maze.',accent:'#cf9cff',mirror:true,flip:false},
  {name:'HELIOS ARRAY',subtitle:'Reroute solar power through the defense lattice.',accent:'#ffe28c',mirror:false,flip:true},
  {name:'NULL ARCHIVE',subtitle:'Recover the station memory before the archive erases itself.',accent:'#9db5ff',mirror:true,flip:true},
  {name:'ASCENSION RING',subtitle:'Cross the last security perimeter.',accent:'#ff9fc2',mirror:false,flip:false},
  {name:'COMMAND CORE',subtitle:'Break the core guardian and end the station lockdown.',accent:'#ff6d86',mirror:false,flip:true,final:true}
];
export function buildLevel(index=0) {
  const config=SECTORS[index],size=32;
  const grid=Array.from({length:size},()=>Array(size).fill(1));
  const doors=[],items=[],enemies=[],props=[],relays=[];
  const rect=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)grid[j][i]=0;};
  // Six rooms form an access-controlled loop, with a hidden supply room.
  rect(2,22,8,7);rect(2,12,10,8);rect(2,2,9,8);
  rect(15,2,10,8);rect(16,13,13,8);rect(20,24,9,5);rect(12,25,5,4);
  rect(6,19,1,4);rect(6,9,1,4);rect(10,5,6,1);
  rect(11,16,6,1);rect(21,9,1,5);rect(25,20,1,5);rect(9,26,4,1);
  const door=(x,y,key=null,secret=false)=>{grid[y][x]=secret?6:2;doors.push({x,y,key,secret,open:0,target:0,found:false});};
  door(6,21);door(6,11);door(13,5,'blue');door(14,16,'red');door(21,11,'red');door(25,22);door(11,26,null,true);
  // Pillars, instrument banks, observation windows, and reactor trim.
  for(const [x,y] of [[4,15],[9,17],[4,5],[8,7],[18,5],[22,7],[19,16],[25,16],[24,26]])grid[y][x]=3;
  for(let x=3;x<9;x++)grid[1][x]=4;
  for(let y=14;y<20;y++)grid[y][29]=4;
  for(let x=16;x<25;x++)grid[1][x]=5;
  for(let x=20;x<29;x++)grid[29][x]=5;
  if(index===1){for(const [x,y] of [[7,13],[7,14],[7,15],[7,16],[19,3],[19,4],[19,6],[23,17],[24,17],[25,17]])grid[y][x]=3;}
  if(index%3===2){for(const [x,y] of [[3,14],[5,14],[7,17],[8,17],[17,4],[17,5],[17,6],[23,15],[24,15],[26,15]])grid[y][x]=3;}
  if(config.final)for(const [x,y] of [[18,16],[20,16],[22,16],[24,16],[18,20],[20,20],[22,20],[24,20]])grid[y][x]=3;
  const item=(kind,x,y)=>items.push({kind,x:x+.5,y:y+.5,taken:false});
  item('blue',8,3);item('red',23,3);item('scatter',5,17);item('plasma',17,8);
  for(const [x,y] of [[4,23],[8,13],[3,8],[16,3],[27,19],[22,27],[14,27]])item('health',x,y);
  for(const [x,y] of [[8,26],[7,8],[17,17],[13,27]])item('shield',x,y);
  for(const [x,y] of [[5,18],[9,4],[16,8],[23,18],[27,25],[15,26]])item('ammo',x,y);
  relays.push({x:23.5,y:8.5,on:false},{x:27.5,y:14.5,on:false});
  const exit={x:27.5,y:27.5};
  const enemy=(kind,x,y)=>enemies.push({kind,x:x+.5,y:y+.5,health:kind==='boss'?1400:kind==='warden'?360:kind==='sentinel'?78:42,maxHealth:kind==='boss'?1400:kind==='warden'?360:kind==='sentinel'?78:42,cooldown:1.5,alert:false,hurt:0,dead:false,phase:0});
  for(const [x,y] of [[8,14],[3,17],[7,3],[9,8],[16,6],[23,6],[18,18],[27,17],[22,25]])enemy('drone',x,y);
  for(const [x,y] of [[9,18],[4,8],[18,8],[23,14]])enemy('sentinel',x,y);
  const pressureSpawns=[[8,24],[20,18],[27,26],[4,23],[22,25],[18,18],[3,17]];
  for(let i=0;i<Math.max(0,index-1);i++){const [x,y]=pressureSpawns[i%pressureSpawns.length];enemy(i%2?'sentinel':'drone',x,y);}
  if(index===2||index===5||index===8)enemy('warden',26,18);
  if(config.final){enemy('boss',25,18);enemy('warden',20,18);enemy('sentinel',27,20);}
  for(const [x,y] of [[3,24],[8,28],[3,13],[10,14],[3,3],[16,2],[24,9],[17,20],[28,20],[20,24]])props.push({x:x+.5,y:y+.5,kind:'lamp'});
  props.push({x:5.5,y:24.5,kind:'terminal'});
  // Mirrored sector geometry preserves all progression constraints.
  const point=(p,center=true)=>({ ...p,x:config.mirror?size-p.x-(center?0:1):p.x,y:config.flip?size-p.y-(center?0:1):p.y });
  const out=grid.map(r=>r.slice());
  if(config.mirror)out.forEach(r=>r.reverse());if(config.flip)out.reverse();
  return {index,config,size,grid:out,doors:doors.map(d=>point(d,false)),items:items.map(p=>point(p)),enemies:enemies.map(p=>point(p)),props:props.map(p=>point(p)),relays:relays.map(p=>point(p)),exit:point(exit),spawn:point({x:6.5,y:26.5,angle:config.flip?Math.PI/2:-Math.PI/2}),seen:new Uint8Array(size*size)};
}
