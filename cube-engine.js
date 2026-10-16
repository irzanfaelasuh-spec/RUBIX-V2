import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { createCube, applyMove, FACES } from './cube-state.js';
const NORMALS = Object.keys(FACES).length;
const stickerColor = c => new THREE.Color(c);
const faceNormals = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const normalKey = n => n.join(',');
export class CubeView {
  constructor(canvas, onReady=()=>{}) {
    this.canvas=canvas; this.onReady=onReady; this.size=3; this.state=createCube(3); this.spacing=1.02; this.cubies=[]; this.queue=Promise.resolve(); this.animating=false; this.animationSpeed=1; this.customTextures={}; this.imageMode='ALL'; this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene=new THREE.Scene(); this.scene.background=new THREE.Color('#0b0d11');
    this.camera=new THREE.PerspectiveCamera(34,1,.1,100); this.camera.position.set(7,6,9);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'}); this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8)); this.renderer.outputColorSpace=THREE.SRGBColorSpace; this.renderer.toneMapping=THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.15;
    this.root=new THREE.Group(); this.scene.add(this.root); this.pivot=new THREE.Group(); this.scene.add(this.pivot);
    this.scene.add(new THREE.HemisphereLight(0xbfcce2,0x22242b,2.1)); const key=new THREE.DirectionalLight(0xffffff,3.1);key.position.set(5,8,6);this.scene.add(key);const rim=new THREE.DirectionalLight(0x7c91b7,1.5);rim.position.set(-6,2,-5);this.scene.add(rim);
    this.stickerGeo=new THREE.PlaneGeometry(.88,.88); this.bodyGeo=new THREE.BoxGeometry(.96,.96,.96); this.bodyMat=new THREE.MeshStandardMaterial({color:'#171a20',roughness:.34,metalness:.14});
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2(); this.drag=null; this.build(3); this.resize(); this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);this.loop(); onReady();
  }
  build(size) {
    this.size=size; this.state=createCube(size); this.clearRoot(); const n=size; this.spacing=1.02;
    for(const data of this.state.cubies){const g=new THREE.Group();g.position.set((data.x-(n-1)/2)*this.spacing,(data.y-(n-1)/2)*this.spacing,(data.z-(n-1)/2)*this.spacing);g.userData.cubieId=data.id;g.userData.data=data;this.root.add(g);this.cubies.push(g);this.drawCubie(g,data);}
    this.root.scale.setScalar(3.35/(size*this.spacing)); this.renderNow();
  }
  clearRoot(){for(const c of [...this.root.children]){this.root.remove(c);this.disposeChildren(c);}this.cubies=[];}
  disposeChildren(obj){obj.traverse?.(o=>{if(o.geometry && o.geometry!==this.stickerGeo&&o.geometry!==this.bodyGeo)o.geometry.dispose();if(o.material && !Array.isArray(o.material) && o.material!==this.bodyMat && !o.userData.sharedMaterial){if(o.material.map)o.material.map.dispose();o.material.dispose();}});}
  drawCubie(group,data){for(const c of [...group.children]){group.remove(c);if(c.userData.isSticker && c.material!==this.bodyMat){if(c.material.map)c.material.map.dispose();c.material.dispose();}}
    const body=new THREE.Mesh(this.bodyGeo,this.bodyMat);body.userData.sharedMaterial=true;group.add(body);
    for(const normal of faceNormals){const color=data.stickers[normalKey(normal)];if(!color)continue;const sticker=new THREE.Mesh(this.stickerGeo,this.materialFor(color,normal,data,data.stickerMeta?.[normalKey(normal)]));sticker.userData.isSticker=true;sticker.userData.normal=normal;sticker.position.set(normal[0]*.485,normal[1]*.485,normal[2]*.485);sticker.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...normal));group.add(sticker);}
  }
  materialFor(color,normal,data,meta){let mat;
    const face=meta?.face||this.faceForNormal(normal);const tex=this.customTextures[face]||this.customTextures.ALL;
    if(tex){const clone=tex.clone();const n=this.size;const col=meta?.col??0,row=meta?.row??0;
      clone.repeat.set(1/n,1/n);clone.offset.set(col/n,1-(row+1)/n);clone.needsUpdate=true;
      mat=new THREE.MeshStandardMaterial({map:clone,roughness:.42,metalness:.02});}
    else mat=new THREE.MeshStandardMaterial({color:stickerColor(color),roughness:.38,metalness:.02});
    return mat;
  }
  faceForNormal(n){return n[0]===1?'RIGHT':n[0]===-1?'LEFT':n[1]===1?'UP':n[1]===-1?'DOWN':n[2]===1?'FRONT':'BACK';}
  resize(){const w=Math.max(1,this.canvas.parentElement.clientWidth),h=Math.max(1,this.canvas.parentElement.clientHeight);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  loop=()=>{this.frame=requestAnimationFrame(this.loop);this.renderer.render(this.scene,this.camera);};
  renderNow(){this.renderer.render(this.scene,this.camera);}
  move(notation){const task=this.queue.catch(()=>{}).then(()=>this.animateMove(notation));this.queue=task.catch(()=>{});return task;}
  animateMove(notation){return new Promise((resolve,reject)=>{let move;try{move=applyMove(structuredClone(this.state),notation);}catch(e){reject(e);return;}
    const {axis,layers,quarter}=move; const n=this.size; const chosen=this.cubies.filter(g=>layers.includes(g.userData.data[axis])); this.animating=true;this.pivot.rotation.set(0,0,0);this.pivot.position.set(0,0,0);
    for(const g of chosen)this.pivot.attach(g);
    const angle=quarter*Math.PI/2; const start=performance.now();const duration=(this.reducedMotion?30:230)/this.animationSpeed;
    const tick=now=>{const t=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-t,3);this.pivot.rotation[axis]=angle*eased;
      if(t<1){requestAnimationFrame(tick);return;}
      this.pivot.rotation[axis]=angle;this.pivot.updateMatrixWorld(true);
      for(const g of chosen){const pos=g.getWorldPosition(new THREE.Vector3());const q=g.getWorldQuaternion(new THREE.Quaternion());this.root.attach(g);g.position.copy(pos);g.quaternion.copy(q);}
      this.pivot.rotation.set(0,0,0);
      // Commit the canonical state and rebuild transforms from integer coordinates.
      this.state=applyMove(this.state,notation);
      for(const g of chosen){const d=this.state.cubies.find(c=>c.id===g.userData.cubieId);g.userData.data=d;g.position.set((d.x-(n-1)/2)*this.spacing,(d.y-(n-1)/2)*this.spacing,(d.z-(n-1)/2)*this.spacing);g.quaternion.identity();this.drawCubie(g,d);}
      this.animating=false;this.renderNow();resolve(move);
    };requestAnimationFrame(tick);
  });}
  setSize(size){this.build(size);}
  setCameraView(view){const p={front:[0,0,12],back:[0,0,-12],left:[-12,0,0],right:[12,0,0],top:[0,12,.01],bottom:[0,-12,.01],reset:[7,6,9]}[view]||[7,6,9];this.camera.position.set(...p);this.camera.lookAt(0,0,0);}
  zoom(factor){this.camera.position.multiplyScalar(factor);const len=this.camera.position.length();if(len<5)this.camera.position.setLength(5);if(len>22)this.camera.position.setLength(22);}
  attachControls(){this.canvas.addEventListener('pointerdown',e=>{if(this.animating)return;this.drag={x:e.clientX,y:e.clientY,moved:false};this.canvas.setPointerCapture?.(e.pointerId);});this.canvas.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>2)this.drag.moved=true;if(this.drag.moved){const offset=this.camera.position.clone();const spherical=new THREE.Spherical().setFromVector3(offset);spherical.theta-=dx*.006;spherical.phi-=dy*.006;spherical.phi=Math.max(.18,Math.min(Math.PI-.18,spherical.phi));this.camera.position.setFromSpherical(spherical);this.camera.lookAt(0,0,0);this.drag.x=e.clientX;this.drag.y=e.clientY;}});const end=()=>this.drag=null;this.canvas.addEventListener('pointerup',end);this.canvas.addEventListener('pointercancel',end);this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY>0?1.08:.92);},{passive:false});}
  applyImage(file,mode='ALL'){return new Promise((resolve,reject)=>{if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type)){reject(new Error('Choose a PNG, JPEG, or WebP image.'));return;}if(file.size>12*1024*1024){reject(new Error('Image must be smaller than 12 MB.'));return;}const url=URL.createObjectURL(file);const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');const cover=Math.max(1024/image.width,1024/image.height);const w=image.width*cover,h=image.height*cover;ctx.drawImage(image,(1024-w)/2,(1024-h)/2,w,h);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=this.renderer.capabilities.getMaxAnisotropy();this.customTextures[mode]=tex;this.imageMode=mode;for(const g of this.cubies)this.drawCubie(g,g.userData.data);URL.revokeObjectURL(url);resolve();};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('The image could not be opened.'));};image.src=url;});}
  clearImages(){for(const t of Object.values(this.customTextures))t.dispose();this.customTextures={};for(const g of this.cubies)this.drawCubie(g,g.userData.data);}
  dispose(){cancelAnimationFrame(this.frame);this.observer?.disconnect();this.renderer.dispose();this.clearRoot();}
}
