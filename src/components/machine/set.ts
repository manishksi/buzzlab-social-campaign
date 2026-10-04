import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { applyPose, blink, breathe, makePerson, POSES, type Person, type Pose } from "./people";
import { cinemaCamera, directorsChair, softbox } from "./props";
import { contentTextures } from "./textures";
import { SET, roleAt } from "./set-time";
import type { Label } from "./worlds";

/**
 * ACT 09 — the miniature set. The whole production on a plinth in the dark, like a model of the
 * studio: director at the monitor, DOP on the camera, lighting at a stand, the producer with the
 * schedule, the editor (the same one from ACT 02) at a station, the creative at the boards,
 * social on the phone and the numbers, and the talent on the cyc. The camera visits each of them
 * in turn; a yellow ring marks who's in focus. Driven by `w` (0 → 1).
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Role = {
  key: string;
  label: string;
  person: Person;
  at: THREE.Vector3;
  /** where the camera stands, relative to the person, when it visits */
  view: THREE.Vector3;
  ring: THREE.Mesh;
  pose: (t: number, d: number) => Pose[];
};

function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class SetScene {
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(30, 1, 0.05, 200);
  private w = 1;
  private h = 1;
  private T = contentTextures();
  private roles: Role[] = [];
  private follow!: THREE.SpotLight;
  private p = new THREE.Vector3();
  private l = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private overview = { p: new THREE.Vector3(1.2, 8.6, 12.5), l: new THREE.Vector3(0, 0.4, -0.2) };
  private phoneGlow!: THREE.MeshBasicMaterial;

  constructor(private renderer: THREE.WebGLRenderer, private opts: { lowPower: boolean }) {
    RectAreaLightUniformsLib.init();
    const pm = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.3;
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.03);
    this.build();
  }

  private person(o: Parameters<typeof makePerson>[0], x: number, z: number, ry: number) {
    const p = makePerson(o);
    p.root.position.set(x, 0.4, z);
    p.root.rotation.y = ry;
    this.scene.add(p.root);
    return p;
  }

  private build() {
    const s = this.scene;
    const T = this.T;
    s.add(new THREE.HemisphereLight(0xb8b8b0, 0x080808, 0.5));
    const key = new THREE.DirectionalLight(0xfff1dc, 1.1);
    key.position.set(4, 9, 6);
    key.castShadow = !this.opts.lowPower;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -7;
    sc.right = 7;
    sc.top = 6;
    sc.bottom = -6;
    key.shadow.bias = -0.0006;
    s.add(key);
    this.follow = new THREE.SpotLight(0xffe9a8, 30, 9, 0.42, 0.6, 1.2);
    s.add(this.follow, this.follow.target);

    // the plinth: a model on a table in the dark, a thin yellow edge
    const plinth = new THREE.Mesh(new RoundedBoxGeometry(10.5, 0.4, 7.6, 4, 0.06), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 }));
    plinth.position.y = 0.2;
    plinth.receiveShadow = true;
    s.add(plinth);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(10.42, 0.012, 7.52), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false }));
    edge.position.y = 0.405;
    s.add(edge);
    const top = new THREE.Mesh(new THREE.BoxGeometry(10.36, 0.02, 7.46), new THREE.MeshStandardMaterial({ color: 0x1c1b1a, roughness: 0.7 }));
    top.position.y = 0.41;
    top.receiveShadow = true;
    s.add(top);
    const Y0 = 0.42;
    const steel = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x1d1a16, roughness: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.4 });

    // the cyc, back right
    const cyc = new THREE.MeshStandardMaterial({ color: 0xdedbd3, roughness: 0.9, side: THREE.DoubleSide });
    const cf = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.8), cyc);
    cf.rotation.x = -Math.PI / 2;
    cf.position.set(1.4, Y0 + 0.005, -2.0);
    cf.receiveShadow = true;
    const cove = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 4.2, 20, 1, true, Math.PI, Math.PI / 2), cyc);
    cove.rotation.z = Math.PI / 2;
    cove.position.set(1.4, Y0 + 0.6, -2.9);
    const cw = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), cyc);
    cw.position.set(1.4, Y0 + 1.8, -3.5);
    s.add(cf, cove, cw);
    const sb = softbox();
    sb.group.position.set(2.9, Y0 + 1.85, -1.4);
    sb.group.lookAt(1.4, Y0 + 1.1, -2.2);
    s.add(sb.group);
    const ra = new THREE.RectAreaLight(0xfff6e8, 9, 0.76, 0.76);
    ra.position.copy(sb.group.position);
    ra.lookAt(1.4, Y0 + 1.1, -2.2);
    s.add(ra);
    const sb2 = softbox();
    sb2.group.position.set(-0.3, Y0 + 1.85, -1.3);
    sb2.group.lookAt(1.4, Y0 + 1.1, -2.2);
    s.add(sb2.group);

    // camera on sticks, pointing at the talent
    const camR = cinemaCamera(T);
    camR.group.scale.setScalar(0.62);
    camR.group.position.set(1.25, Y0 + 1.15, -0.2);
    camR.group.rotation.y = -Math.PI / 2;
    s.add(camR.group);

    // director: chair + monitor
    const dChair = directorsChair(T);
    dChair.position.set(-0.9, Y0, 0.9);
    dChair.rotation.y = Math.PI + 0.5;
    s.add(dChair);
    const mon = new THREE.Group();
    const mb = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.3, 0.04, 2, 0.008), dark);
    const ms = new THREE.Mesh(new THREE.PlaneGeometry(0.47, 0.27), new THREE.MeshBasicMaterial({ map: T.monitor, toneMapped: false }));
    ms.position.z = 0.021;
    const mst = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 8), steel);
    mst.position.y = -0.7;
    mon.add(mb, ms, mst);
    mon.position.set(-1.2, Y0 + 1.35, 0.2);
    mon.rotation.y = 0.5;
    s.add(mon);

    // lighting tech's stand (the one being adjusted is sb)
    // producer's schedule board
    const sched = tex(512, 340, (g, w, h) => {
      g.fillStyle = "#ece9e1";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#111";
      g.font = '800 38px "Big Shoulders Display", sans-serif';
      g.fillText("CALL SHEET — DAY 03", 22, 50);
      g.font = '500 16px "IBM Plex Mono", monospace';
      ["09:00  crew call", "09:45  lighting", "10:30  ROLL — EP.01", "13:00  lunch", "14:00  BTS + stills", "16:30  wrap"].forEach((l, i) => {
        if (i === 2) {
          g.fillStyle = "#f9fe02";
          g.fillRect(18, 74 + i * 40, 300, 30);
        }
        g.fillStyle = "#111";
        g.fillText(l, 24, 96 + i * 40);
      });
    });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.66), new THREE.MeshStandardMaterial({ map: sched, roughness: 0.85 }));
    board.position.set(3.75, Y0 + 1.4, 1.0);
    board.rotation.y = -0.9;
    s.add(board);
    for (const dz of [-0.35, 0.35]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.7, 6), steel);
      leg.position.set(3.75 + dz * Math.sin(0.9) * -1, Y0 + 0.85, 1.0 + dz * Math.cos(0.9));
      s.add(leg);
    }

    // the editor's station, front left
    const desk = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.04, 0.7, 2, 0.01), wood);
    desk.position.set(-3.1, Y0 + 0.74, 1.6);
    desk.castShadow = desk.receiveShadow = true;
    s.add(desk);
    for (const dx of [-0.65, 0.65]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.6), steel);
      leg.position.set(-3.1 + dx, Y0 + 0.36, 1.6);
      s.add(leg);
    }
    const emon = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.38, 0.03, 2, 0.008), dark);
    emon.position.set(-3.1, Y0 + 1.15, 1.32);
    const eedit = tex(512, 288, (g, w, h) => {
      g.fillStyle = "#111";
      g.fillRect(0, 0, w, h);
      g.drawImage(T.reelHero.image as HTMLCanvasElement, 200, 10, 90, 160);
      for (let r = 0; r < 4; r++)
        for (let x = 10; x < w - 10; ) {
          const len = 30 + ((x * 7 + r * 31) % 60);
          g.fillStyle = r === 1 && x % 3 === 0 ? "#d9d400" : r > 2 ? "#2f3a2f" : "#555";
          g.fillRect(x, 185 + r * 24, len - 3, 20);
          x += len;
        }
      g.fillStyle = "#f9fe02";
      g.fillRect(300, 180, 3, 100);
    });
    const escr = new THREE.Mesh(new THREE.PlaneGeometry(0.63, 0.35), new THREE.MeshBasicMaterial({ map: eedit, toneMapped: false }));
    escr.position.set(-3.1, Y0 + 1.15, 1.336);
    const ymat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.006, 0.32), new THREE.MeshStandardMaterial({ color: 0xe8e000, roughness: 0.85 }));
    ymat.position.set(-3.1, Y0 + 0.765, 1.75);
    s.add(emon, escr, ymat);

    // the creative's boards, back left
    const boards = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.3, 0.04, 2, 0.01), new THREE.MeshStandardMaterial({ map: T.storyboard, roughness: 0.85 }));
    boards.position.set(-3.0, Y0 + 1.4, -2.3);
    boards.rotation.y = 0.35;
    s.add(boards);
    for (let i = 0; i < 4; i++) {
      const n = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({ color: 0xf2ea10, roughness: 0.9 }));
      n.position.set(-3.85 + i * 0.5 * Math.cos(0.35), Y0 + 0.62, -2.6 + i * 0.5 * Math.sin(0.35) + 0.32);
      n.rotation.y = 0.35;
      s.add(n);
    }

    // social: a standing table, a phone, a screen of numbers
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 28), wood);
    st.position.set(1.0, Y0 + 1.05, 3.0);
    const stl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.05, 10), steel);
    stl.position.set(1.0, Y0 + 0.52, 3.0);
    s.add(st, stl);
    const scr = new THREE.Group();
    const sb3 = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.45, 0.03, 2, 0.008), dark);
    const dash = tex(512, 300, (g, w, h) => {
      g.fillStyle = "#0e0e0e";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#8a8882";
      g.font = '500 15px "IBM Plex Mono", monospace';
      g.fillText("EP.01 — 48H", 18, 30);
      ["REACH", "3S VIEWS", "WATCH", "COMPLETION", "SHARES", "SAVES", "PROFILE", "FOLLOWS"].forEach((m, i) => {
        const x = 18 + (i % 4) * 124;
        const y = 70 + Math.floor(i / 4) * 116;
        g.fillStyle = "#8a8882";
        g.fillText(m, x, y);
        g.fillStyle = i === 1 ? "#f9fe02" : "#eeebe3";
        g.font = '800 40px "Big Shoulders Display", sans-serif';
        g.fillText(["24.8K", "61%", "11.2s", "38%", "412", "906", "1.3K", "+218"][i], x, y + 46);
        g.font = '500 15px "IBM Plex Mono", monospace';
      });
    });
    const sd = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.42), new THREE.MeshBasicMaterial({ map: dash, toneMapped: false }));
    sd.position.z = 0.017;
    const sdl = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 8), steel);
    sdl.position.y = -0.75;
    scr.add(sb3, sd, sdl);
    scr.position.set(1.25, Y0 + 1.5, 2.25);
    scr.rotation.y = -0.35;
    s.add(scr);

    // ---- the people ----
    const ring = () => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 48), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false, transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      s.add(m);
      return m;
    };
    /** the camera visits from `yaw` degrees off the person's facing, `dist` metres out */
    const add = (key: string, label: string, person: Person, [yaw, dist]: [number, number], pose: Role["pose"]) => {
      const at = person.root.position.clone();
      const r = ring();
      r.position.set(at.x, Y0 + 0.012, at.z);
      const a = person.root.rotation.y + (yaw * Math.PI) / 180;
      const view = new THREE.Vector3(Math.sin(a) * dist, 1.35, Math.cos(a) * dist);
      this.roles.push({ key, label, person, at, view, ring: r, pose });
    };
    const director = this.person({ shirt: 0x0f0f0f, hairStyle: "short", skin: 0xc28f6c, sleeves: "long", hair: 0x3a3a3a }, -0.88, 0.92, Math.PI + 0.5);
    director.root.position.y = Y0 + 0.3;
    add("director", "Director — calls the shot", director, [38, 3.6], (t) => [POSES.sit, { hipY: 0.5, spine: [0.15, 0, 0], shoulderL: [-0.6, 0, 0.3], elbowL: [-1.8, 0, 0], shoulderR: [-0.5, 0, -0.25], elbowR: [-1.1, 0, 0], head: [0.05, Math.sin(t * 0.6) * 0.15, 0] }]);
    const dop = this.person({ shirt: 0x1b1b1b, hairStyle: "short", skin: 0xa36f52, sleeves: "long", hair: 0x0e0a07 }, 1.75, 0.15, Math.PI - 0.3);
    add("dop", "DOP — frames it, rolls", dop, [-80, 3.8], (t) => [POSES.stand, { spine: [0.18, 0, 0], shoulderR: [-1.2, 0, -0.35], elbowR: [-0.95, 0, 0], shoulderL: [-1.1, 0, 0.35], elbowL: [-1.05, 0, 0], head: [0.2, Math.sin(t * 0.4) * 0.05, 0] }]);
    const lighting = this.person({ shirt: 0x2b2b2b, hairStyle: "bun", female: true, skin: 0xb07a5a, hair: 0x120d09, sleeves: "short" }, 2.55, -0.95, 2.48);
    add("lighting", "Lighting — shapes the light", lighting, [-125, 3.6], (t) => [POSES.stand, { shoulderR: [-2.6 - Math.sin(t * 1.3) * 0.08, 0, -0.25], elbowR: [-0.5, 0, 0], shoulderL: [-0.3, 0, 0.2], elbowL: [-0.6, 0, 0], head: [-0.35, 0.2, 0] }]);
    const producer = this.person({ shirt: 0x3a3a3a, hairStyle: "bob", female: true, glasses: true, skin: 0xd2a07e, hair: 0x2b1a12, sleeves: "long" }, 3.1, 1.55, -1.2);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.01), new THREE.MeshStandardMaterial({ map: sched, roughness: 0.8 }));
    producer.j.wristR.add(clip);
    clip.position.set(0, -0.16, 0.05);
    clip.rotation.x = -0.6;
    add("producer", "Producer — keeps the day on time", producer, [28, 3.4], (t) => [POSES.stand, { shoulderR: [-0.9, 0, -0.1], elbowR: [-1.2, 0, 0], shoulderL: [-0.4, 0, 0.2], elbowL: [-1.4, 0, 0], head: [0.25 + Math.sin(t * 0.5) * 0.15, -0.3, 0] }]);
    const editor = this.person({ shirt: 0xf3ec18, oversized: true, headphones: true, hairStyle: "short", skin: 0xb98463 }, -3.1, 2.15, Math.PI);
    add("editor", "Editor — cuts it while it's warm", editor, [145, 3.2], (t) => [POSES.sit, { spine: [0.12, 0, 0], head: [0.06, Math.sin(t * 0.31) * 0.05, 0], shoulderR: [-0.72 + Math.sin(t * 0.9) * 0.03, 0, -0.22], elbowR: [-1.05, 0.25, 0], shoulderL: [-0.68, 0, 0.22], elbowL: [-1.0, -0.2, 0], wristL: [0.3 - (Math.sin(t * 13) * 0.5 + 0.5) * 0.1, 0, -0.1] }]);
    const chair = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.07, 0.44, 2, 0.02), dark);
    chair.position.set(-3.1, Y0 + 0.47, 2.18);
    s.add(chair);
    const creative = this.person({ shirt: 0xeeebe3, hairStyle: "buzz", skin: 0x8a5a3e, pants: 0x2a2a2a }, -2.55, -1.35, -2.7);
    add("creative", "Creative — holds the idea", creative, [62, 3.6], (t) => {
      const pt = Math.max(0, Math.sin(t * 0.7));
      return [POSES.stand, { shoulderL: [-1.5 * pt - 0.1, 0, 0.25 + 0.2 * pt], elbowL: [-0.25 * pt, 0, 0], head: [0, -0.35, 0] }];
    });
    const social = this.person({ shirt: 0x1d1d1d, hairStyle: "bob", female: true, skin: 0x9c6a4c, hair: 0x0f0b08, sleeves: "short" }, 0.45, 2.9, 0.2);
    const phone = new THREE.Group();
    const pb = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.15, 0.009, 2, 0.008), dark);
    this.phoneGlow = new THREE.MeshBasicMaterial({ map: T.reelHero, toneMapped: false });
    const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.067, 0.14), this.phoneGlow);
    ps.position.z = -0.0055;
    ps.rotation.y = Math.PI;
    phone.add(pb, ps);
    social.j.wristR.add(phone);
    phone.position.set(0, -0.11, 0.04);
    phone.rotation.x = -0.4;
    add("social", "Social — posts it, reads the numbers", social, [24, 3.5], (t) => [POSES.stand, { shoulderR: [-1.55, 0, -0.1], elbowR: [-0.9, 0, 0], shoulderL: [-0.3, 0, 0.2], head: [0.35, 0, 0] }]);
    const talent = this.person({ shirt: 0x0e0e0e, hairStyle: "bob", female: true, skin: 0xc9926e, hair: 0x1c120b, sleeves: "long", pants: 0x2e2a26 }, 1.4, -2.15, 0.2);
    add("talent", "Talent — makes you stop", talent, [-18, 4.0], (t) => {
      const g = Math.sin(t * 1.4);
      return [POSES.stand, { shoulderL: [-0.6 - g * 0.3, 0, 0.5], elbowL: [-1.2, 0, 0], shoulderR: [-0.5 + g * 0.25, 0, -0.45], elbowR: [-1.0 - g * 0.2, 0, 0], head: [0, Math.sin(t * 0.7) * 0.2, 0], spine: [0, Math.sin(t * 0.5) * 0.08, 0] }];
    });
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cam.aspect = w / h;
    const tall = w / h < 1;
    this.cam.fov = tall ? 52 : 30;
    this.cam.setViewOffset(w, h, tall ? 0 : -w * 0.1, tall ? h * 0.12 : 0, w, h);
    this.cam.updateProjectionMatrix();
  }

  private shot(i: number, pos: THREE.Vector3, look: THREE.Vector3) {
    if (i < 0) {
      pos.copy(this.overview.p);
      look.copy(this.overview.l);
      return;
    }
    const r = this.roles[i];
    look.copy(r.at).setY(r.at.y + 1.15);
    pos.copy(look).add(r.view);
  }

  labels(w: number): Label[] {
    const i = roleAt(w);
    if (i < 0) return [];
    const local = (w - SET.first - i * SET.slot) / SET.slot;
    const a = sm(0.3, 0.42, local) * (1 - sm(0.92, 1, local));
    const r = this.roles[i];
    this.tmp.copy(r.at).setY(r.at.y + 2.05);
    this.tmp.project(this.cam);
    if (this.tmp.z > 1) return [];
    return [{ id: r.key, text: r.label, x: (this.tmp.x * 0.5 + 0.5) * this.w, y: (-this.tmp.y * 0.5 + 0.5) * this.h, a }];
  }

  render(w: number, clock: number, pointer: { x: number; y: number }) {
    const i = roleAt(w);
    // camera: overview → each role in turn (a little crane between them) → overview
    const a = new THREE.Vector3();
    const al = new THREE.Vector3();
    const b = new THREE.Vector3();
    const bl = new THREE.Vector3();
    let u = 1;
    if (w < SET.first) {
      this.shot(-1, a, al);
      this.shot(-1, b, bl);
    } else if (i >= 0) {
      const local = (w - SET.first - i * SET.slot) / SET.slot;
      u = ease(clamp(local / 0.36));
      this.shot(i - 1, a, al);
      this.shot(i, b, bl);
    } else {
      u = ease(clamp((w - SET.back) / 0.08));
      this.shot(7, a, al);
      this.shot(-1, b, bl);
    }
    this.p.copy(a).lerp(b, u);
    this.p.y += Math.sin(u * Math.PI) * 1.4;
    this.l.copy(al).lerp(bl, u);
    // drift while holding, and a slow rise at the very end
    const end = sm(SET.back + 0.08, 1, w);
    this.p.y += end * 1.5;
    this.p.z += end * 1.2;
    this.p.x += pointer.x * 0.12 + Math.sin(clock * 0.2) * 0.05;
    this.p.y += pointer.y * 0.06;
    this.cam.position.copy(this.p);
    this.cam.lookAt(this.l);

    // the follow light and the yellow ring on whoever is in focus
    const focus = i >= 0 ? this.roles[i] : null;
    this.roles.forEach((r, k) => {
      const m = r.ring.material as THREE.MeshBasicMaterial;
      const on = focus === r ? 1 : w >= SET.back ? 0.35 * sm(SET.back, SET.back + 0.06, w) : 0;
      m.opacity += (on * 0.95 - m.opacity) * 0.12;
      r.ring.scale.setScalar(1 + (focus === r ? Math.sin(clock * 3) * 0.04 : 0));
      const d = k === i ? 1 : 0;
      applyPose(r.person, ...r.pose(clock + k * 2.3, d));
      breathe(r.person, clock, k, r.key === "editor" ? 0.6 : 1);
      blink(r.person, clock, k);
    });
    if (focus) {
      this.follow.position.copy(focus.at).add(this.tmp.set(0.8, 3.6, 1.6));
      this.follow.target.position.copy(focus.at);
      this.follow.intensity += (30 - this.follow.intensity) * 0.1;
    } else this.follow.intensity *= 0.9;
    this.phoneGlow.color.setScalar(0.85 + Math.sin(clock * 4) * 0.15);

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.cam);
  }

  dispose() {
    this.scene.traverse((n) => {
      const m = n as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
  }
}
