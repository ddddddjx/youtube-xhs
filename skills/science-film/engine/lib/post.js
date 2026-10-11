// post.js —— 后期：辉光 + 暗角 + 胶片颗粒 + 轻微色差。颗粒按帧时间算，确定性。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function makeComposer(renderer, scene, camera, W, H, { bloom = .75, radius = .5, threshold = .55, vignette = .55, grain = .02 } = {}) {
  const comp = new EffectComposer(renderer);
  comp.setSize(W, H);
  comp.addPass(new RenderPass(scene, camera));
  const bp = new UnrealBloomPass(new THREE.Vector2(W, H), bloom, radius, threshold);
  comp.addPass(bp);
  const fin = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uV: { value: vignette }, uG: { value: grain }, uAsp: { value: W / H } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uT, uV, uG, uAsp; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uT*43.) * 43758.5453); }
      void main(){ vec2 d = vUv-.5; float r = length(d*vec2(uAsp,1.)/max(uAsp,1.));
        vec3 c; c.r = texture2D(tDiffuse, vUv + d*.0025).r; c.g = texture2D(tDiffuse, vUv).g; c.b = texture2D(tDiffuse, vUv - d*.0025).b;
        c *= 1. - uV*smoothstep(.35, .95, r);
        c += (h(vUv*1000.)-.5)*uG;
        gl_FragColor = vec4(c, 1.); }`,
  });
  comp.addPass(fin);
  comp.addPass(new OutputPass());
  comp.setTime = t => { fin.uniforms.uT.value = Math.floor(t * 12) / 12; };   // 颗粒每秒换 12 次：有胶片感，又不把码率吃光
  comp.bloom = bp;
  return comp;
}
