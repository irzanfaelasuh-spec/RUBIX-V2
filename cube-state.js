export const FACES = {
  R: { axis: 'x', layer: n => n - 1, sign: 1, normal: [1,0,0], color: '#d9473f' },
  L: { axis: 'x', layer: () => 0, sign: -1, normal: [-1,0,0], color: '#f28c28' },
  U: { axis: 'y', layer: n => n - 1, sign: 1, normal: [0,1,0], color: '#f4f2e9' },
  D: { axis: 'y', layer: () => 0, sign: -1, normal: [0,-1,0], color: '#f3cf35' },
  F: { axis: 'z', layer: n => n - 1, sign: 1, normal: [0,0,1], color: '#20a56b' },
  B: { axis: 'z', layer: () => 0, sign: -1, normal: [0,0,-1], color: '#3267d5' }
};
const clone = x => JSON.parse(JSON.stringify(x));
const rotateVec = (v, axis, quarter) => {
  let [x,y,z] = v;
  for (let i=0;i<((quarter%4)+4)%4;i++) {
    if (axis==='x') [y,z]=[-z,y];
    else if (axis==='y') [x,z]=[z,-x];
    else [x,y]=[-y,x];
  }
  return [x,y,z];
};
export function parseMove(notation, size) {
  const m = String(notation).trim().match(/^(\d+)?([RLUDFBrludfbMESxyz])([wW])?([2']?)$/);
  if (!m) throw new Error(`Unsupported move: ${notation}`);
  let [, depthText, rawFace, wideMark, suffix] = m;
  let face = rawFace.toUpperCase();
  if (!FACES[face]) throw new Error(`Move ${notation} is not supported by this cube engine yet.`);
  let depth = depthText ? Number(depthText) : 1;
  const wide = !!wideMark || rawFace !== face;
  if (wide && !depthText) depth = 2;
  if (depth < 1 || depth > size || (wide && depth > size)) throw new Error(`Layer depth out of range for ${size}×${size}.`);
  const def = FACES[face];
  // On larger cubes, 2R means the second slice only; Rw / 2Rw are wide turns.
  const layers = depthText && !wide ? [def.layer(size) - def.sign*(depth-1)] : Array.from({length: depth}, (_,i) => def.layer(size) - def.sign*i);
  let turns = suffix === '2' ? 2 : suffix === "'" ? -1 : 1;
  // Standard notation is clockwise as viewed from outside the named face.
  const quarter = -def.sign * turns;
  return { notation, face, axis: def.axis, layers, quarter, turns };
}
export function createCube(size=3) {
  if (![2,3,6,8].includes(size)) throw new Error('Supported sizes are 2, 3, 6, and 8.');
  const cubies=[];
  for(let x=0;x<size;x++) for(let y=0;y<size;y++) for(let z=0;z<size;z++) {
    const stickers={},stickerMeta={};
    if(x===size-1){stickers['1,0,0']='#d9473f';stickerMeta['1,0,0']={face:'RIGHT',col:size-1-z,row:size-1-y};}
    if(x===0){stickers['-1,0,0']='#f28c28';stickerMeta['-1,0,0']={face:'LEFT',col:z,row:size-1-y};}
    if(y===size-1){stickers['0,1,0']='#f4f2e9';stickerMeta['0,1,0']={face:'UP',col:x,row:z};}
    if(y===0){stickers['0,-1,0']='#f3cf35';stickerMeta['0,-1,0']={face:'DOWN',col:x,row:size-1-z};}
    if(z===size-1){stickers['0,0,1']='#20a56b';stickerMeta['0,0,1']={face:'FRONT',col:x,row:size-1-y};}
    if(z===0){stickers['0,0,-1']='#3267d5';stickerMeta['0,0,-1']={face:'BACK',col:size-1-x,row:size-1-y};}
    cubies.push({id:`${x}-${y}-${z}`,x,y,z,stickers,stickerMeta});
  }
  return {size,cubies};
}
export function applyMove(state, notation) {
  const move=parseMove(notation,state.size); const n=state.size;
  for(const c of state.cubies) if(move.layers.includes(c[move.axis])) {
    const centered=[c.x-(n-1)/2,c.y-(n-1)/2,c.z-(n-1)/2];
    let rotated=rotateVec(centered,move.axis,move.quarter);
    [c.x,c.y,c.z]=rotated.map(v=>Math.round(v+(n-1)/2));
    const next={};
    for(const [normal,color] of Object.entries(c.stickers)) next[rotateVec(normal.split(',').map(Number),move.axis,move.quarter).join(',')]=color;
    c.stickers=next;const nextMeta={};for(const [normal,meta] of Object.entries(c.stickerMeta||{}))nextMeta[rotateVec(normal.split(',').map(Number),move.axis,move.quarter).join(',')]=meta;c.stickerMeta=nextMeta;
  }
  return move;
}
export function inverseMove(move) { return move.endsWith('2') ? move : move.endsWith("'") ? move.slice(0,-1) : `${move}'`; }
export function stateSignature(state) { return state.cubies.slice().sort((a,b)=>a.id.localeCompare(b.id)).map(c=>`${c.id}:${c.x},${c.y},${c.z}:${Object.entries(c.stickers).sort().map(([k,v])=>`${k}=${v}`).join(';')}:${Object.entries(c.stickerMeta||{}).sort().map(([k,v])=>`${k}=${v.face},${v.col},${v.row}`).join(';')}`).join('|'); }
export function isSolved(state) {
  const n=state.size;
  for(const c of state.cubies) {
    if(c.x===n-1 && c.stickers['1,0,0']!=='#d9473f') return false;
    if(c.x===0 && c.stickers['-1,0,0']!=='#f28c28') return false;
    if(c.y===n-1 && c.stickers['0,1,0']!=='#f4f2e9') return false;
    if(c.y===0 && c.stickers['0,-1,0']!=='#f3cf35') return false;
    if(c.z===n-1 && c.stickers['0,0,1']!=='#20a56b') return false;
    if(c.z===0 && c.stickers['0,0,-1']!=='#3267d5') return false;
  }
  return true;
}
export function snapshot(state){return clone(state)}
export function randomScramble(size, length=20) {
  const faces='RLUDFB'; const suffixes=['',"'",'2']; let out=[],last='';
  while(out.length<length){const f=faces[Math.floor(Math.random()*6)];if(f===last)continue;last=f;out.push(f+suffixes[Math.floor(Math.random()*3)]);}
  return out;
}
