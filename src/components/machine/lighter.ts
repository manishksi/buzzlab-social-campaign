import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EXHALES, FINALE_A, FINALE_B, P_KEYS, blank, previewParams, scenePoints, scrollParams, type ScenePreview } from "@/components/film/character";
import { filmClock } from "@/lib/film-clock";
import { clamp, hash, invLerp, lerp, smooth } from "@/lib/math";
import { anchorWorld, applyPose, blink, breathe, grip, look, makePerson, openMouth, POSES, reach, type Person, type Pose } from "./people";

/**
 * ACT 04 → the end of Phase 03, in 3D: the same man, the same story, now a real person.
 *
 * He stands in the dark on the right of the frame, a flip-top lighter in his left hand and an unlit
 * cigarette in the corner of his mouth. Spark → Flame → Light plays out on him: the thumb rolls
 * the wheel (sparks, no flame), the lighter catches and its flame becomes the light of the scene,
 * he lights the cigarette, and it burns down while the phase is read. At the end he takes it from
 * his lips, drops it, steps on it, and the ember goes out.
 *
 * Every state comes from the 2D film's timeline (film/character.ts → scrollParams), so the page,
 * the hover previews in ACT 04 and the ignite transition all work exactly as before. The camera
 * floats: slow push-ins from one focal point to the next — lighter → flame → face → the fall.
 */

const ease = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
const DEG = Math.PI / 180;

// the lighter (m): body, lid and thickness
const LW = 0.038;
const LHB = 0.036;
const LHL = 0.021;
const LD = 0.013;
// the cigarette (m)
const CIG_LEN = 0.084;
const CIG_FILTER = 0.022;
const CIG_R = 0.0039;

type Shot = { t: number; L: THREE.Vector3; az: number; el: number; d: number };
type Puff = { m: THREE.Mesh; mat: THREE.MeshBasicMaterial; seed: number };
type Spark = { p: THREE.Vector3; v: THREE.Vector3; life: number; max: number };

function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const radial = (stops: [number, string][]) =>
  tex(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (const [k, c] of stops) r.addColorStop(k, c);
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
  });

/** a soft, uneven wisp for smoke */
function wispTexture(seed: number) {
  return tex(128, 128, (g, w, h) => {
    for (let i = 0; i < 14; i++) {
      const x = w * (0.3 + hash(seed * 31 + i) * 0.4);
      const y = h * (0.25 + hash(seed * 17 + i * 3) * 0.5);
      const r = w * (0.12 + hash(seed * 7 + i * 5) * 0.2);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(255,255,255,0.22)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    }
  });
}

/** brushed metal: fine horizontal streaks (used as a roughness map) */
function brushedTexture() {
  const t = tex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = "#7a7a7a";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        const y = hash(i * 3.1) * h;
        const v = 90 + Math.round(hash(i * 7.7) * 80);
        g.fillStyle = `rgba(${v},${v},${v},0.5)`;
        g.fillRect(hash(i * 1.3) * w - 40, y, 30 + hash(i * 5.3) * 160, 1);
      }
    },
    false,
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** the chimney: a metal sheet with rows of round holes (cut out with alphaTest) */
function chimneyTexture() {
  return tex(
    128,
    96,
    (g, w, h) => {
      g.fillStyle = "#fff";
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "destination-out";
      for (let r = 0; r < 2; r++)
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          g.arc(w * (0.2 + i * 0.2), h * (0.38 + r * 0.3), w * 0.055, 0, Math.PI * 2);
          g.fill();
        }
    },
    false,
  );
}

