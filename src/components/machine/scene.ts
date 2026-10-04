import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { contentTextures, imperfections, reelUI, tileSet } from "./textures";
import { cinemaCamera, cursor, directorsChair, feedFrame, mats, microphone, playButton, softbox, tile, timeline } from "./props";

/**
 * THE CREATIVE MACHINE — a three.js world driven by one number, `w` (0 → 1), from scroll.
 *
 *  .00 black · a tiny yellow dot pulses
 *  .03 the camera closes in: the dot is a giant physical play button
 *  .12 CLICK — content pours out of it
 *  .23 a camera catches the footage: REC ● · more cameras, a production world
 *  .38 the footage becomes a huge edit timeline; every cut throws out a piece of content
 *  .52 reels, posts, thumbnails, memes, ads, stories fly to a giant feed — and multiply
 *  .66 controlled creative chaos (every role is an object)
 *  .78 everything stops; one reel is left
 *  .80 the camera goes to it; the frame and UI fall away; it opens into a world
 *  .88 → 1 the world (the IP reveal plays over it)
 *
 * Everything is a pure function of `w` plus a clock for idle motion, so it scrubs both ways.
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const inv = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
const sm = (a: number, b: number, v: number) => {
  const t = inv(a, b, v);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Key = [number, number, number, number, number, number, number];
// [w, camera x, y, z, look x, y, z]
const CAM: Key[] = [
  [0.0, -0.75, 0.2, 320, -0.75, 0.08, 0],
  [0.03, -0.75, 0.2, 260, -0.75, 0.08, 0],
  // close on the button, framed right of centre so the captions keep the lower left
  [0.1, -0.75, 0.2, 5.4, -0.75, 0.08, 0],
  [0.14, -0.3, 0.38, 4.5, -0.65, 0.05, 0],
  [0.2, 3.2, 0.9, 6.6, 4, 0.3, 0],
  [0.26, 8.4, 1.2, 5.8, 12, 0.3, 0],
  [0.32, 10.6, 0.9, 3.4, 12.6, 0.3, 0],
  [0.37, 12.6, 3.2, 9.6, 14, 0, -1],
  [0.42, 19, 1.9, 6.2, 22.5, -1.1, 0],
  [0.5, 34, 2.4, 7.2, 38, -0.9, 0],
  [0.56, 50, 2.5, 7.8, 56, -0.2, 0],
  [0.62, 62, 2.2, 12.5, 70, 1.5, -1],
  [0.7, 63.2, 3.6, 17.5, 70, 1.3, -1],
  [0.77, 67, 2.2, 14.5, 70, 1.4, 0],
  [0.8, 69.4, 1.6, 9.8, 70, 1.5, 3],
];

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function camAt(w: number, out: { p: THREE.Vector3; l: THREE.Vector3 }) {
  if (w <= CAM[0][0]) {
    out.p.set(CAM[0][1], CAM[0][2], CAM[0][3]);
    out.l.set(CAM[0][4], CAM[0][5], CAM[0][6]);
    return;
  }
  let i = 0;
  while (i < CAM.length - 2 && w > CAM[i + 1][0]) i++;
  let a = CAM[Math.max(0, i - 1)];
  const b = CAM[i];
  const c = CAM[i + 1];
  let d = CAM[Math.min(CAM.length - 1, i + 2)];
  // a neighbour far away (the long approach on the dot) would fling the spline; reflect instead
  const dist = (p: Key, q: Key) => Math.hypot(p[1] - q[1], p[2] - q[2], p[3] - q[3]);
  const reflect = (p: Key, q: Key): Key => [p[0], 2 * p[1] - q[1], 2 * p[2] - q[2], 2 * p[3] - q[3], 2 * p[4] - q[4], 2 * p[5] - q[5], 2 * p[6] - q[6]];
  if (dist(a, b) > dist(b, c) * 4) a = reflect(b, c);
  if (dist(c, d) > dist(b, c) * 4) d = reflect(c, b);
  const t = clamp((w - b[0]) / (c[0] - b[0]));
  const v = [1, 2, 3, 4, 5, 6].map((k) => catmull(a[k], b[k], c[k], d[k], t));
  out.p.set(v[0], v[1], v[2]);
  out.l.set(v[3], v[4], v[5]);
  // the long approach on the dot reads best on a log scale
  if (w < 0.1 && w > 0.03) {
    const u = sm(0.03, 0.1, w);
    out.p.z = 5.2 * Math.pow(260 / 5.2, 1 - u);
  }
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.25, "rgba(255,255,255,0.35)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Tile = ReturnType<typeof tile> & { w: number; h: number; kind: string };
export type Label = { id: string; text: string; x: number; y: number; a: number };

export class MachineScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(35, 1, 0.05, 900);
  private world = new THREE.Scene();
  private wcam = new THREE.PerspectiveCamera(48, 1, 0.1, 1200);
  private rt: THREE.WebGLRenderTarget;
  private w = 1;
  private h = 1;
  private low: boolean;
  private T: Record<string, THREE.CanvasTexture>;
  private camState = { p: new THREE.Vector3(), l: new THREE.Vector3() };
  private tmp = new THREE.Vector3();

  // actors
  private button!: ReturnType<typeof playButton>;
  private ring!: THREE.Mesh;
  private buttonLight!: THREE.PointLight;
  private dotGlow!: THREE.Sprite;
  private key!: THREE.DirectionalLight;
  private stream: { t: Tile; seed: number }[] = [];
  private streamCurve!: THREE.CatmullRomCurve3;
  private cams: ReturnType<typeof cinemaCamera>[] = [];
  private kit: THREE.Object3D[] = [];
  private soft!: ReturnType<typeof softbox>;
  private tl!: ReturnType<typeof timeline>;
  private footage: { t: Tile; seed: number }[] = [];
  private cutTiles: { t: Tile; cut: number; slot: THREE.Vector3; seed: number }[] = [];
  private feed!: THREE.Group;
  private swarm: { mesh: THREE.InstancedMesh; seeds: number[] }[] = [];
  private chaos: Record<string, THREE.Object3D> = {};
  private pages: THREE.Mesh[] = [];
  private blade!: THREE.Mesh;
  private split: { l: THREE.Mesh; r: THREE.Mesh; at: THREE.Vector3 }[] = [];
  private flash!: THREE.PointLight;
  private hero!: Tile;
  private heroWorldMat!: THREE.MeshBasicMaterial;
  private floor!: THREE.Mesh;
  // world
  private orb!: THREE.Mesh;
  private islands: THREE.Group[] = [];

  constructor(private canvas: HTMLCanvasElement, opts: { lowPower: boolean }) {
    this.low = opts.lowPower;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.low, alpha: false, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = !this.low;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.rt = new THREE.WebGLRenderTarget(this.low ? 360 : 720, this.low ? 640 : 1280, { colorSpace: THREE.SRGBColorSpace });

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0);

    this.T = contentTextures();
    this.build();
    this.buildWorld();
  }

  // ------------------------------------------------------------------------------------------
  private build() {
    const s = this.scene;
    const T = this.T;
    s.add(new THREE.HemisphereLight(0xa8a8a0, 0x050505, 0.55));
    this.key = new THREE.DirectionalLight(0xfff6e6, 2.4);
    this.key.castShadow = !this.low;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.camera.left = -7;
    this.key.shadow.camera.right = 7;
    this.key.shadow.camera.top = 7;
    this.key.shadow.camera.bottom = -7;
    this.key.shadow.bias = -0.0005;
    s.add(this.key, this.key.target);
    const rim = new THREE.DirectionalLight(0xd8e0ff, 0.8);
    rim.position.set(-6, 4, -10);
    s.add(rim);

    // an infinite black floor that only catches shadows
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.55 }));
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -1.75;
    this.floor.receiveShadow = true;
    s.add(this.floor);

    // 01 · the play button
    this.button = playButton(imperfections());
    s.add(this.button.group);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.02, 1.08, 96), new THREE.MeshBasicMaterial({ color: 0xf9fe02, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false }));
    s.add(this.ring);
    this.dotGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xf9fe02, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    this.dotGlow.scale.setScalar(9);
    s.add(this.dotGlow);
    this.buttonLight = new THREE.PointLight(0xf9fe02, 0, 12, 1.6);
    this.buttonLight.position.set(0, 1.6, 1.2);
    s.add(this.buttonLight);

    // content pouring out of it, on its way to the first camera
    this.streamCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0.3),
      new THREE.Vector3(1.4, 0.5, 2.6),
      new THREE.Vector3(4.8, 1.0, 2.2),
      new THREE.Vector3(8.6, 0.6, 0.8),
      new THREE.Vector3(11.4, 0.2, 0.02),
    ]);
    const set = tileSet(T);
    const n = this.low ? 14 : 24;
    for (let i = 0; i < n; i++) {
      const d = set[i % set.length];
      const t = tile(d.tex, d.w * 0.32, d.h * 0.32);
      s.add(t.group);
      this.stream.push({ t: { ...t, w: d.w, h: d.h, kind: d.kind }, seed: i });
    }

    // 02 · cameras and a small production world
    const c1 = cinemaCamera(T);
    c1.group.position.set(13, 0.2, 0);
    const c2 = cinemaCamera(T);
    c2.group.position.set(16.2, 0.5, -2.6);
    c2.group.rotation.y = 0.9;
    const c3 = cinemaCamera(T);
    c3.group.position.set(10.6, 0.7, -3.4);
    c3.group.rotation.y = -0.6;
    this.cams.push(c1, c2, c3);
    this.cams.forEach((c) => s.add(c.group));
    this.soft = softbox();
    this.soft.group.position.set(16.4, 1.2, 1.6);
    this.soft.group.rotation.y = -1.9;
    s.add(this.soft.group);
    const boom = microphone();
    boom.position.set(12.4, 2.3, 0.9);
    boom.rotation.z = 0.15;
    s.add(boom);
    const chair = directorsChair(T);
    chair.position.set(15, -1.75, 2.2);
    chair.rotation.y = -0.7;
    s.add(chair);
    this.kit.push(this.soft.group, boom, chair);

    // footage leaving the camera for the edit
    for (let i = 0; i < (this.low ? 8 : 14); i++) {
      const d = set[(i + 3) % set.length];
      const t = tile(d.tex, d.w * 0.3, d.h * 0.3);
      s.add(t.group);
      this.footage.push({ t: { ...t, w: d.w, h: d.h, kind: d.kind }, seed: i });
    }

    // 03 · the edit
    this.tl = timeline(38);
    this.tl.group.position.set(39, -1.72, 0);
    s.add(this.tl.group);
    const cuts = this.tl.cuts.map((x) => x + 39).filter((x) => x > 21 && x < 57);
    const slots: THREE.Vector3[] = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) slots.push(new THREE.Vector3(70 - 1.5 + c * 1.5, 1.5 + 3.1 - r * 1.55, -1.95));
    cuts.slice(0, 15).forEach((cx, i) => {
      const d = set[i % set.length];
      const t = tile(d.tex, d.w * 0.8, d.h * 0.8);
      s.add(t.group);
      this.cutTiles.push({ t: { ...t, w: d.w, h: d.h, kind: d.kind }, cut: cx, slot: slots[i], seed: i });
    });

    // 04 · the feed, and everything multiplying around it
    this.feed = feedFrame(4.6, 8);
    this.feed.position.set(70, 1.5, -2.2);
    s.add(this.feed);
    const per = this.low ? 6 : 16;
    set.forEach((d, k) => {
      const geo = new THREE.PlaneGeometry(d.w * 0.7, d.h * 0.7);
      const mat = new THREE.MeshBasicMaterial({ map: d.tex, toneMapped: false, side: THREE.DoubleSide });
      const mesh = new THREE.InstancedMesh(geo, mat, per);
      mesh.frustumCulled = false;
      s.add(mesh);
      this.swarm.push({ mesh, seeds: Array.from({ length: per }, (_, i) => k * 100 + i) });
    });

    // 05 · creative chaos — every role is an object
    const camA = cinemaCamera(T);
    camA.group.position.set(65.2, 3.4, 2.2);
    camA.group.rotation.y = Math.PI;
    camA.legs.visible = false;
    const camEye = cinemaCamera(T, { eye: true });
    camEye.group.position.set(74.6, 3.2, 2.0);
    camEye.legs.visible = false;
    s.add(camA.group, camEye.group);
    this.chaos.camA = camA.group;
    this.chaos.camEye = camEye.group;
    this.chaos.eye = camEye.eye!;
    const stage = tile(T.postPortrait, 2.6, 2.6);
    stage.group.rotation.x = -Math.PI / 2;
    stage.group.position.set(64.6, -0.4, 4.2);
    const chair2 = directorsChair(T);
    chair2.position.set(64.6, -0.39, 4.2);
    chair2.rotation.y = 0.5;
    s.add(stage.group, chair2);
    this.chaos.stage = stage.group;
    this.chaos.chair = chair2;
    const mic = microphone();
    mic.scale.setScalar(1.3);
    mic.position.set(72.6, 5.4, 1.2);
    s.add(mic);
    this.chaos.mic = mic;
    for (let i = 0; i < (this.low ? 4 : 8); i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.82), new THREE.MeshStandardMaterial({ map: T.script, side: THREE.DoubleSide, roughness: 0.8 }));
      s.add(p);
      this.pages.push(p);
    }
    const board = new THREE.Group();
    const bFront = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: T.storyboard, roughness: 0.8 }));
    const bBack = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ map: T.thumb, toneMapped: false }));
    bBack.rotation.y = Math.PI;
    board.add(bFront, bBack);
    board.position.set(76.2, 0.1, 2.6);
    board.rotation.y = -0.5;
    s.add(board);
    this.chaos.board = board;
    const cur = cursor();
    s.add(cur);
    this.chaos.cursor = cur;
    const thrown = tile(T.reelTimer, 0.9, 1.6);
    s.add(thrown.group);
    this.chaos.thrown = thrown.group;
    this.blade = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 9), new THREE.MeshBasicMaterial({ color: 0xf9fe02, transparent: true, toneMapped: false }));
    s.add(this.blade);
    // two pieces the playhead slices in half
    [T.meme, T.ad].forEach((tex, i) => {
      const half = (side: 0 | 1) => {
        const geo = new THREE.PlaneGeometry(0.6, 1.2);
        const uv = geo.attributes.uv as THREE.BufferAttribute;
        for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * 0.5 + side * 0.5);
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }));
        s.add(m);
        return m;
      };
      this.split.push({ l: half(0), r: half(1), at: new THREE.Vector3(66.8 + i * 5.4, 0.6 + i * 1.6, 3.2 - i * 0.6) });
    });
    this.flash = new THREE.PointLight(0xf9fe02, 0, 30, 1.4);
    this.flash.position.set(70, 4, 6);
    s.add(this.flash);

    // the one reel that is left — its picture becomes the world
    this.heroWorldMat = new THREE.MeshBasicMaterial({ map: this.rt.texture, toneMapped: false, transparent: true, opacity: 0 });
    const hero = tile(T.reelHero, 0.9, 1.6, reelUI());
    const worldFace = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), this.heroWorldMat);
    worldFace.position.z = 0.0015;
    hero.group.add(worldFace);
    hero.group.position.set(70, 1.5, 3);
    s.add(hero.group);
    this.hero = { ...hero, w: 0.9, h: 1.6, kind: "Reel" };
    (this.hero as unknown as { worldFace: THREE.Mesh }).worldFace = worldFace;
  }

  private buildWorld() {
    const W = this.world;
    W.background = new THREE.Color(0x000000);
    W.fog = new THREE.FogExp2(0x050503, 0.0065);
    // dunes
    const seg = this.low ? 90 : 170;
    const geo = new THREE.PlaneGeometry(900, 900, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = Math.sin(x * 0.018 + z * 0.006) * 6 + Math.sin(z * 0.031 - x * 0.012) * 3.4 + Math.sin((x + z) * 0.07) * 0.8 - Math.max(0, -z - 200) * 0.02;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x141412, roughness: 0.95, metalness: 0 }));
    W.add(ground);
    // a giant yellow sun low on the horizon — the dot again, grown into a world
    this.orb = new THREE.Mesh(new THREE.SphereGeometry(46, 48, 48), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false, fog: false }));
    this.orb.position.set(0, 26, -520);
    W.add(this.orb);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: (() => {
          const c = document.createElement("canvas");
          c.width = c.height = 256;
          const g = c.getContext("2d")!;
          const r = g.createRadialGradient(128, 128, 30, 128, 128, 128);
          r.addColorStop(0, "rgba(249,254,2,0.55)");
          r.addColorStop(0.4, "rgba(249,254,2,0.12)");
          r.addColorStop(1, "rgba(249,254,2,0)");
          g.fillStyle = r;
          g.fillRect(0, 0, 256, 256);
          const t = new THREE.CanvasTexture(c);
          t.colorSpace = THREE.SRGBColorSpace;
          return t;
        })(),
        transparent: true,
        depthWrite: false,
        fog: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    halo.scale.set(420, 420, 1);
    halo.position.copy(this.orb.position);
    W.add(halo);
    const sun = new THREE.DirectionalLight(0xfaf27a, 2.2);
    sun.position.set(0, 14, -200);
    W.add(sun);
    W.add(new THREE.HemisphereLight(0x2a2a20, 0x000000, 0.4));
    // stars
    const n = this.low ? 500 : 1400;
    const sp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = hash(i) * Math.PI * 2;
      const e = 0.05 + hash(i + 7) * 1.2;
      const r = 600;
      sp[i * 3] = Math.cos(a) * Math.cos(e) * r;
      sp[i * 3 + 1] = Math.sin(e) * r * 0.6 + 20;
      sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r - 200;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    W.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xeeebe3, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.55, fog: false })));
    // floating islands carrying pieces of the machine: the beginnings of a universe
    const T = this.T;
    const rock = new THREE.MeshStandardMaterial({ color: 0x1a1a18, roughness: 0.9, flatShading: true });
    const carry = [
      () => playButton(imperfections()).group,
      () => cinemaCamera(T).group,
      () => directorsChair(T),
      () => tile(T.reelHero, 0.9, 1.6).group,
      () => microphone(),
    ];
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const ig = new THREE.IcosahedronGeometry(2.2, 1);
      const p = ig.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < p.count; k++) {
        const y = p.getY(k);
        p.setY(k, y > 0 ? y * 0.25 : y * 1.3);
        p.setX(k, p.getX(k) * (1 + (hash(k + i * 9) - 0.5) * 0.25));
      }
      ig.computeVertexNormals();
      g.add(new THREE.Mesh(ig, rock));
      const obj = carry[i]();
      obj.scale.setScalar(i === 2 ? 1.1 : 0.9);
      obj.position.y = i === 2 ? 0.55 : 1.4;
      g.add(obj);
      const side = i % 2 ? 1 : -1;
      g.position.set(side * (14 + i * 7), 12 + hash(i + 3) * 14, -60 - i * 48);
      W.add(g);
      this.islands.push(g);
    }
    // someone standing on a crest, looking at the light
    const fig = new THREE.Group();
    const bmat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.2, 6, 12), bmat);
    body.position.y = 1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), bmat);
    head.position.y = 2.05;
    fig.add(body, head);
    fig.position.set(2.5, 7.4, -82);
    W.add(fig);
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------------------------------
  render(w: number, clock: number, pointer: { x: number; y: number }) {
    const T = clock;
    const motion = 1 - sm(0.775, 0.79, w); // everything stops
    const vanish = (seed: number) => 1 - sm(0.782 + (hash(seed) * 0.012), 0.792 + hash(seed) * 0.008, w);

    // ---- camera ----
    camAt(Math.min(w, 0.8), this.camState);
    const { p, l } = this.camState;
    p.x += pointer.x * 0.25 * (w > 0.1 ? 1 : 0);
    p.y += pointer.y * 0.15 * (w > 0.1 ? 1 : 0);
    // after the stop: in to the last reel until it fills the frame
    const into = sm(0.8, 0.88, w);
    const hero = this.hero.group;
    if (w > 0.8) {
      const dist = lerp(6.8, 0.42, into);
      p.set(lerp(p.x, 70, into), lerp(p.y, 1.5, into), 3 + dist);
      l.set(70, 1.5, 3);
    }
    this.cam.position.copy(p);
    this.cam.lookAt(l);
    this.key.position.set(l.x - 4, l.y + 8, l.z + 6);
    this.key.target.position.copy(l);
    (this.scene.fog as THREE.FogExp2).density = 0.03 * sm(0.12, 0.2, w);

    // ---- 01 the dot / play button ----
    const btn = this.button.group;
    const btnOn = 1 - sm(0.34, 0.4, w);
    btn.visible = btnOn > 0.001 && w < 0.42;
    const dotIn = sm(0.004, 0.025, w);
    const press = Math.sin(clamp(inv(0.112, 0.135, w)) * Math.PI);
    btn.scale.setScalar(Math.max(0.0001, dotIn * btnOn));
    btn.position.set(0, Math.sin(T * 0.8) * 0.04 * (1 - sm(0.11, 0.14, w)), -press * 0.16);
    btn.rotation.y = Math.sin(T * 0.5) * 0.05 + (1 - sm(0.06, 0.12, w)) * 0.12;
    const pulse = 0.5 + 0.5 * Math.sin(T * 3.2);
    this.button.material.emissiveIntensity = lerp(1.2 + pulse * 0.8, 0.02, sm(0.05, 0.1, w)) + press * 0.18;
    // as a dot it glows and pulses; up close it is just a physical object
    (this.dotGlow.material as THREE.SpriteMaterial).opacity = dotIn * (0.35 + pulse * 0.4) * (1 - sm(0.045, 0.09, w));
    this.dotGlow.visible = w < 0.1;
    const ring = this.ring.material as THREE.MeshBasicMaterial;
    const rw = inv(0.12, 0.17, w);
    ring.opacity = rw > 0 && rw < 1 ? (1 - rw) * 0.8 : 0;
    this.ring.scale.setScalar(1 + rw * 3.5);
    this.ring.position.z = 0.2;
    this.buttonLight.intensity = (press * 6 + sm(0.1, 0.13, w) * (1 - sm(0.16, 0.24, w)) * 4) * btnOn;

    // content pouring out, on its way to the first camera
    const flow = inv(0.13, 0.3, w);
    this.stream.forEach(({ t, seed }, i) => {
      const s = flow * 1.9 - i * 0.04;
      const on = s > 0 && s < 1 && w < 0.33;
      t.group.visible = on;
      if (!on) return;
      this.streamCurve.getPointAt(clamp(s), this.tmp);
      t.group.position.copy(this.tmp);
      t.group.position.y += Math.sin(seed * 2 + T * 1.3) * 0.12 * (1 - s);
      t.group.position.z += Math.cos(seed * 3) * 0.3 * (1 - s);
      t.group.lookAt(this.cam.position);
      t.group.rotation.z += Math.sin(seed + T) * 0.2 * (1 - s);
      t.group.scale.setScalar(Math.min(1, s * 8) * (1 - sm(0.88, 1, s) * 0.8));
    });

    // ---- 02 cameras ----
    const camOn = sm(0.22, 0.27, w);
    this.cams.forEach((c, i) => {
      const appear = i === 0 ? camOn : sm(0.31 + i * 0.02, 0.35 + i * 0.02, w);
      const gone = 1 - sm(0.47, 0.52, w);
      const v = appear * gone;
      c.group.visible = v > 0.001;
      c.group.scale.setScalar(Math.max(0.0001, v));
      c.group.position.y = [0.2, 0.5, 0.7][i] + (1 - appear) * -0.6;
      const recOn = w > 0.29 + i * 0.03 && Math.sin(T * 5) > -0.3;
      (c.rec.material as THREE.MeshBasicMaterial).opacity = recOn ? 1 : 0.25;
      c.tally.visible = recOn;
    });
    this.kit.forEach((k, i) => {
      const v = sm(0.33 + i * 0.012, 0.37 + i * 0.012, w) * (1 - sm(0.47, 0.52, w));
      k.visible = v > 0.001;
      k.scale.setScalar(Math.max(0.0001, v));
    });
    (this.soft.face.material as THREE.MeshBasicMaterial).color.setScalar(0.85 + Math.sin(T * 9) * 0.03);

    // footage out of the back of the camera, down onto the timeline
    const out = inv(0.37, 0.46, w);
    this.footage.forEach(({ t, seed }, i) => {
      const s = out * 1.6 - i * 0.045;
      const on = s > 0 && s < 1;
      t.group.visible = on;
      if (!on) return;
      const a = new THREE.Vector3(13.6, 0.25, 0);
      const b = new THREE.Vector3(21.5, -1.55, 0.3);
      t.group.position.lerpVectors(a, b, s);
      t.group.position.y += Math.sin(s * Math.PI) * 1.6;
      t.group.rotation.set(-Math.PI / 2 * s, Math.sin(seed) * 0.3, Math.sin(seed * 3 + T) * 0.2);
      t.group.scale.setScalar(Math.min(1, s * 10) * (1 - s * 0.4));
    });

    // ---- 03 the edit ----
    const tlOn = sm(0.4, 0.47, w) * (1 - sm(0.64, 0.7, w));
    this.tl.group.visible = tlOn > 0.001;
    this.tl.group.scale.set(Math.max(0.0001, tlOn), 1, 1);
    this.tl.group.position.x = 20 + 19 * tlOn;
    const headX = lerp(20.2, 57.5, inv(0.44, 0.57, w));
    this.tl.playhead.position.x = headX - this.tl.group.position.x;
    this.cutTiles.forEach(({ t, cut, slot, seed }) => {
      const born = headX >= cut ? 1 : 0;
      const tBorn = 0.44 + ((cut - 20.2) / (57.5 - 20.2)) * 0.13;
      const rise = sm(tBorn, tBorn + 0.025, w) * born;
      const fly = sm(0.55 + (seed % 5) * 0.006, 0.61 + (seed % 5) * 0.006, w);
      const v = rise * vanish(seed + 40);
      t.group.visible = v > 0.001;
      if (!t.group.visible) return;
      const up = new THREE.Vector3(cut, -1.6 + rise * (1.5 + (seed % 3) * 0.4), 0.6 + Math.sin(seed * 1.7) * 0.9 + rise * 0.8);
      t.group.position.lerpVectors(up, slot, fly);
      t.group.position.y += Math.sin(T * 1.2 + seed) * 0.08 * (1 - fly) * motion;
      const spin = (1 - fly) * (Math.sin(seed) * 0.6 + Math.sin(T * 0.7 + seed) * 0.15 * motion);
      t.group.rotation.set(0, spin, (1 - fly) * Math.sin(seed * 2) * 0.25);
      const sc = lerp(1, slot ? (1.42 / Math.max(t.w * 0.8, t.h * 0.8)) * 0.98 : 1, fly);
      t.group.scale.setScalar(Math.max(0.0001, rise * sc * v));
    });

    // ---- 04 the feed, multiplying ----
    const feedOn = sm(0.54, 0.6, w) * vanish(7);
    this.feed.visible = feedOn > 0.001;
    this.feed.scale.setScalar(Math.max(0.0001, lerp(0.85, 1, feedOn)));
    this.feed.position.y = 1.5 - (1 - feedOn) * 2;
    const mult = inv(0.61, 0.7, w);
    const count = Math.floor(Math.pow(2, mult * 7.2));
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const sc = new THREE.Vector3();
    let idx = 0;
    this.swarm.forEach(({ mesh, seeds }) => {
      seeds.forEach((sd, i) => {
        const order = (idx++ * 7) % 128;
        const born = order < count ? 1 : 0;
        const v = born * vanish(sd) * (w < 0.795 ? 1 : 0);
        const r = 4.2 + hash(sd) * 9;
        const a = hash(sd + 1) * Math.PI * 2 + T * 0.05 * motion * (hash(sd + 2) - 0.5);
        const yy = (hash(sd + 3) - 0.5) * 10;
        sc.setScalar(Math.max(0.0001, v * (0.7 + hash(sd + 4) * 0.6)));
        this.tmp.set(70 + Math.cos(a) * r, 1.5 + yy + Math.sin(T * 0.6 + sd) * 0.2 * motion, -2 + Math.sin(a) * r * 0.6 + 1);
        e.set(Math.sin(sd) * 0.4, Math.cos(sd) * 0.6 + T * 0.1 * motion * (hash(sd + 5) - 0.5), Math.sin(sd * 3) * 0.3);
        q.setFromEuler(e);
        m4.compose(this.tmp, q, sc);
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = w > 0.6 && w < 0.8;
    });

    // ---- 05 creative chaos ----
    const ch = sm(0.655, 0.69, w);
    const show = (o: THREE.Object3D, seed: number, extra = 1) => {
      const v = ch * vanish(seed) * extra;
      o.visible = v > 0.001;
      o.scale.setScalar(Math.max(0.0001, v));
      return v;
    };
    // a camera filming a camera, whose lens is an eye that blinks
    show(this.chaos.camA, 1);
    show(this.chaos.camEye, 2);
    this.chaos.camA.position.y = 3.4 + Math.sin(T * 0.9) * 0.15 * motion;
    this.chaos.camEye.position.y = 3.2 + Math.sin(T * 0.9 + 2) * 0.15 * motion;
    const blink = Math.sin(T * 1.7) > 0.96 ? 0.1 : 1;
    this.chaos.eye.scale.set(1, blink, 1);
    // the director's chair, sat on a giant post
    show(this.chaos.stage, 3);
    show(this.chaos.chair, 4);
    // a floating microphone
    show(this.chaos.mic, 5);
    this.chaos.mic.position.y = 5.4 + Math.sin(T * 1.3) * 0.25 * motion;
    this.chaos.mic.rotation.z = Math.sin(T * 0.7) * 0.15 * motion;
    // script pages flying
    this.pages.forEach((pg, i) => {
      const v = show(pg, 10 + i);
      if (v <= 0.001) return;
      const a = T * 0.45 * motion + i * 0.9;
      pg.position.set(68 + Math.cos(a) * (3 + i * 0.3), 1.2 + i * 0.5 + Math.sin(a * 1.3) * 0.6, 2 + Math.sin(a) * 2.2);
      pg.rotation.set(Math.sin(a * 2) * 0.8, a * 1.4, Math.cos(a * 1.7) * 0.6);
    });
    // the storyboard turns round and is already a finished frame
    show(this.chaos.board, 20);
    this.chaos.board.rotation.y = -0.5 + sm(0.715, 0.74, w) * Math.PI;
    // the giant cursor grabs a reel and throws it into the feed
    const grab = inv(0.69, 0.75, w);
    const cur = this.chaos.cursor;
    const reel = this.chaos.thrown;
    show(cur, 21, 1);
    const curPath = (u: number) => {
      if (u < 0.35) return new THREE.Vector3(lerp(60, 66, u / 0.35), lerp(8, 2.2, u / 0.35), 4);
      if (u < 0.6) return new THREE.Vector3(lerp(66, 64.4, (u - 0.35) / 0.25), lerp(2.2, 4.4, (u - 0.35) / 0.25), 4);
      return new THREE.Vector3(lerp(64.4, 66.5, (u - 0.6) / 0.4), lerp(4.4, 5.6, (u - 0.6) / 0.4), 4);
    };
    cur.position.copy(curPath(grab));
    cur.rotation.set(0, 0, 0.35 - grab * 0.4);
    const held = grab > 0.35 && grab < 0.6;
    const thrownT = inv(0.6, 1, grab);
    const rv = show(reel, 22);
    if (rv > 0.001) {
      if (grab <= 0.35) reel.position.set(66.3, 1.2, 3.8);
      else if (held) reel.position.copy(curPath(grab)).add(new THREE.Vector3(0.2, -1.1, -0.1));
      else reel.position.set(lerp(64.6, 70.4, thrownT), lerp(3.3, 2.9, thrownT) + Math.sin(thrownT * Math.PI) * 2.2, lerp(3.9, -1.9, thrownT));
      reel.rotation.set(0, held ? -0.3 : thrownT * Math.PI * 2, held ? 0.2 : 0);
      reel.scale.setScalar(rv * (1 - sm(0.85, 1, thrownT) * 0.6));
    }
    // the playhead slicing through things
    const sweep = inv(0.715, 0.75, w);
    this.blade.visible = sweep > 0 && sweep < 1;
    this.blade.position.set(lerp(62, 79, sweep), 2.6, 3.4);
    (this.blade.material as THREE.MeshBasicMaterial).opacity = Math.sin(sweep * Math.PI);
    this.split.forEach(({ l: L, r: R, at }, i) => {
      const v = ch * vanish(30 + i);
      L.visible = R.visible = v > 0.001;
      if (!L.visible) return;
      const cut = this.blade.position.x > at.x && sweep > 0 ? sm(0, 1, (this.blade.position.x - at.x) / 1.5) : sweep >= 1 ? 1 : 0;
      L.position.set(at.x - 0.3 - cut * 0.35, at.y - cut * 0.25, at.z);
      R.position.set(at.x + 0.3 + cut * 0.35, at.y + cut * 0.2, at.z);
      L.rotation.z = cut * 0.25;
      R.rotation.z = -cut * 0.2;
      L.scale.setScalar(Math.max(0.0001, v));
      R.scale.setScalar(Math.max(0.0001, v));
    });
    // yellow light flashing on the beats
    const beat = Math.max(0, Math.sin(T * 6.2)) ** 18;
    this.flash.intensity = ch * motion * (beat * 60 + 4) * (1 - sm(0.775, 0.785, w));

    // ---- the last reel, then the world inside it ----
    const heroOn = sm(0.6, 0.66, w);
    hero.visible = heroOn > 0.001;
    hero.scale.setScalar(Math.max(0.0001, heroOn));
    hero.position.y = 1.5 + Math.sin(T * 0.6) * 0.05 * (1 - into);
    hero.rotation.y = Math.sin(T * 0.4) * 0.12 * (1 - sm(0.8, 0.84, w));
    const ui = this.hero.ui!.material as THREE.MeshBasicMaterial;
    ui.opacity = 1 - sm(0.82, 0.85, w);
    (this.hero.back.material as THREE.MeshBasicMaterial).opacity = 1;
    this.heroWorldMat.opacity = sm(0.805, 0.835, w);
    // the frame stretches from 9:16 to the shape of the screen as we go in
    const asp = this.w / this.h;
    const grow = sm(0.84, 0.88, w);
    const viewH = 2 * 0.42 * Math.tan(THREE.MathUtils.degToRad(this.cam.fov / 2));
    const fitH = viewH / 1.6;
    const sy = lerp(1, fitH * 1.02, grow);
    const sx = lerp(1, ((viewH * asp) / 0.9) * 1.02, grow);
    if (w > 0.8) hero.scale.set(sx * heroOn, sy * heroOn, 1);

    // world camera: drifting toward the light
    const wf = inv(0.8, 1, w);
    this.wcam.position.set(Math.sin(T * 0.07) * 1.5, 11 + Math.sin(T * 0.3) * 0.25 - wf * 1.5, 40 - wf * 70);
    this.wcam.lookAt(0, 14 + wf * 4, -400);
    this.islands.forEach((g, i) => {
      g.position.y += Math.sin(T * 0.5 + i) * 0.01;
      g.rotation.y = T * 0.05 * (i % 2 ? 1 : -1);
    });

    // ---- render ----
    const r = this.renderer;
    if (w >= 0.88) {
      this.wcam.aspect = asp;
      this.wcam.updateProjectionMatrix();
      r.setRenderTarget(null);
      r.render(this.world, this.wcam);
      return;
    }
    if (w > 0.8) {
      this.wcam.aspect = lerp(0.5625, asp, grow);
      this.wcam.updateProjectionMatrix();
      r.setRenderTarget(this.rt);
      r.render(this.world, this.wcam);
      r.setRenderTarget(null);
    }
    r.render(this.scene, this.cam);
  }

  /** Where the role labels sit on screen during the chaos. */
  labels(w: number): Label[] {
    const a = sm(0.67, 0.69, w) * (1 - sm(0.772, 0.782, w));
    if (a <= 0) return [];
    const at = (o: THREE.Object3D, dy = 0) => {
      o.getWorldPosition(this.tmp);
      this.tmp.y += dy;
      this.tmp.project(this.cam);
      return { x: (this.tmp.x * 0.5 + 0.5) * this.w, y: (-this.tmp.y * 0.5 + 0.5) * this.h, behind: this.tmp.z > 1 };
    };
    const list: [string, string, THREE.Object3D, number][] = [
      ["dop", "DOP — the camera", this.chaos.camA, 0.7],
      ["director", "Director — the chair", this.chaos.chair, 1.8],
      ["editor", "Editor — the playhead", this.blade, 4.2],
      ["copy", "Copywriter — the script", this.pages[0], 0.6],
      ["social", "Social — the feed", this.feed, 4.8],
      ["producer", "Producer — the kit", this.chaos.mic, 0.5],
      ["cd", "Creative director — the storyboard", this.chaos.board, 1.1],
      ["designer", "Designer — every frame", this.split[1].r, 0.9],
    ];
    return list
      .map(([id, text, o, dy]) => {
        const p = at(o, dy);
        return { id, text, x: p.x, y: p.y, a: o.visible && !p.behind ? a : 0 };
      })
      .filter((l) => l.a > 0.01);
  }

  dispose() {
    this.renderer.dispose();
    this.rt.dispose();
  }
}

export { mats };
