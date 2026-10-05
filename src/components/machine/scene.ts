import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { contentTextures, imperfections, reelUI, tileSet } from "./textures";
import { cinemaCamera, directorsChair, mats, microphone, playButton, softbox, tile, timeline } from "./props";
import { PHONE, PROFILE, PROFILE_H, cellAt, footageTextures, heroReel, phone, postedTag, profileBars, profileTexture } from "./feed";

/**
 * THE CREATIVE MACHINE — a three.js world driven by one number, `w` (0 → 1), from scroll.
 *
 *  .00 black · a tiny yellow dot pulses
 *  .03 the camera closes in: the dot is a giant physical play button
 *  .12 CLICK — content pours out of it
 *  .23 a camera catches the footage: REC ● · more cameras, a production world
 *  .38 the footage lands on a huge edit timeline; the playhead runs, the program monitor cuts
 *  .545 the edited footage reframes into one finished 9:16 Reel
 *  .575 it is posted ("Shared to @buzzlab.global") and flies into a phone
 *  .64 the Reel plays in the phone, then the phone becomes the future BuzzLab Instagram page
 *  .68 the page scrolls — a few curated posts — and settles on one
 *  .75 that post opens and fills the phone; everything holds
 *  .80 the camera goes into it; the phone falls away; the post becomes the world
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
  [0.5, 37, 1.9, 7.6, 41, -0.7, 0.4],
  [0.545, 52.6, 1.9, 7.6, 56.6, -0.5, 0.4],
  // the edited footage becomes a Reel
  [0.575, 56.9, 1.4, 5.6, 59.5, 1.05, 0],
  [0.6, 58.4, 1.5, 6.4, 60.6, 1.15, 0],
  // it flies into the phone; the phone, right of centre, holds the frame
  [0.64, 66.8, 1.6, 7.9, 68.8, 1.5, 0],
  [0.75, 68.8, 1.55, 7.1, 69.0, 1.5, 0],
  [0.8, 68.95, 1.52, 6.9, 69.1, 1.5, 0],
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
  private floor!: THREE.Mesh;
  // the edit → the Reel → the post
  private cuts: number[] = [];
  private monitor = new THREE.Group();
  private mon: Record<"bezel" | "shot" | "reel" | "ui" | "flash", THREE.Mesh> = {} as never;
  private shots: THREE.Texture[] = [];
  private posted = new THREE.Group();
  private postFill!: THREE.Mesh;
  private postTag!: THREE.Mesh;
  // the phone and the page
  private phone = new THREE.Group();
  private inPhone!: ReturnType<typeof tile>;
  private page!: THREE.Mesh;
  private pageTex!: THREE.CanvasTexture;
  private bars: THREE.Mesh[] = [];
  private hero = new THREE.Group();
  private heroFace!: THREE.Mesh;
  private heroUI!: THREE.Mesh;
  private heroLine!: THREE.Mesh;
  private clip = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
  // world
  private orb!: THREE.Mesh;
  private islands: THREE.Group[] = [];

  constructor(private renderer: THREE.WebGLRenderer, opts: { lowPower: boolean }) {
    this.low = opts.lowPower;
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

    // 03 · the edit: the timeline, and a program monitor riding the playhead
    this.tl = timeline(38);
    this.tl.group.position.set(39, -1.72, 0);
    s.add(this.tl.group);
    this.cuts = this.tl.cuts.map((x) => x + 39).filter((x) => x > 21 && x < 57);
    this.shots = footageTextures();
    const plane = (mat: THREE.Material, z: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      m.position.z = z;
      this.monitor.add(m);
      return m;
    };
    this.mon.bezel = plane(new THREE.MeshBasicMaterial({ color: 0x1c1c1c }), -0.01);
    this.mon.bezel.scale.set(1.04, 1.06, 1);
    this.mon.shot = plane(new THREE.MeshBasicMaterial({ map: this.shots[0], toneMapped: false, transparent: true }), 0);
    const reelTex = heroReel();
    this.mon.reel = plane(new THREE.MeshBasicMaterial({ map: reelTex, toneMapped: false, transparent: true, opacity: 0 }), 0.002);
    this.mon.ui = plane(new THREE.MeshBasicMaterial({ map: reelUI(), toneMapped: false, transparent: true, opacity: 0, depthWrite: false }), 0.004);
    this.mon.flash = plane(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), 0.006);
    s.add(this.monitor);
    // "Shared to @buzzlab.global": a progress bar fills, then the tag
    const track = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.035), new THREE.MeshBasicMaterial({ color: 0x333333 }));
    this.postFill = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.035).translate(0.6, 0, 0), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false }));
    this.postFill.position.set(-0.6, 0, 0.001);
    this.postTag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.225), new THREE.MeshBasicMaterial({ map: postedTag(), transparent: true, toneMapped: false, opacity: 0, depthWrite: false }));
    this.postTag.position.y = -0.22;
    this.posted.add(track, this.postFill, this.postTag);
    s.add(this.posted);

    // 04 · the phone: the Reel plays in it, then it becomes the BuzzLab page
    const { sw, sh } = PHONE;
    this.phone.add(phone());
    this.inPhone = tile(reelTex, 1, 1, reelUI());
    this.inPhone.group.position.z = 0.004;
    (this.inPhone.back.material as THREE.MeshBasicMaterial).transparent = true;
    this.phone.add(this.inPhone.group);
    this.pageTex = profileTexture(T, reelTex.image as HTMLCanvasElement);
    this.pageTex.repeat.set(1, PROFILE.view / PROFILE_H);
    this.page = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: this.pageTex, toneMapped: false, transparent: true, opacity: 0 }));
    this.page.position.z = 0.003;
    this.phone.add(this.page);
    const B = profileBars();
    const topH = (190 / 900) * sw;
    const navH = (130 / 900) * sw;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(sw, topH), new THREE.MeshBasicMaterial({ map: B.top, toneMapped: false, transparent: true, opacity: 0 }));
    top.position.set(0, sh / 2 - topH / 2, 0.007);
    const nav = new THREE.Mesh(new THREE.PlaneGeometry(sw, navH), new THREE.MeshBasicMaterial({ map: B.nav, toneMapped: false, transparent: true, opacity: 0 }));
    nav.position.set(0, -sh / 2 + navH / 2, 0.007);
    this.bars.push(top, nav);
    this.phone.add(top, nav);
    // the post it stops on: a live picture of the world it opens into
    this.heroLine = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false, transparent: true, opacity: 0, clippingPlanes: this.clip }));
    this.heroLine.position.z = -0.001;
    this.heroFace = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.rt.texture, toneMapped: false, clippingPlanes: this.clip }));
    this.heroUI = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: reelUI(), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, clippingPlanes: this.clip }));
    this.heroUI.position.z = 0.001;
    this.hero.add(this.heroLine, this.heroFace, this.heroUI);
    this.hero.position.z = 0.005;
    this.phone.add(this.hero);
    this.phone.position.set(70, 1.5, 0);
    s.add(this.phone);
    this.renderer.localClippingEnabled = true;
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
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------------------------------
  render(w: number, clock: number, pointer: { x: number; y: number }) {
    const T = clock;

    // ---- camera ----
    camAt(Math.min(w, 0.8), this.camState);
    const { p, l } = this.camState;
    p.x += pointer.x * 0.25 * (w > 0.1 ? 1 : 0);
    p.y += pointer.y * 0.15 * (w > 0.1 ? 1 : 0);
    // phones in portrait: the phone comes to the centre and sits back far enough to fit
    if (this.w / this.h < 1 && w > 0.42) {
      // the edit: keep the program monitor in the middle of the narrow frame
      const head = lerp(20.2, 57.5, inv(0.44, 0.545, w)) + 0.7;
      const ed = sm(0.42, 0.46, w) * (1 - sm(0.545, 0.57, w));
      l.x = lerp(l.x, head, ed * 0.8);
      p.x = lerp(p.x, head - 1.5, ed * 0.8);
      // the finished Reel, centred, a step further back
      const rl = sm(0.545, 0.57, w) * (1 - sm(0.6, 0.64, w));
      l.x = lerp(l.x, 59.5, rl);
      p.x = lerp(p.x, 59.5, rl);
      p.z += rl * 2.2;
      const k = sm(0.6, 0.64, w);
      l.x = lerp(l.x, 70, k);
      p.x = lerp(p.x, 70, k);
      p.z = lerp(p.z, 8.6, k);
    }
    // after the hold: into the post on the phone until it fills the frame
    const into = sm(0.8, 0.86, w);
    const fillD = 1.6 / Math.tan(THREE.MathUtils.degToRad(this.cam.fov / 2));
    if (w > 0.8) {
      const e = into * into * (3 - 2 * into);
      p.set(lerp(p.x, 70, e), lerp(p.y, 1.5, e), lerp(p.z, 0.005 + fillD, e));
      l.set(lerp(l.x, 70, e), lerp(l.y, 1.5, e), lerp(l.z, 0.005, e));
    }
    this.cam.position.copy(p);
    this.cam.lookAt(l);
    this.key.position.set(l.x - 4, l.y + 8, l.z + 6);
    this.key.target.position.copy(l);
    (this.scene.fog as THREE.FogExp2).density = 0.03 * sm(0.12, 0.2, w) * (1 - sm(0.6, 0.66, w));

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

    // ---- 03 the edit: the playhead runs, the program monitor cuts ----
    const tlOn = sm(0.4, 0.47, w) * (1 - sm(0.56, 0.6, w));
    this.tl.group.visible = tlOn > 0.001;
    this.tl.group.scale.set(Math.max(0.0001, tlOn), 1, 1);
    this.tl.group.position.x = 20 + 19 * tlOn;
    const run = inv(0.44, 0.545, w);
    const headX = lerp(20.2, 57.5, run);
    this.tl.playhead.position.x = headX - this.tl.group.position.x;
    let passed = 0;
    let lastCut = -99;
    for (const c of this.cuts) if (headX >= c) {
      passed++;
      lastCut = c;
    }
    // each cut changes the picture; the last stretch is the shot the edit was looking for
    const shotIdx = run > 0.86 ? 3 : passed % 3;
    const shotMat = this.mon.shot.material as THREE.MeshBasicMaterial;
    if (shotMat.map !== this.shots[shotIdx]) shotMat.map = this.shots[shotIdx];
    (this.mon.flash.material as THREE.MeshBasicMaterial).opacity = run > 0 && run < 1 ? Math.max(0, 1 - (headX - lastCut) / 0.5) * 0.28 : 0;

    // ---- the edited footage becomes a 9:16 Reel, then it is posted ----
    const monOn = sm(0.43, 0.46, w);
    const toReel = sm(0.545, 0.572, w);
    const fly = sm(0.6, 0.64, w);
    this.monitor.visible = monOn > 0.001 && fly < 1;
    const mw = lerp(2.4, 1.2, toReel);
    const mh = lerp(1.35, 2.133, toReel);
    // riding the playhead → over the end of the timeline → into the phone
    this.phone.updateMatrixWorld(true);
    const slot = this.phone.localToWorld(this.tmp.set(0, 0, 0.004));
    const mx = lerp(Math.min(headX + 0.7, 59.5), 59.5, toReel);
    const my = lerp(-0.25, 1.15, toReel);
    const mz = lerp(1.7, 0.6, toReel);
    this.monitor.position.set(lerp(mx, slot.x, fly), lerp(my, slot.y, fly) + Math.sin(fly * Math.PI) * 0.9, lerp(mz, slot.z, fly));
    this.monitor.rotation.set(0, lerp(0, this.phone.rotation.y, fly), Math.sin(fly * Math.PI) * -0.06);
    this.monitor.scale.set(Math.max(0.0001, lerp(mw, 1.8, fly) * monOn), Math.max(0.0001, lerp(mh, 3.2, fly) * monOn), 1);
    (this.mon.shot.material as THREE.MeshBasicMaterial).opacity = 1 - sm(0.548, 0.566, w);
    (this.mon.reel.material as THREE.MeshBasicMaterial).opacity = sm(0.548, 0.566, w);
    (this.mon.ui.material as THREE.MeshBasicMaterial).opacity = sm(0.566, 0.578, w);
    (this.mon.bezel.material as THREE.MeshBasicMaterial).color.setHex(toReel > 0.5 ? 0x000000 : 0x1c1c1c);
    // "posting…" → "Shared to @buzzlab.global"
    const post = sm(0.578, 0.584, w) * (1 - sm(0.598, 0.606, w));
    this.posted.visible = post > 0.001;
    this.posted.position.set(59.5, 1.15 - 1.2, 0.6);
    this.posted.scale.setScalar(Math.max(0.0001, post));
    this.postFill.scale.x = Math.max(0.0001, inv(0.58, 0.592, w));
    (this.postTag.material as THREE.MeshBasicMaterial).opacity = sm(0.591, 0.596, w);

    // ---- 04 the phone ----
    const up = sm(0.596, 0.64, w);
    this.phone.visible = up > 0.001 && w < 0.88;
    this.phone.position.set(70, lerp(-5.5, 1.5, up), 0);
    const stable = sm(0.74, 0.78, w);
    this.phone.rotation.set(lerp(0.45, 0, up), lerp(-0.4, -0.13, up) * (1 - stable), lerp(0.05, 0, up));
    // the Reel plays in it…
    const toPage = sm(0.664, 0.682, w);
    const ip = this.inPhone.group;
    ip.visible = fly >= 1 && toPage < 1;
    const c0 = cellAt(0, 0);
    const px = PHONE.sw / PROFILE.cw;
    ip.position.set(lerp(0, (c0.x - PROFILE.cw / 2) * px, toPage), lerp(0, PHONE.sh / 2 - c0.y * px, toPage), 0.004);
    ip.scale.set(lerp(1.8, PROFILE.tileW * px, toPage), lerp(3.2, PROFILE.tileH * px, toPage), 1);
    (this.inPhone.ui!.material as THREE.MeshBasicMaterial).opacity = 1 - sm(0.664, 0.672, w);
    // …then the phone is the BuzzLab page, and the page scrolls to one post
    const pageOn = sm(0.664, 0.68, w);
    // (when the post opens, the page behind it goes, as it does on the phone)
    (this.page.material as THREE.MeshBasicMaterial).opacity = pageOn * (1 - sm(0.756, 0.772, w));
    const barsOn = pageOn * (1 - sm(0.8, 0.83, w));
    this.bars.forEach((b) => ((b.material as THREE.MeshBasicMaterial).opacity = barsOn));
    this.page.visible = pageOn > 0.001;
    const hc = cellAt(PROFILE.hero.row, PROFILE.hero.col);
    const stopAt = hc.y - PROFILE.view / 2;
    const sc = inv(0.684, 0.748, w);
    const scroll = stopAt * (sc * sc * sc * (sc * (sc * 6 - 15) + 10));
    this.pageTex.offset.y = 1 - this.pageTex.repeat.y - scroll / PROFILE_H;
    // the post: laid over its cell while the page moves, then it opens and fills the screen
    const open = sm(0.752, 0.776, w);
    const hx = (hc.x - PROFILE.cw / 2) * px;
    const hy = PHONE.sh / 2 - (hc.y - scroll) * px;
    const hw = lerp(PROFILE.tileW * px, PHONE.sw, open);
    const hh = lerp(PROFILE.tileH * px, 3.2, open);
    this.hero.visible = pageOn > 0.5 && w < 0.88;
    this.hero.position.set(lerp(hx, 0, open), lerp(hy, 0, open), 0.005);
    this.heroFace.scale.set(hw, hh, 1);
    this.heroUI.scale.set(hw, hh, 1);
    (this.heroUI.material as THREE.MeshBasicMaterial).opacity = sm(0.772, 0.784, w) * (1 - sm(0.815, 0.835, w));
    const pick = sm(0.744, 0.752, w) * (1 - sm(0.768, 0.778, w));
    this.heroLine.scale.set(hw + 0.05 * pick, hh + 0.05 * pick, 1);
    (this.heroLine.material as THREE.MeshBasicMaterial).opacity = pick;
    // keep the post inside the screen while it scrolls
    this.phone.updateMatrixWorld(true);
    const topY = this.phone.localToWorld(this.tmp.set(0, PHONE.sh / 2 - (190 / 900) * PHONE.sw, 0)).y;
    const botY = this.phone.localToWorld(this.tmp.set(0, -PHONE.sh / 2 + (130 / 900) * PHONE.sw, 0)).y;
    const free = sm(0.776, 0.79, w);
    this.clip[0].constant = topY + free * 50;
    this.clip[1].constant = -botY + free * 50;
    // as the camera arrives, the post widens from 9:16 to the shape of the screen
    const asp = this.w / this.h;
    const grow = sm(0.84, 0.88, w);
    if (w > 0.8) {
      this.heroFace.scale.x = lerp(PHONE.sw, 3.2 * asp * 1.02, grow);
      this.heroFace.scale.y = 3.2 * 1.02;
    }

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
    if (this.hero.visible) {
      // the post shows the world it opens into, at the post's own shape
      this.wcam.aspect = this.heroFace.scale.x / this.heroFace.scale.y;
      this.wcam.updateProjectionMatrix();
      r.setRenderTarget(this.rt);
      r.render(this.world, this.wcam);
      r.setRenderTarget(null);
    }
    r.render(this.scene, this.cam);
  }

  dispose() {
    this.rt.dispose();
  }
}

export { mats };
