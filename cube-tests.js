import test from 'node:test';
import assert from 'node:assert/strict';
import {createCube,applyMove,inverseMove,isSolved,stateSignature,randomScramble} from '../js/cube-state.js';
for(const size of [2,3,6,8]){
  test(`${size}x${size} initializes solved with the correct cubie count`,()=>{const s=createCube(size);assert.equal(s.cubies.length,size**3);assert.equal(isSolved(s),true)});
  test(`${size}x${size} face moves and inverses restore state`,()=>{for(const m of ['R','L','U','D','F','B']){const s=createCube(size),before=stateSignature(s);applyMove(s,m);applyMove(s,inverseMove(m));assert.equal(stateSignature(s),before,`${m} inverse`);}});
  test(`${size}x${size} four quarter-turns restore state`,()=>{const s=createCube(size),before=stateSignature(s);for(let i=0;i<4;i++)applyMove(s,'R');assert.equal(stateSignature(s),before)});
  test(`${size}x${size} half-turn is its own inverse`,()=>{const s=createCube(size),before=stateSignature(s);applyMove(s,'U2');applyMove(s,'U2');assert.equal(stateSignature(s),before)});
  test(`${size}x${size} random scramble preserves unique legal coordinates`,()=>{const s=createCube(size);for(const m of randomScramble(size,40))applyMove(s,m);const coords=s.cubies.map(c=>`${c.x},${c.y},${c.z}`);assert.equal(new Set(coords).size,size**3);assert.ok(s.cubies.every(c=>[c.x,c.y,c.z].every(v=>Number.isInteger(v)&&v>=0&&v<size)));});
}
test('wide and inner-layer moves are supported on larger cubes',()=>{const s=createCube(6),before=stateSignature(s);applyMove(s,'2R');assert.notEqual(stateSignature(s),before);applyMove(s,"2R'");assert.equal(stateSignature(s),before);const wide=createCube(6);applyMove(wide,'2Rw');assert.notEqual(stateSignature(wide),before);applyMove(wide,"2Rw'");assert.equal(stateSignature(wide),before);});
test('rejects unsupported sizes and out-of-range layers',()=>{assert.throws(()=>createCube(4));assert.throws(()=>applyMove(createCube(3),'4R'))});