/** the striker wheel's knurling */
function knurlTexture() {
  const t = tex(
    128,
    16,
    (g, w, h) => {
      for (let x = 0; x < w; x += 4) {
        g.fillStyle = "#2a2a2a";
        g.fillRect(x, 0, 2, h);
        g.fillStyle = "#9a9a9a";
        g.fillRect(x + 2, 0, 2, h);
      }
    },
    false,
  );
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

const FLAME_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FLAME_FRAG = /* glsl */ `
uniform float uTime;
uniform float uOn;
uniform float uSway;
varying vec2 vUv;
void main() {
  float y = vUv.y;
  float x = (vUv.x - 0.5) * 2.0;
  // the flame licks: the tip sways and the body breathes
  x -= uSway * y * y * 1.4 + sin(uTime * 13.0 + y * 7.0) * 0.05 * y;
  float fl = 1.0 + 0.07 * sin(uTime * 19.0) + 0.04 * sin(uTime * 31.0 + 1.0);
  float yy = y / max(0.001, uOn * fl);
  float r = 0.95 * pow(clamp(yy * 1.7, 0.0, 1.0), 0.42) * pow(clamp(1.0 - yy, 0.0, 1.0), 0.75);
  float body = smoothstep(r, r * 0.35, abs(x)) * step(yy, 1.0);
  float core = smoothstep(r * 0.55, 0.0, abs(x)) * smoothstep(0.06, 0.26, yy) * smoothstep(0.78, 0.32, yy);
  float blue = smoothstep(0.3, 0.02, yy) * smoothstep(r * 1.1, r * 0.25, abs(x));
  vec3 col = mix(vec3(1.0, 0.42, 0.06), vec3(1.0, 0.78, 0.36), smoothstep(0.95, 0.25, yy)) * body;
  col += vec3(1.0, 0.95, 0.82) * core * 0.85;
  col = mix(col, vec3(0.16, 0.32, 1.0) * 0.8, blue * 0.7 * (1.0 - core));
  gl_FragColor = vec4(col * min(1.0, uOn * 1.4), 1.0);
}`;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _m1 = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _q = new THREE.Quaternion();

/** World rotation of a hand whose fingers point along `fingers` and palm faces `palm` (as orientHand). */
function handQuat(side: "L" | "R", fingers: THREE.Vector3, palm: THREE.Vector3, out: THREE.Quaternion) {
  _a.set(0, -1, 0);
  _b.set(side === "L" ? -1 : 1, 0, 0);
  _c.crossVectors(_a, _b);
  _m1.makeBasis(_a, _b, _c);
  _a.copy(fingers).normalize();
  _b.copy(palm).addScaledVector(_a, -palm.dot(_a)).normalize();
  _c.crossVectors(_a, _b);
  _m2.makeBasis(_a, _b, _c).multiply(_m1.transpose());
  return out.setFromRotationMatrix(_m2);
}

function setHandWorld(p: Person, side: "L" | "R", q: THREE.Quaternion) {
  const wr = p.j[side === "L" ? "wristL" : "wristR"];
  wr.parent!.getWorldQuaternion(_q).invert();
  wr.quaternion.copy(_q).multiply(q);
  wr.updateMatrixWorld(true);
}

export class LighterScene {
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(24, 1, 0.01, 60);
  private w = 1;
  private h = 1;
  private tall = false;
  private man!: Person;
  /** his eye height; the whole shot is laid out from it */
  private E = 1.65;
  private shots: Shot[] = [];

  // the lighter
  private lighter = new THREE.Group();
  private lid = new THREE.Group();
  private wheel!: THREE.Mesh;
  private wick = new THREE.Vector3(0.0005, 0.0125, 0);
  private wheelAt = new THREE.Vector3(-0.0125, 0.0158, 0);
  private flame!: THREE.Mesh;
  private flameU = { uTime: { value: 0 }, uOn: { value: 0 }, uSway: { value: 0 } };
  private flameGlow!: THREE.Mesh;
  private metal: THREE.MeshStandardMaterial[] = [];

  // the cigarette
  private cig = new THREE.Group();
  private paper!: THREE.Mesh;
  private ash!: THREE.Mesh;
  private tipEnd!: THREE.Mesh;
  private emberMat!: THREE.MeshBasicMaterial;
  private emberGlow!: THREE.Mesh;
  private cigDirLocal = new THREE.Vector3(0.25, -0.24, 1).normalize();

  // smoke and sparks
  private ribbons: Puff[] = [];
  private exhale: Puff[] = [];
  private sparks: Spark[] = [];
  private sparkGeo = new THREE.BufferGeometry();
  private sparkPos = new Float32Array(64 * 3);
  private sparkCol = new Float32Array(64 * 3);

  // light
  private key!: THREE.SpotLight;
  private fill!: THREE.PointLight;
  private emberLight!: THREE.PointLight;
  private flashLight!: THREE.PointLight;
  private rim!: THREE.SpotLight;
  private rimLow!: THREE.SpotLight;
  private moon!: THREE.SpotLight;
  private street!: THREE.SpotLight;
  private hemi!: THREE.HemisphereLight;
  private haze!: THREE.MeshBasicMaterial;
  private bokeh: { m: THREE.Mesh; mat: THREE.MeshBasicMaterial; a: number; seed: number }[] = [];

  // the step at the end
  private hang = new THREE.Vector3();
  private hangQ = new THREE.Quaternion();
  private G = new THREE.Vector3();
  private floorDir = new THREE.Vector3(0.82, 0, -0.57).normalize();

  // preview blending and discrete events (as the 2D film)
  private kind: ScenePreview = null;
  private since = 0;
  private mixW = 0;
  private prev = blank();
  private strikePhase = 0;
  private strikeT = 1;
  private flash = 0;
  private lastFlame = 0;
  private wheelSpin = 0;
  private lastClock = -1;
  private seed = 1;

  // scratch
  private v1 = new THREE.Vector3();
  private v2 = new THREE.Vector3();
  private v3 = new THREE.Vector3();
  private f = new THREE.Vector3();
  private n = new THREE.Vector3();
  private bq = new THREE.Quaternion();
  private Qh = new THREE.Quaternion();
  private Ql = new THREE.Quaternion();
  private P = new THREE.Vector3();
  private Lk = new THREE.Vector3();
  private F = new THREE.Vector3();
  private D = new THREE.Vector3();
  private tip = new THREE.Vector3();
  private flameAt = new THREE.Vector3();
  private mouth = new THREE.Vector3();
  private mF = new THREE.Vector3();
  private mD = new THREE.Vector3();

  constructor(private renderer: THREE.WebGLRenderer, private opts: { lowPower: boolean }) {
    const pm = new THREE.PMREMGenerator(renderer);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.background = new THREE.Color(0x000000);
    this.build(env);
  }

  private build(env: THREE.Texture) {
    const s = this.scene;

    // ---- the man ----
    const man = makePerson({ sex: "m", outfit: "suit", top: 0x17181b, bottom: 0x141518, hair: "short04", hairColor: 0x1d1814, shoes: "boots" });
    this.man = man;
    s.add(man.root);
    man.root.updateMatrixWorld(true);
    this.E = anchorWorld(man, "eyeL", new THREE.Vector3()).y;
    man.j.wristL.getWorldPosition(this.hang);
    man.j.wristL.getWorldQuaternion(this.hangQ);
    // where the boot comes down at the end: the ball of his left foot in the forward step
    applyPose(man, POSES.stand, this.stepPose(1, 0, 0));
    man.root.updateMatrixWorld(true);
    man.j.ankleL.getWorldPosition(this.G);
    this.G.set(this.G.x + 0.01, CIG_R, this.G.z + 0.12);
    applyPose(man, POSES.stand);

    // ---- floor and the dark around him ----
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x4a4a4e, roughness: 0.5, metalness: 0, envMap: env, envMapIntensity: 0.04 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    s.add(floor);
    this.haze = new THREE.MeshBasicMaterial({ map: radial([[0, "rgba(70,68,64,1)"], [0.45, "rgba(36,35,33,0.55)"], [1, "rgba(0,0,0,0)"]]), transparent: true, depthWrite: false, opacity: 0.5 });
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), this.haze);
    const back = new THREE.Vector3(Math.sin(58 * DEG), 0, Math.cos(58 * DEG));
    haze.position.copy(back).multiplyScalar(-6.5).add(new THREE.Vector3(0, this.E - 0.2, 0));
    haze.lookAt(back.clone().multiplyScalar(3).setY(this.E));
    s.add(haze);
    const disc = radial([[0, "rgba(255,255,255,0.9)"], [0.7, "rgba(255,255,255,0.75)"], [0.86, "rgba(255,255,255,0.25)"], [1, "rgba(255,255,255,0)"]]);
    for (let i = 0; i < 10; i++) {
      const warm = hash(i + 19) > 0.4;
      const mat = new THREE.MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: warm ? 0xffb35c : 0x9fb4d0, opacity: 0 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      const depth = 5 + hash(i + 3) * 4;
      const side = new THREE.Vector3(back.z, 0, -back.x); // screen-right, roughly
      m.position.copy(back).multiplyScalar(-depth).addScaledVector(side, -0.6 + hash(i + 5) * 3.2).setY(this.E - 1.1 + hash(i + 7) * 2.6);
      m.scale.setScalar(0.18 + hash(i + 13) * 0.36);
      m.lookAt(back.clone().multiplyScalar(3).setY(this.E));
      s.add(m);
      this.bokeh.push({ m, mat, a: 0.05 + hash(i + 17) * 0.09, seed: i });
    }

    // ---- light: the flame is the key; everything else only keeps him out of the black ----
    this.hemi = new THREE.HemisphereLight(0x2a3444, 0x050505, 0.05);
    s.add(this.hemi);
    this.key = new THREE.SpotLight(0xffbf80, 0, 3.5, 1.15, 1, 1.6);
    this.key.castShadow = !this.opts.lowPower;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.near = 0.015;
    this.key.shadow.camera.far = 3;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.002;
    this.key.shadow.radius = 3;
    s.add(this.key, this.key.target);
    this.fill = new THREE.PointLight(0xffb070, 0, 2.5, 1.5);
    this.emberLight = new THREE.PointLight(0xff8a40, 0, 1.2, 2);
    this.flashLight = new THREE.PointLight(0xffd9a0, 0, 1.2, 1.6);
    s.add(this.fill, this.emberLight, this.flashLight);
    // a cool edge from behind him, so the profile reads before there's any flame
    this.rim = new THREE.SpotLight(0xa9bbd6, 0, 6, 0.32, 0.8, 1.2);
    this.rim.position.set(-0.75, this.E + 0.75, -1.9);
    this.rim.target.position.set(0, this.E - 0.05, 0);
    this.rimLow = new THREE.SpotLight(0x8fa2bf, 0, 6, 0.42, 0.9, 1.2);
    this.rimLow.position.set(-0.4, this.E - 0.2, -2.1);
    this.rimLow.target.position.set(0.12, this.E - 0.55, 0);
    // moonlight: just enough to find his face in the dark before there's a flame
    this.moon = new THREE.SpotLight(0x8494ad, 0, 8, 0.3, 1, 1.2);
    this.moon.position.set(2.6, this.E + 1.4, 2.2);
    this.moon.target.position.set(0.05, this.E - 0.25, 0.05);
    s.add(this.moon, this.moon.target);
    // and, for the floor at the end, a far-off street light
    this.street = new THREE.SpotLight(0xb9c4d6, 0, 7, 0.5, 1, 1.2);
    this.street.position.set(this.G.x + 0.15, 2.4, this.G.z + 0.25);
    this.street.target.position.copy(this.G);
    s.add(this.rim, this.rim.target, this.rimLow, this.rimLow.target, this.street, this.street.target);

    // ---- the lighter: brushed steel, flip-top lid on a hinge, chimney, knurled wheel ----
    const brushed = brushedTexture();
    brushed.repeat.set(1, 3);
    const steel = new THREE.MeshStandardMaterial({ color: 0xc8c6c2, metalness: 1, roughness: 0.32, roughnessMap: brushed, envMap: env, envMapIntensity: 0.4 });
    const polished = new THREE.MeshStandardMaterial({ color: 0xd6d4d0, metalness: 1, roughness: 0.16, envMap: env, envMapIntensity: 0.4 });
    const chim = new THREE.MeshStandardMaterial({ color: 0xbdbab4, metalness: 1, roughness: 0.22, alphaMap: chimneyTexture(), alphaTest: 0.5, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.4 });
    const knurl = knurlTexture();
    knurl.repeat.set(6, 1);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x8a8884, metalness: 1, roughness: 0.4, map: knurl, envMap: env, envMapIntensity: 0.3 });
    this.metal.push(steel, polished, chim, wheelMat);
    const body = new THREE.Mesh(new RoundedBoxGeometry(LW, LHB, LD, 3, 0.0032), steel);
    body.position.y = -LHB / 2;
    const seam = new THREE.Mesh(new THREE.BoxGeometry(LW * 1.002, 0.0006, LD * 1.002), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6, roughness: 0.6 }));
    seam.position.y = -0.0003;
    // the insert: a thin steel lip standing out of the body, the chimney on it
    const insert = new THREE.Mesh(new THREE.BoxGeometry(LW * 0.9, 0.0035, LD * 0.86), polished);
    insert.position.y = 0.0017;
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.0135, LD * 0.8, 1, 1, 1), chim);
    chimney.position.set(-0.002, 0.0035 + 0.0068, 0);
    const wickM = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0015, 0.006, 8), new THREE.MeshStandardMaterial({ color: 0x3a2f25, roughness: 1 }));
    wickM.position.set(this.wick.x, this.wick.y - 0.003, 0);
    this.wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0036, 0.0052, 24, 1), wheelMat);
    this.wheel.rotation.x = Math.PI / 2;
    this.wheel.position.copy(this.wheelAt);
    const ears = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.006, LD * 0.84), polished);
    ears.position.set(this.wheelAt.x, this.wheelAt.y - 0.004, 0);
    const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, LD * 0.82, 12), polished);
    cam.rotation.x = Math.PI / 2;
    cam.position.set(LW / 2 - 0.006, 0.006, 0);
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, LD * 0.5, 12), polished);
    hinge.rotation.x = Math.PI / 2;
    hinge.position.set(LW / 2 - 0.0005, 0, 0);
    // the lid hinges on the end away from the wheel and swings forward
    this.lid.position.set(LW / 2, 0, 0);
    const lidM = new THREE.Mesh(new RoundedBoxGeometry(LW, LHL, LD, 3, 0.0032), steel);
    lidM.position.set(-LW / 2, LHL / 2, 0);
    const lidIn = new THREE.Mesh(new THREE.PlaneGeometry(LW * 0.92, LD * 0.86), new THREE.MeshStandardMaterial({ color: 0x0b0b0b, metalness: 0.5, roughness: 0.7, side: THREE.DoubleSide }));
    lidIn.rotation.x = Math.PI / 2;
    lidIn.position.set(-LW / 2, 0.0004, 0);
    this.lid.add(lidM, lidIn);
    this.lighter.add(body, seam, insert, chimney, wickM, this.wheel, ears, cam, hinge, this.lid);
    this.lighter.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    s.add(this.lighter);

    // the flame: a shader teardrop that always faces the camera, and a soft halo
    this.flame = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0),
      new THREE.ShaderMaterial({ uniforms: this.flameU, vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.flame.scale.set(0.017, 0.046, 1);
    this.flameGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: radial([[0, "rgba(255,190,90,0.55)"], [0.3, "rgba(255,150,50,0.18)"], [1, "rgba(255,120,30,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    );
    s.add(this.flame, this.flameGlow);

    // ---- the cigarette: filter, paper, the burning end ----
    const filter = new THREE.Mesh(new THREE.CylinderGeometry(CIG_R * 1.02, CIG_R * 1.02, CIG_FILTER, 18).translate(0, CIG_FILTER / 2, 0), new THREE.MeshStandardMaterial({ color: 0xc89b62, roughness: 0.75 }));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(CIG_R * 1.03, CIG_R * 1.03, 0.0012, 18).translate(0, CIG_FILTER, 0), new THREE.MeshStandardMaterial({ color: 0xd8c08a, metalness: 0.4, roughness: 0.5 }));
    this.paper = new THREE.Mesh(new THREE.CylinderGeometry(CIG_R, CIG_R, 1, 18, 1, true).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.62, emissive: 0x0d0c0b }));
    this.paper.position.y = CIG_FILTER;
    this.tipEnd = new THREE.Mesh(new THREE.CircleGeometry(CIG_R, 18).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 1 }));
    this.ash = new THREE.Mesh(new THREE.CylinderGeometry(CIG_R * 0.96, CIG_R * 0.99, 0.004, 18).translate(0, 0.002, 0), new THREE.MeshStandardMaterial({ color: 0x77736d, roughness: 1 }));
    this.emberMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
    const ember = new THREE.Mesh(new THREE.SphereGeometry(CIG_R * 0.98, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.emberMat);
    ember.scale.y = 0.5;
    ember.position.y = 0.004;
    this.ash.add(ember);
    this.emberGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: radial([[0, "rgba(255,120,40,0.6)"], [0.35, "rgba(255,80,20,0.15)"], [1, "rgba(255,60,10,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    );
    this.cig.add(filter, band, this.paper, this.tipEnd, this.ash);
    s.add(this.cig, this.emberGlow);

    // ---- smoke ----
    const wisps = [0, 1, 2].map(wispTexture);
    const nR = this.opts.lowPower ? 10 : 18;
    for (let i = 0; i < nR; i++) {
      const mat = new THREE.MeshBasicMaterial({ map: wisps[i % 3], transparent: true, depthWrite: false, opacity: 0 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      s.add(m);
      this.ribbons.push({ m, mat, seed: i });
    }
    for (let i = 0; i < (this.opts.lowPower ? 8 : 14); i++) {
      const mat = new THREE.MeshBasicMaterial({ map: wisps[(i + 1) % 3], transparent: true, depthWrite: false, opacity: 0 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      s.add(m);
      this.exhale.push({ m, mat, seed: i });
    }

    // ---- sparks off the wheel ----
    this.sparkGeo.setAttribute("position", new THREE.BufferAttribute(this.sparkPos, 3));
    this.sparkGeo.setAttribute("color", new THREE.BufferAttribute(this.sparkCol, 3));
    const sparkPts = new THREE.Points(
      this.sparkGeo,
      new THREE.PointsMaterial({ size: 0.0045, map: radial([[0, "rgba(255,255,255,1)"], [0.4, "rgba(255,255,255,0.6)"], [1, "rgba(255,255,255,0)"]]), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    );
    sparkPts.frustumCulled = false;
    s.add(sparkPts);

    // ---- the camera's shot list (film time) ----
    const E = this.E;
    const G = this.G;
    const S = (t: number, x: number, y: number, z: number, az: number, el: number, d: number): Shot => ({ t, L: new THREE.Vector3(x, y, z), az: az * DEG, el, d });
    this.shots = [
      // ACT 04: we meet him — head, shoulders, the lighter in his hand
      S(0.42, 0.06, E - 0.2, 0.12, 58, 0.04, 2.2),
      S(0.47, 0.06, E - 0.21, 0.13, 58, 0.04, 2.05),
      S(0.515, 0.08, E - 0.27, 0.19, 56, 0.05, 1.75),
      // SPARK: a slow push in on the lighter and the thumb on the wheel
      S(0.56, 0.11, E - 0.365, 0.3, 52, 0.08, 0.9),
      S(0.588, 0.11, E - 0.36, 0.31, 50, 0.09, 0.78),
      // FLAME: it catches, close; then the light finds his face
      S(0.604, 0.095, E - 0.285, 0.3, 50, 0.1, 0.74),
      S(0.63, 0.08, E - 0.17, 0.26, 56, 0.06, 1.0),
      // LIGHT: the flame meets the cigarette, in profile
      S(0.662, 0.05, E - 0.095, 0.19, 70, 0.03, 0.8),
      S(0.688, 0.05, E - 0.09, 0.18, 71, 0.03, 0.76),
      S(0.738, 0.04, E - 0.08, 0.11, 66, 0.03, 0.92),
      S(0.775, 0.04, E - 0.1, 0.09, 62, 0.04, 1.18),
      S(0.93, 0.05, E - 0.13, 0.08, 57, 0.05, 1.5),
      // the last cigarette: take, lower, drop — the camera follows it down to the floor
      S(0.946, 0.05, E - 0.13, 0.08, 57, 0.05, 1.5),
      S(0.966, 0.09, E - 0.16, 0.14, 56, 0.05, 1.12),
      S(0.986, 0.17, E - 0.36, 0.22, 54, 0.08, 1.05),
      S(0.999, 0.22, E - 0.6, 0.26, 52, 0.16, 1.1),
      S(1.016, G.x, G.y + 0.06, G.z, 48, 0.6, 1.2),
      S(1.06, G.x, G.y + 0.04, G.z, 46, 0.64, 0.95),
      S(1.2, G.x, G.y + 0.04, G.z, 46, 0.64, 0.95),
    ];
  }

  /** the left leg: 0 standing → 0.5 lifted → 1 planted forward; then the grind and the lift away */
  private stepPose(step: number, stub: number, lift: number): Pose {
    const up = Math.sin(clamp(step) * Math.PI);
    const k = smooth(0, 1, step);
    const hipL = -0.24 * k - 0.32 * up - 0.06 * lift;
    const kneeL = 0.02 * k + 0.85 * up + 0.85 * lift;
    // the sole stays flat on the floor, toes dipping a little while the foot is in the air
    const ankleL = -(hipL + kneeL) + 0.14 * up + 0.3 * lift;
    const grind = Math.sin(stub * Math.PI * 4) * 0.13 * (1 - lift);
    const sink = 0.026 * k * (1 - lift * 0.6);
    const a = 0.24 * k * (1 - lift * 0.6);
    return {
      hipY: this.man.hipY - sink,
      hipL: [hipL, grind, 0],
      kneeL: [kneeL, 0, 0],
      ankleL: [ankleL, 0, 0],
      hipR: [-a, 0, 0],
      kneeR: [a * 2, 0, 0],
      ankleR: [-a, 0, 0],
    };
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.tall = w / h < 1;
    this.cam.aspect = w / h;
    this.cam.fov = this.tall ? 36 : 24;
    this.frame(0);
  }

  /** keep him on the right (desktop) or lower right (phones): the words keep the left */
  private frame(centre: number) {
    const { w, h, tall } = this;
    const k = 1 - centre;
    this.cam.setViewOffset(w, h, (tall ? -w * 0.04 : -w * 0.21) * k, (tall ? -h * 0.12 : 0) * k, w, h);
    this.cam.updateProjectionMatrix();
  }

  private camAt(t: number, clock: number, pointer: { x: number; y: number }) {
    const S = this.shots;
    let i = 0;
    while (i < S.length - 2 && t > S[i + 1].t) i++;
    const a = S[i];
    const b = S[i + 1];
    const e = ease(clamp((t - a.t) / (b.t - a.t)));
    this.Lk.lerpVectors(a.L, b.L, e);
    const az = lerp(a.az, b.az, e);
    const el = lerp(a.el, b.el, e);
    const d = lerp(a.d, b.d, e) * (this.tall ? 1.22 : 1);
    // a slow float, never more than a few millimetres a second
    const fx = (Math.sin(clock * 0.23) * 0.6 + Math.sin(clock * 0.11 + 2) * 0.4) * 0.006 * d + pointer.x * 0.012 * d;
    const fy = (Math.sin(clock * 0.19 + 1) * 0.6 + Math.sin(clock * 0.07) * 0.4) * 0.004 * d + pointer.y * 0.008 * d;
    this.P.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(this.Lk);
    this.P.x += fx * Math.cos(az);
    this.P.z -= fx * Math.sin(az);
    this.P.y += fy;
    this.cam.position.copy(this.P);
    this.cam.lookAt(this.Lk);
  }

  render(_w: number, clock: number, pointer: { x: number; y: number }) {
    const t = filmClock.t;
    const dt = this.lastClock < 0 ? 1 / 60 : clamp(clock - this.lastClock, 0, 0.1);
    this.lastClock = clock;
    const r = this.renderer;

    if (t < 0.42 || t >= FINALE_B) {
      this.sparks.length = 0;
      scenePoints.flame.x = scenePoints.ember.x = -1;
      filmClock.heat = 0;
      r.setRenderTarget(null);
      r.setClearColor(0x000000, 1);
      r.clear();
      return;
    }

    // ---- state: scroll, with ACT 04's hover preview blended over it (as the 2D film) ----
    const scroll = scrollParams(t);
    const allowPreview = t > 0.42 && t < 0.52 ? filmClock.preview : null;
    if (allowPreview !== this.kind) {
      if (allowPreview) {
        this.since = 0;
        if (allowPreview === "spark") this.strikePhase = 1;
      }
      this.kind = allowPreview;
    }
    this.since += dt;
    this.mixW += ((this.kind ? 1 : 0) - this.mixW) * Math.min(1, dt * 5);
    if (this.kind) {
      const target = previewParams(this.kind, this.since);
      const k = Math.min(1, dt * 7);
      for (const key of P_KEYS) this.prev[key] += (target[key] - this.prev[key]) * k;
    }
    const p = blank();
    for (const key of P_KEYS) p[key] = lerp(scroll[key], this.prev[key], this.mixW);
    p.present = Math.max(scroll.present, this.mixW);
    const pres = p.present * (1 - p.fade);

    // discrete events: wheel strikes and the moment it catches
    this.strikePhase += p.strike * dt;
    if (this.strikePhase >= 1) {
      this.strikePhase = 0;
      this.strikeT = 0;
    }
    const prevStrike = this.strikeT;
    this.strikeT = Math.min(1, this.strikeT + dt / 0.16);
    const sparkNow = prevStrike < 0.35 && this.strikeT >= 0.35;
    const igniting = this.lastFlame < 0.06 && p.flame >= 0.06;
    this.lastFlame = p.flame;
    this.flash *= Math.exp(-dt * 12);
    const thumbRoll = this.strikeT < 1 ? Math.sin(this.strikeT * Math.PI) : 0;

    const flicker = 0.9 + 0.06 * Math.sin(clock * 21) + 0.04 * Math.sin(clock * 33 + 1.3);
    const If = p.flame * flicker * p.hand;
    const breathEmber = 0.05 * Math.sin(clock * 1.7) + 0.03 * Math.sin(clock * 3.1);
    const Ie = p.lit * (0.2 + 0.65 * p.drag + breathEmber) * (1 - p.out);
    const u = invLerp(FINALE_A, FINALE_B, t);

    // ---- him ----
    const man = this.man;
    const E = this.E;
    let exh = 0;
    for (const [a, b, size] of EXHALES) if (t > a && t < b) exh = Math.max(exh, Math.sin(invLerp(a, b, t) * Math.PI) * size * (1 - this.mixW));
    applyPose(
      man,
      POSES.stand,
      {
        head: [0.13 * p.lean + 0.03 * p.drag - 0.04 * exh, -0.05 * p.lean, 0],
        neck: [0.06 * p.lean, 0, 0],
        spine: [0.03 * p.lean + 0.04 * p.tilt, 0, 0],
      },
      this.stepPose(p.step, p.stub, p.lift),
    );
    breathe(man, clock, 0.6, 0.45);
    blink(man, clock, 2.1);
    const flameLook = clamp(p.flame * p.hand * 1.4) * (1 - p.lean * 0.3);
    look(man, 0.05 * flameLook, 0.22 * flameLook + 0.12 * p.lean + 0.25 * p.lower);
    openMouth(man, 0.06 * exh + 0.015 * p.drag);
    man.root.updateMatrixWorld(true);

    // the cigarette in his mouth (filter end in the corner of the lips)
    const burnLen = CIG_LEN - (CIG_LEN - CIG_FILTER - 0.005) * p.burn;
    anchorWorld(man, "cornerL", this.mouth);
    man.j.head.getWorldQuaternion(this.bq);
    const mouthF = this.mF.copy(this.mouth);
    const mouthD = this.mD.copy(this.cigDirLocal).applyQuaternion(this.bq);
    this.F.copy(mouthF);
    this.D.copy(mouthD);

    // ---- the lighter hand ----
    this.lighter.visible = p.hand > 0.01 && pres > 0.001;
    if (p.hand > 0.001) {
      // where the wick should be for each pose: rest · spark · flame · at the cigarette
      this.tip.copy(mouthF).addScaledVector(mouthD, burnLen);
      const poses = [
        [0.12, E - 0.5, 0.3],
        [0.11, E - 0.37, 0.31],
        [0.1, E - 0.3, 0.3],
        [this.tip.x - 0.003, this.tip.y - 0.024, this.tip.z + 0.004],
      ];
      const pi = clamp(p.pose, 0, 3);
      const i0 = Math.min(2, Math.floor(pi));
      const f0 = smooth(0, 1, pi - i0);
      const T = this.v3.set(lerp(poses[i0][0], poses[i0 + 1][0], f0), lerp(poses[i0][1], poses[i0 + 1][1], f0), lerp(poses[i0][2], poses[i0 + 1][2], f0));
      T.y += Math.sin(clock * 0.8) * 0.002;
      // fingers forward, palm in, thumb up on the wheel
      this.f.set(-0.05 - 0.1 * clamp(pi - 2), 0.12, 1).normalize();
      this.n.set(-1, 0, -0.2).normalize();
      handQuat("L", this.f, this.n, this.Qh);
      const wrist = this.wristForWick(T, this.Qh, new THREE.Vector3());
      // coming up from his side
      const up = smooth(0, 1, p.hand);
      wrist.lerpVectors(this.hang, wrist, up);
      const q = this.Ql.copy(this.hangQ).slerp(this.Qh, up);
      reach(man, "L", wrist, this.v1.set(1, -1.1, -0.2));
      setHandWorld(man, "L", q);
      grip(man, "L", lerp(0.3, 0.74, up), lerp(0.3, 0.22 + thumbRoll * 0.5, up));
      this.placeLighter(p.lid, thumbRoll);
    }

    // ---- the last cigarette: fingers take it, lower it, drop it ----
    if (u > 0 && p.hand < 0.01) this.finaleHand(p, u, mouthF, mouthD);

    // ---- the cigarette ----
    if (p.fall > 0) this.cigFall(p);
    this.cig.position.copy(this.F);
    if (p.land > 0) {
      // lying on the floor: build a frame whose x axis is up, so the boot can flatten it
      this.v1.set(0, 1, 0);
      this.v3.crossVectors(this.v1, this.D);
      _m1.makeBasis(this.v1, this.D, this.v3);
      this.cig.quaternion.setFromRotationMatrix(_m1);
    } else this.cig.quaternion.setFromUnitVectors(this.v1.set(0, 1, 0), this.D);
    if (p.fall > 0 && p.land <= 0) {
      // tumbling: a full turn on the way down
      this.cig.quaternion.premultiply(_q.setFromAxisAngle(this.v1.set(this.D.z, 0, -this.D.x).normalize(), p.fall * Math.PI * 2));
    }
    const crush = p.stub;
    this.cig.scale.set(1 - crush * 0.55, 1 - crush * 0.22, 1 + crush * 0.7);
    this.cig.visible = pres > 0.001;
    this.paper.scale.y = Math.max(0.0001, burnLen - CIG_FILTER);
    this.ash.position.y = burnLen;
    this.tipEnd.position.y = burnLen;
    this.ash.visible = p.lit > 0.02;
    this.tipEnd.visible = !this.ash.visible;
    const ember = Ie * pres;
    this.emberMat.color.setRGB(1.0, 0.28 + 0.25 * clamp(ember), 0.06).multiplyScalar(0.25 + ember * 2.2);
    this.cig.updateMatrixWorld(true);
    this.ash.localToWorld(this.tip.set(0, 0.006, 0));
    this.emberGlow.visible = ember > 0.005;
    this.emberGlow.position.copy(this.tip);
    this.emberGlow.scale.setScalar(0.03 + ember * 0.05);
    (this.emberGlow.material as THREE.MeshBasicMaterial).opacity = clamp(ember * 1.6);

    // ---- the flame: the light of the scene ----
    const fl = If * pres;
    this.lighter.localToWorld(this.flameAt.copy(this.wick));
    this.flame.visible = this.lighter.visible && fl > 0.01;
    this.flame.position.copy(this.flameAt);
    this.flameU.uTime.value = clock;
    this.flameU.uOn.value = clamp(p.flame * p.hand);
    this.flameU.uSway.value = Math.sin(clock * 2.7) * 0.12 + Math.sin(clock * 6.9) * 0.05;
    this.flameGlow.visible = this.flame.visible;
    this.flameGlow.position.copy(this.flameAt).y += 0.02;
    this.flameGlow.scale.setScalar(0.2 * fl + 0.02);
    (this.flameGlow.material as THREE.MeshBasicMaterial).opacity = clamp(fl * 0.8);
    if (sparkNow && p.hand > 0.3) {
      this.flash = Math.max(this.flash, 0.35);
      this.emitSparks(9);
    }
    if (igniting && p.hand > 0.3) {
      this.flash = 0.6;
      this.emitSparks(14);
    }

    // the key light sits in the flame and looks at his face
    const flameHeart = this.v1.copy(this.flameAt).add(this.v2.set(0, 0.022, 0));
    this.key.position.copy(flameHeart);
    anchorWorld(man, "nose", this.key.target.position);
    this.key.target.updateMatrixWorld();
    // the closer the flame comes to his face the brighter it gets — but only so much (an iris)
    const toFace = this.key.position.distanceTo(this.key.target.position);
    this.key.intensity = 0.85 * fl * clamp(toFace / 0.28, 0.45, 1.3);
    this.key.castShadow = !this.opts.lowPower && fl > 0.02;
    // the fill sits out toward the camera, so the hand round the lighter glows rather than burns
    this.fill.position.copy(flameHeart).add(this.v2.set(0.09, 0.07, 0.06));
    this.fill.intensity = 0.07 * fl;
    this.emberLight.position.copy(this.tip);
    this.emberLight.intensity = 0.022 * ember + 0.004 * p.lit * (1 - p.out) * pres;
    this.lighter.localToWorld(this.flashLight.position.copy(this.wheelAt)).y += 0.01;
    this.flashLight.intensity = 0.5 * this.flash * pres;
    this.rim.intensity = 5 * pres * (1 - 0.55 * p.tilt);
    this.rimLow.intensity = 2.2 * pres;
    this.moon.intensity = 2 * pres * (1 - 0.5 * clamp(fl * 2)) * (1 - p.tilt);
    this.street.intensity = 14 * pres * smooth(0.3, 0.9, p.tilt);
    this.hemi.intensity = 0.05 * pres;
    for (const m of this.metal) m.envMapIntensity = (0.3 + 0.6 * clamp(fl + this.flash)) * pres;
    this.haze.opacity = 0.42 * pres * (1 - 0.6 * p.tilt);
    for (const b of this.bokeh) b.mat.opacity = b.a * pres * (0.85 + 0.15 * Math.sin(clock * 0.6 + b.seed * 2)) * (1 - 0.7 * p.tilt);

    // ---- camera ----
    this.camAt(t, clock, pointer);
    // the last cigarette plays on an empty page: the frame comes back to the centre for it
    this.frame(smooth(0, 0.3, u));
    this.flame.rotation.set(0, Math.atan2(this.cam.position.x - this.flameAt.x, this.cam.position.z - this.flameAt.z), 0);
    this.flameGlow.quaternion.copy(this.cam.quaternion);
    this.emberGlow.quaternion.copy(this.cam.quaternion);

    // ---- smoke and sparks ----
    this.smoke(p, clock, pres, exh);
    this.updateSparks(dt, pres);

    // where the flame and the ember are on screen (the ignite transition grows out of them)
    this.v1.copy(this.flameAt).add(this.v2.set(0, 0.02, 0)).project(this.cam);
    scenePoints.flame.x = (this.v1.x * 0.5 + 0.5) * this.w;
    scenePoints.flame.y = (-this.v1.y * 0.5 + 0.5) * this.h;
    this.v1.copy(this.tip).project(this.cam);
    scenePoints.ember.x = (this.v1.x * 0.5 + 0.5) * this.w;
    scenePoints.ember.y = (-this.v1.y * 0.5 + 0.5) * this.h;
    filmClock.heat = clamp(If * 0.35 + Ie * 0.12) * pres;

    r.setRenderTarget(null);
    r.render(this.scene, this.cam);
  }

  /** the wrist position that puts the lighter's wick at `T` with the hand turned to `q` */
  private wristForWick(T: THREE.Vector3, q: THREE.Quaternion, out: THREE.Vector3) {
    // lighter in hand frame: along the fingers, into the palm, up toward the thumb
    const f = _a.set(0, -1, 0).applyQuaternion(q);
    const n = _b.set(-1, 0, 0).applyQuaternion(q);
    const up = _c.crossVectors(f, n).negate();
    return out
      .copy(T)
      .addScaledVector(f, -(0.074 + this.wick.x))
      .addScaledVector(n, -(0.0115 + this.wick.z))
      .addScaledVector(up, -(0.04 + this.wick.y));
  }

  /** the lighter sits in the left hand: its frame comes from the wrist's */
  private placeLighter(lid: number, roll: number) {
    const wr = this.man.j.wristL;
    wr.getWorldQuaternion(this.Qh);
    wr.getWorldPosition(this.v3);
    const f = this.f.set(0, -1, 0).applyQuaternion(this.Qh);
    const n = this.n.set(-1, 0, 0).applyQuaternion(this.Qh);
    const up = this.v2.crossVectors(f, n).negate();
    _m1.makeBasis(f, up, n);
    this.Ql.setFromRotationMatrix(_m1);
    this.lighter.position.copy(this.v3).addScaledVector(f, 0.074).addScaledVector(n, 0.0115).addScaledVector(up, 0.04);
    this.lighter.quaternion.copy(this.Ql);
    this.lid.rotation.z = -lid * 2.35;
    this.wheelSpin += roll * 0.25;
    this.wheel.rotation.y = this.wheelSpin;
    this.lighter.updateMatrixWorld(true);
  }

  /** the end: the left hand comes up, takes the cigarette, lowers it and lets go */
  private finaleHand(p: ReturnType<typeof blank>, u: number, mouthF: THREE.Vector3, mouthD: THREE.Vector3) {
    const man = this.man;
    // the cigarette's path while it's in his fingers (filter end F, direction D)
    const awayF = this.v3.copy(mouthF).add(_a.set(0.12, -0.2, 0.15));
    const awayD = _b.set(0.5, 0.08, 1).normalize();
    const lowF = _c.set(0.24, 1.02, 0.27);
    const lowD = new THREE.Vector3(0.85, -0.12, 0.5).normalize();
    this.F.copy(mouthF).lerp(awayF, smooth(0, 1, p.away)).lerp(lowF, smooth(0, 1, p.lower));
    this.D.copy(mouthD).lerp(awayD, smooth(0, 1, p.away)).lerp(lowD, smooth(0, 1, p.lower)).normalize();
    // the hand: comes up from below and pinches the filter at its fingertips (so it never covers
    // his mouth), then turns forward as it lowers
    const fingers = this.f.set(0.02, 1, 0.08).lerp(_a.set(0.2, 0.75, 0.6), smooth(0, 1, p.away)).lerp(_b.set(0.15, -0.25, 1), smooth(0, 1, p.lower)).normalize();
    const palm = this.n.copy(this.D).negate();
    handQuat("L", fingers, palm, this.Qh);
    const pinch = this.v2.copy(this.F).addScaledVector(this.D, 0.011);
    const wrist = pinch.addScaledVector(fingers, -0.148).addScaledVector(palm, 0.012);
    // coming up from his side (take), going back down after the drop
    const raise = smooth(0, 1, p.take);
    const back = smooth(0.46, 0.66, u);
    const w = new THREE.Vector3().lerpVectors(this.hang, wrist, raise * (1 - back));
    const q = new THREE.Quaternion().slerpQuaternions(this.hangQ, this.Qh, raise * (1 - back));
    reach(man, "L", w, this.v1.set(1, -1.2, -0.3));
    setHandWorld(man, "L", q);
    const hold = raise * (1 - smooth(0, 0.35, p.fall));
    grip(man, "L", lerp(0.3, 0.28, hold), lerp(0.3, 0.7, hold));
  }

  /** the drop: from his fingers to the floor in front of his left boot, a turn on the way */
  private cigFall(p: ReturnType<typeof blank>) {
    const f = clamp(p.fall);
    const restF = this.v3.copy(this.G).addScaledVector(this.floorDir, -0.045);
    const startY = this.F.y;
    this.F.x = lerp(this.F.x, restF.x, f);
    this.F.z = lerp(this.F.z, restF.z, f);
    this.F.y = lerp(startY, restF.y, f * f);
    this.D.lerp(this.floorDir, f).normalize();
    if (p.land > 0) {
      const l = clamp(p.land);
      const bounce = Math.sin(l * Math.PI) * 0.018 * (1 - l);
      this.F.copy(restF).addScaledVector(this.floorDir, -0.012 * l);
      this.F.y = CIG_R + bounce;
      this.D.copy(this.floorDir);
      this.D.applyAxisAngle(_a.set(0, 1, 0), Math.sin(l * 9) * 0.06 * (1 - l));
    }
  }

  private emitSparks(n: number) {
    const at = this.lighter.localToWorld(this.v1.copy(this.wheelAt).add(this.v2.set(0.002, 0.003, 0)));
    for (let i = 0; i < n && this.sparks.length < 64; i++) {
      this.seed++;
      const r1 = hash(this.seed);
      const r2 = hash(this.seed + 0.37);
      const r3 = hash(this.seed + 0.71);
      const max = 0.18 + r1 * 0.32;
      this.sparks.push({ p: at.clone(), v: new THREE.Vector3((r2 - 0.5) * 0.5, 0.25 + r3 * 0.55, 0.12 + r1 * 0.45), life: max, max });
    }
  }

  private updateSparks(dt: number, pres: number) {
    let i = 0;
    for (const s of this.sparks) {
      s.life -= dt;
      s.v.y -= 1.6 * dt;
      s.v.multiplyScalar(1 - dt * 1.5);
      s.p.addScaledVector(s.v, dt);
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
    for (const s of this.sparks) {
      const k = (s.life / s.max) * pres;
      this.sparkPos.set([s.p.x, s.p.y, s.p.z], i * 3);
      this.sparkCol.set([2 * k, 1.35 * k, 0.6 * k], i * 3);
      i++;
    }
    this.sparkGeo.setDrawRange(0, i);
    this.sparkGeo.attributes.position.needsUpdate = true;
    this.sparkGeo.attributes.color.needsUpdate = true;
  }

  private smoke(p: ReturnType<typeof blank>, clock: number, pres: number, exh: number) {
    const cam = this.cam;
    // a thin ribbon off the burning end, warm by the ember and cool where it catches the rim
    const strength = p.lit * (1 - p.out * 0.85) * pres * (p.land > 0 ? 1 - p.stub * 0.8 : 1 - p.fall);
    const N = this.ribbons.length;
    for (const r of this.ribbons) {
      const k = (clock * 0.16 + r.seed / N) % 1;
      const sway = Math.sin(clock * 0.9 + k * 6 + r.seed) * 0.012 * k + Math.sin(clock * 0.37 + r.seed * 1.7) * 0.03 * k * k;
      r.m.position.set(this.tip.x + sway, this.tip.y + 0.006 + k * 0.34, this.tip.z + sway * 0.6 + k * k * 0.04);
      const sc = 0.012 + k * 0.1;
      r.m.scale.set(sc * 0.7, sc * 1.4, 1);
      r.m.quaternion.copy(cam.quaternion);
      r.m.rotateZ(Math.sin(r.seed * 2.1 + clock * 0.2) * 0.4);
      r.mat.opacity = Math.pow(Math.sin(k * Math.PI), 1.3) * 0.5 * strength * (1 - k * 0.5);
      r.mat.color.setRGB(lerp(0.95, 0.5, k), lerp(0.62, 0.56, k), lerp(0.42, 0.62, k));
      r.m.visible = r.mat.opacity > 0.002;
    }
    // breath: smoke out of the mouth, pushed forward and up
    let e = -1;
    let size = 1;
    for (const [a, b, s] of EXHALES) if (filmClock.t > a && filmClock.t < b) {
      e = invLerp(a, b, filmClock.t);
      size = s;
    }
    let alpha = pres * (1 - this.mixW);
    if (this.kind === "light" || (this.mixW > 0.01 && this.prev.lit > 0.5)) {
      const ep = invLerp(1.25, 3.1, this.since);
      if (ep > 0 && ep < 1) {
        e = ep;
        size = 1;
        alpha = pres * this.mixW;
      }
    }
    anchorWorld(this.man, "mouth", this.mouth);
    const fwd = this.v2.set(0, 0, 1).applyQuaternion(this.bq);
    const M = this.exhale.length;
    for (const x of this.exhale) {
      if (e < 0) {
        x.m.visible = false;
        continue;
      }
      // a stream: puffs strung out from the lips, densest close to them
      const d = clamp(e * 1.5 - (x.seed / M) * 0.55);
      const spread = (hash(x.seed + 4) - 0.5) * 0.08 * d;
      x.m.position.copy(this.mouth).addScaledVector(fwd, 0.01 + d * 0.16 * size).add(this.v3.set(spread + d * 0.02, d * 0.06 + (hash(x.seed + 9) - 0.5) * 0.03 * d, spread * 0.5));
      const sc = (0.02 + d * 0.12) * size;
      x.m.scale.set(sc * 1.3, sc * 0.8, 1);
      x.m.quaternion.copy(cam.quaternion);
      x.m.rotateZ(x.seed * 1.3 + d);
      x.mat.opacity = smooth(0, 0.08, d) * (1 - d) * Math.sin(clamp(e) * Math.PI) * 0.22 * alpha;
      x.mat.color.setRGB(0.78, 0.72, 0.7);
      x.m.visible = d > 0 && d < 1 && x.mat.opacity > 0.002;
    }
  }

  dispose() {
    this.scene.traverse((n) => {
      const m = n as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
    filmClock.lighter3d = false;
  }
}
