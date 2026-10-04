import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { cinemaCamera, mats, softbox } from "./props";
import { contentTextures } from "./textures";
import { PIPE, stageAt } from "./pipeline-time";
import type { Label } from "./worlds";

/**
 * ACT 08 — THE PIPELINE as a physical loop. A closed track on a dark floor with nine stations
 * on it. One small yellow piece of content travels the track and changes at every stop:
 *
 *   IDEA (a spark) → SCRIPT (a page) → PRE-PRODUCTION (a plan) → SHOOT (footage) → EDIT (a reel)
 *   → APPROVAL (stamped) → POST (into the feed) → ANALYSE (measured) → ITERATE (back to a spark)
 *
 * Then the camera cranes up and the piece runs the loop again, faster: post, measure, learn,
 * improve, new idea, post again. Yellow marks the active stage only. Driven by `w` (0 → 1).
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);


const NAMES = ["Idea", "Script", "Pre-production", "Shoot", "Edit", "Approval", "Post", "Analyse", "Iterate"];
const A = 5.4;
const B = 3.7;

function canvas(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function plaque(n: number, name: string, active: boolean) {
  return canvas(512, 128, (g, w, h) => {
    g.fillStyle = active ? "#f9fe02" : "#0b0b0b";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = active ? "#f9fe02" : "rgba(238,235,227,.35)";
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.fillStyle = active ? "#000" : "rgba(238,235,227,.55)";
    g.font = '500 26px "IBM Plex Mono", monospace';
    g.fillText(String(n).padStart(2, "0"), 28, 76);
    g.fillStyle = active ? "#000" : "#eeebe3";
    g.font = '800 54px "Big Shoulders Display", sans-serif';
    g.fillText(name.toUpperCase(), 96, 84);
  });
}

export class PipelineScene {
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(36, 1, 0.05, 200);
  private w = 1;
  private h = 1;
  private T = contentTextures();
  private curve: THREE.CatmullRomCurve3;
  private trail!: THREE.Mesh;
  private trailCount = 0;
  private st: {
    u: number;
    p: THREE.Vector3;
    out: THREE.Vector3;
    rim: THREE.MeshStandardMaterial;
    plaque: THREE.MeshBasicMaterial;
    tex: [THREE.Texture, THREE.Texture];
    on: boolean;
  }[] = [];
  // the travelling piece
  private piece = new THREE.Group();
  private spark!: THREE.Mesh;
  private sparkLight!: THREE.PointLight;
  private tile!: THREE.Mesh;
  private tileMat!: THREE.MeshBasicMaterial;
  private tileTex: THREE.Texture[] = [];
  private check!: THREE.Mesh;
  // station business
  private flash!: THREE.PointLight;
  private tally!: THREE.Mesh;
  private playhead!: THREE.Mesh;
  private stamp!: THREE.Group;
  private phoneScreenAt = new THREE.Vector3();
  private heart!: THREE.Mesh;
  private bars: THREE.Mesh[] = [];
  private arrowMat!: THREE.MeshStandardMaterial;
  private key!: THREE.SpotLight;
  private hemi!: THREE.HemisphereLight;
  private p = new THREE.Vector3();
  private l = new THREE.Vector3();
  private tmp = new THREE.Vector3();

  constructor(private renderer: THREE.WebGLRenderer, private opts: { lowPower: boolean }) {
    const pm = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.22;
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.045);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.sin(a) * A, 0, Math.cos(a) * B));
    }
    this.curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    this.build();
  }

  private build() {
    const s = this.scene;
    const T = this.T;
    this.hemi = new THREE.HemisphereLight(0xb0b0a8, 0x050505, 0.35);
    s.add(this.hemi);
    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.35);
    fill.position.set(-6, 8, 4);
    s.add(fill);
    this.key = new THREE.SpotLight(0xfff0d0, 40, 14, 0.5, 0.65, 1.4);
    this.key.castShadow = !this.opts.lowPower;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.bias = -0.0006;
    s.add(this.key, this.key.target);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.45, metalness: 0.15 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    s.add(floor);

    // the track: a dark rail, and a yellow trail that fills behind the piece
    const rail = new THREE.Mesh(new THREE.TubeGeometry(this.curve, 400, 0.05, 8, true), new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.35, metalness: 0.6 }));
    rail.scale.y = 0.4;
    rail.position.y = 0.03;
    s.add(rail);
    const trailGeo = new THREE.TubeGeometry(this.curve, 400, 0.026, 6, true);
    this.trailCount = trailGeo.index!.count;
    this.trail = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false }));
    this.trail.position.y = 0.055;
    this.trail.scale.y = 0.5;
    s.add(this.trail);

    // stations
    const platMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.55, metalness: 0.2 });
    for (let k = 0; k < 9; k++) {
      const u = k / 9;
      const p = this.curve.getPointAt(u);
      const out = new THREE.Vector3(p.x / (A * A), 0, p.z / (B * B)).normalize();
      const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.06, 48), platMat);
      plat.position.copy(p).setY(0.03);
      plat.receiveShadow = true;
      s.add(plat);
      const rim = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0xf9fe02, emissiveIntensity: 0, roughness: 0.4 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.99, 0.018, 8, 64), rim);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(p).setY(0.065);
      s.add(ring);
      const tex: [THREE.Texture, THREE.Texture] = [plaque(k + 1, NAMES[k], false), plaque(k + 1, NAMES[k], true)];
      const pm = new THREE.MeshBasicMaterial({ map: tex[0], toneMapped: false });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.18), pm);
      const side = this.curve.getTangentAt(u);
      pl.position.copy(p).addScaledVector(side, 0.62).addScaledVector(out, 0.45).setY(0.14);
      pl.lookAt(this.tmp.copy(pl.position).addScaledVector(out, 1).addScaledVector(side, -0.25).setY(0.5));
      s.add(pl);
      this.st.push({ u, p, out, rim, plaque: pm, tex, on: false });
      // the station's business, set just inside the track
      const g = new THREE.Group();
      g.position.copy(p).addScaledVector(out, -0.55);
      g.lookAt(this.tmp.copy(g.position).add(out));
      s.add(g);
      this.station(k, g);
    }

    // the piece
    this.spark = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false }));
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.7),
      new THREE.MeshBasicMaterial({
        map: canvas(128, 128, (g) => {
          const r = g.createRadialGradient(64, 64, 2, 64, 64, 64);
          r.addColorStop(0, "rgba(249,254,2,.85)");
          r.addColorStop(1, "rgba(249,254,2,0)");
          g.fillStyle = r;
          g.fillRect(0, 0, 128, 128);
        }),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.spark.add(halo);
    this.sparkLight = new THREE.PointLight(0xf9fe02, 2, 3, 2);
    this.spark.add(this.sparkLight);
    this.piece.add(this.spark);
    const script = canvas(360, 640, (g, w, h) => {
      g.fillStyle = "#ece9e1";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#111";
      g.font = '800 46px "Big Shoulders Display", sans-serif';
      g.fillText("EP.01 — INTRO", 28, 70);
      g.font = '500 17px "IBM Plex Mono", monospace';
      ["HOOK (0:00–0:02)", "  faces, not logos", "", "BEAT 1", "  the chaos", "BEAT 2", "  the people", "", "END", "  the work"].forEach((l, i) => g.fillText(l, 28, 130 + i * 34));
      g.fillStyle = "#f9fe02";
      g.fillRect(24, 112, 220, 26);
      g.fillStyle = "#111";
      g.fillText("HOOK (0:00–0:02)", 28, 130);
    });
    const plan = canvas(360, 640, (g, w, h) => {
      g.fillStyle = "#151515";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#eeebe3";
      g.font = '800 46px "Big Shoulders Display", sans-serif';
      g.fillText("SHOOT DAY", 28, 70);
      g.font = '500 18px "IBM Plex Mono", monospace';
      ["Shot list", "Cast", "Location", "Props", "Crew call 09:00"].forEach((l, i) => {
        g.strokeStyle = "#eeebe3";
        g.lineWidth = 2;
        g.strokeRect(28, 118 + i * 64, 26, 26);
        g.fillStyle = "#f9fe02";
        g.fillRect(33, 123 + i * 64, 16, 16);
        g.fillStyle = "#eeebe3";
        g.fillText(l, 70, 138 + i * 64);
      });
    });
    this.tileTex = [T.reelHero, script, plan, T.reelCrowd, T.reelHero, T.reelHero, T.postPortrait, T.postPortrait, T.postPortrait];
    this.tileMat = new THREE.MeshBasicMaterial({ map: script, toneMapped: false, side: THREE.DoubleSide });
    this.tile = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.64), this.tileMat);
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.39, 0.67), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false, side: THREE.DoubleSide }));
    edge.position.z = -0.004;
    this.tile.add(edge);
    this.check = new THREE.Mesh(
      new THREE.CircleGeometry(0.075, 32),
      new THREE.MeshBasicMaterial({
        map: canvas(128, 128, (g) => {
          g.fillStyle = "#f9fe02";
          g.beginPath();
          g.arc(64, 64, 62, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = "#000";
          g.lineWidth = 14;
          g.lineCap = "round";
          g.beginPath();
          g.moveTo(34, 66);
          g.lineTo(56, 88);
          g.lineTo(96, 42);
          g.stroke();
        }),
        toneMapped: false,
      }),
    );
    this.check.position.set(0.15, 0.28, 0.006);
    this.tile.add(this.check);
    this.piece.add(this.tile);
    s.add(this.piece);
  }

  /** what stands at each stop */
  private station(k: number, g: THREE.Group) {
    const T = this.T;
    const dark = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.5, metalness: 0.3 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x1d1a16, roughness: 0.65 });
    const paper = new THREE.MeshStandardMaterial({ color: 0xe8e5dc, roughness: 0.9 });
    const yel = new THREE.MeshStandardMaterial({ color: 0xf2ea10, roughness: 0.7 });
    const add = (m: THREE.Mesh, x: number, y: number, z: number) => {
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    if (k === 0) {
      // IDEA: a board of notes on a stand
      add(new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.75, 0.04, 2, 0.01), wood), 0, 1.1, -0.2);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 8), dark), 0, 0.36, -0.2);
      for (let i = 0; i < 7; i++) {
        const n = add(new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), i % 3 === 0 ? yel : paper), -0.4 + (i % 4) * 0.27, 1.25 - Math.floor(i / 4) * 0.3, -0.175);
        n.rotation.z = ((i * 37) % 10) * 0.02 - 0.1;
      }
    } else if (k === 1) {
      // SCRIPT: a lectern, a stack of pages, the page itself
      add(new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.05, 0.5, 2, 0.01), wood), 0, 0.82, -0.25).rotation.x = -0.2;
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.8, 10), dark), 0, 0.4, -0.25);
      for (let i = 0; i < 5; i++) add(new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.29), paper), 0.42 + i * 0.002, 0.07 + i * 0.006, -0.05).rotation.y = i * 0.08;
      const page = add(new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.44), new THREE.MeshStandardMaterial({ map: T.script, roughness: 0.9 })), 0, 0.9, -0.2);
      page.rotation.x = -0.2 - Math.PI / 2 + Math.PI / 2;
    } else if (k === 2) {
      // PRE-PRODUCTION: a planning board on an easel
      const cal = canvas(640, 400, (c, w, h) => {
        c.fillStyle = "#e9e5dc";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#111";
        c.font = '800 40px "Big Shoulders Display", sans-serif';
        c.fillText("WEEK 03 — PLAN", 24, 52);
        const days = ["MON", "TUE", "WED", "THU", "FRI"];
        days.forEach((d, i) => {
          c.font = '500 16px "IBM Plex Mono", monospace';
          c.fillStyle = "#111";
          c.fillText(d, 30 + i * 120, 96);
          for (let r = 0; r < 3; r++) {
            c.fillStyle = (i === 2 && r === 0) || (i === 0 && r === 1) ? "#f9fe02" : "#d3cfc5";
            c.fillRect(24 + i * 120, 110 + r * 90, 108, 78);
          }
        });
        c.fillStyle = "#111";
        c.font = '800 24px "Big Shoulders Display", sans-serif';
        c.fillText("SHOOT", 270, 156);
        c.fillText("SCRIPT LOCK", 30, 246);
      });
      add(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.69), new THREE.MeshStandardMaterial({ map: cal, roughness: 0.85 })), 0, 1.15, -0.25).rotation.x = -0.1;
      for (const x of [-0.45, 0.45]) add(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.6, 6), dark), x, 0.8, -0.3).rotation.x = 0.1;
      add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.012), paper), 0.55, 0.15, 0.1).rotation.x = -1.2;
    } else if (k === 3) {
      // SHOOT: camera on sticks, a softbox, a flash when it rolls
      const cam = cinemaCamera(T);
      cam.group.scale.setScalar(0.5);
      cam.group.position.set(0.35, 1.0, 0.2);
      cam.group.rotation.y = Math.PI / 4; // lens toward the piece
      g.add(cam.group);
      this.tally = cam.tally;
      const sb = softbox();
      sb.group.scale.setScalar(0.7);
      sb.group.position.set(-0.6, 1.25, -0.3);
      sb.group.lookAt(g.localToWorld(new THREE.Vector3(0, 0.7, 0.6)));
      g.add(sb.group);
      this.flash = new THREE.PointLight(0xfff6e0, 0, 4, 2);
      this.flash.position.set(-0.5, 1.2, 0);
      g.add(this.flash);
    } else if (k === 4) {
      // EDIT: a desk and a monitor with the timeline
      add(new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.04, 0.5, 2, 0.01), wood), 0, 0.72, -0.25);
      for (const x of [-0.5, 0.5]) add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.45), dark), x, 0.35, -0.25);
      const tl = canvas(640, 360, (c, w, h) => {
        c.fillStyle = "#101010";
        c.fillRect(0, 0, w, h);
        c.drawImage(T.reelHero.image as HTMLCanvasElement, 240, 14, 90, 160);
        for (let r = 0; r < 4; r++)
          for (let x = 20; x < w - 20; ) {
            const len = 40 + ((x * 7 + r * 31) % 80);
            c.fillStyle = r === 1 && x % 3 === 0 ? "#d9d400" : r > 2 ? "#2f3a2f" : "#555";
            c.fillRect(x, 200 + r * 38, len - 4, 30);
            x += len;
          }
      });
      const mon = add(new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.42, 0.03, 2, 0.008), dark), 0, 1.12, -0.38);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.69, 0.39), new THREE.MeshBasicMaterial({ map: tl, toneMapped: false }));
      scr.position.z = 0.017;
      mon.add(scr);
      this.playhead = new THREE.Mesh(new THREE.PlaneGeometry(0.005, 0.2), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false }));
      this.playhead.position.set(-0.3, -0.08, 0.019);
      mon.add(this.playhead);
      add(new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.02, 0.13, 2, 0.005), dark), 0, 0.75, -0.12);
    } else if (k === 5) {
      // APPROVAL: a rubber stamp that comes down on the piece
      const stamp = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.18, 6, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35 }));
      handle.position.y = 0.25;
      const base = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.07, 0.22, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.5, metalness: 0.3 }));
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.2), mats.yellow());
      pad.position.y = -0.045;
      stamp.add(handle, base, pad);
      stamp.traverse((n) => ((n as THREE.Mesh).castShadow = true));
      stamp.rotation.x = Math.PI / 2 - 0.25; // pad faces in, onto the card's face
      this.stamp = stamp;
      g.add(stamp);
      // a reviewer's desk lamp glow
      add(new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.04, 0.4, 2, 0.01), wood), 0, 0.5, -0.35);
    } else if (k === 6) {
      // POST: a big phone with the feed on it
      const phone = add(new THREE.Mesh(new RoundedBoxGeometry(0.62, 1.2, 0.06, 4, 0.06), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.3, metalness: 0.5 })), 0, 0.8, -0.3);
      const feed = canvas(360, 720, (c, w, h) => {
        c.fillStyle = "#0b0b0b";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#eeebe3";
        c.font = '600 20px "IBM Plex Mono", monospace';
        c.fillText("buzzlab.global", 20, 44);
        const tiles = [T.thumb, T.meme, T.ad, T.story, T.reelTimer, T.reelCrowd];
        for (let i = 0; i < 9; i++) {
          const img = (i === 0 ? T.reelHero : tiles[i % tiles.length]).image as HTMLCanvasElement;
          c.drawImage(img, 8 + (i % 3) * 116, 200 + Math.floor(i / 3) * 170, 112, 166);
        }
        c.strokeStyle = "#f9fe02";
        c.lineWidth = 4;
        c.strokeRect(8, 200, 112, 166);
      });
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.12), new THREE.MeshBasicMaterial({ map: feed, toneMapped: false }));
      scr.position.z = 0.031;
      phone.add(scr);
      phone.rotation.x = -0.12;
      phone.updateMatrixWorld();
      this.heart = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.22),
        new THREE.MeshBasicMaterial({
          map: canvas(128, 128, (c) => {
            c.fillStyle = "#f9fe02";
            c.beginPath();
            c.moveTo(64, 112);
            c.bezierCurveTo(-8, 60, 24, 4, 64, 38);
            c.bezierCurveTo(104, 4, 136, 60, 64, 112);
            c.fill();
          }),
          transparent: true,
          toneMapped: false,
          depthWrite: false,
        }),
      );
      this.heart.position.set(0.2, 0.3, 0.05);
      phone.add(this.heart);
      g.updateMatrixWorld(true);
      scr.getWorldPosition(this.phoneScreenAt);
    } else if (k === 7) {
      // ANALYSE: eight signals, one bar each
      add(new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.06, 0.32, 2, 0.01), dark), 0, 0.03, -0.3);
      const strip = canvas(1024, 64, (c, w) => {
        c.fillStyle = "#0b0b0b";
        c.fillRect(0, 0, w, 64);
        c.fillStyle = "#8a8882";
        c.font = '500 19px "IBM Plex Mono", monospace';
        ["REACH", "3S", "WATCH", "COMPL", "SHARE", "SAVE", "PROFILE", "FOLLOW"].forEach((l, i) => c.fillText(l, 14 + i * 127, 40));
      });
      const lab = add(new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.08), new THREE.MeshBasicMaterial({ map: strip, toneMapped: false })), 0, 0.064, -0.13);
      lab.rotation.x = -Math.PI / 2 + 0.5;
      for (let i = 0; i < 8; i++) {
        const bar = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), i === 1 ? mats.yellow() : new THREE.MeshStandardMaterial({ color: 0xd8d4ca, roughness: 0.5 })), -0.56 + i * 0.16, 0.06, -0.3);
        bar.geometry.translate(0, 0.5, 0);
        bar.scale.y = 0.02;
        this.bars.push(bar);
      }
    } else if (k === 8) {
      // ITERATE: an arrow bending back to the start
      this.arrowMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0xf9fe02, emissiveIntensity: 0, roughness: 0.4 });
      const arc = add(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 12, 48, Math.PI * 1.5), this.arrowMat), 0, 0.85, -0.3);
      arc.rotation.z = Math.PI * 0.25;
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 20), this.arrowMat);
      head.position.set(Math.cos(Math.PI * 1.75) * 0.45, 0.85 + Math.sin(Math.PI * 1.75) * 0.45, -0.3);
      head.rotation.z = Math.PI * 1.75;
      head.castShadow = true;
      g.add(head);
    }
  }

  /** during the loop lap: the words of the loop, pinned to the track */
  labels(w: number): Label[] {
    if (w < PIPE.loopA) return [];
    const a = sm(PIPE.loopA, PIPE.loopA + 0.02, w) * (1 - sm(0.965, 0.98, w));
    const word = Math.floor(((w - PIPE.loopA) / (PIPE.loopB - PIPE.loopA - 0.03)) * 6);
    const spots: [string, string, number][] = [
      ["post", word >= 5 ? "Post again" : "Post", 6 / 9],
      ["measure", "Measure", 7 / 9],
      ["learn", "Learn", 7.6 / 9],
      ["improve", "Improve", 8.4 / 9],
      ["idea", "New idea", 0],
    ];
    const out: Label[] = [];
    for (const [id, text, u] of spots) {
      this.curve.getPointAt(u, this.tmp).setY(0.4);
      this.tmp.project(this.cam);
      if (this.tmp.z > 1) continue;
      out.push({ id, text, x: (this.tmp.x * 0.5 + 0.5) * this.w, y: (-this.tmp.y * 0.5 + 0.5) * this.h, a });
    }
    return out;
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cam.aspect = w / h;
    const tall = w / h < 1;
    this.cam.fov = tall ? 58 : 36;
    this.cam.setViewOffset(w, h, tall ? 0 : -w * 0.1, tall ? h * 0.12 : 0, w, h);
    this.cam.updateProjectionMatrix();
  }

  /** where the piece is along the track (0 → 1 is one lap) */
  private pieceU(w: number) {
    if (w < PIPE.first) return 0;
    if (w < PIPE.back) {
      const k = stageAt(w);
      const local = (w - PIPE.first - k * PIPE.slot) / PIPE.slot;
      const move = k === 0 ? 1 : ease(clamp(local / 0.38));
      return (k - 1 + move) / 9;
    }
    if (w < PIPE.loopA) return lerp(8 / 9, 1, ease((w - PIPE.back) / (PIPE.loopA - PIPE.back)));
    return 1 + ease(clamp((w - PIPE.loopA) / (PIPE.loopB - PIPE.loopA))) * 2;
  }

  render(w: number, clock: number, pointer: { x: number; y: number }) {
    const u = this.pieceU(w);
    const uu = ((u % 1) + 1) % 1;
    const k = stageAt(w);
    const local = k >= 0 ? (w - PIPE.first - k * PIPE.slot) / PIPE.slot : 0;
    const dwell = k >= 0 ? clamp((local - 0.38) / 0.62) : 0;
    const at = this.curve.getPointAt(uu);
    const out = this.tmp.set(at.x / (A * A), 0, at.z / (B * B)).normalize().clone();

    // ---- the piece: a spark at the idea, then a card that changes at every stop ----
    const lap = w >= PIPE.loopA;
    const form = lap ? 6 : k < 0 ? (w >= PIPE.back ? 8 : 0) : k;
    const sparkOn = form === 0 || (form === 8 && (w >= PIPE.back || dwell > 0.5));
    const grow = k === 0 ? sm(0, 0.4, local) : 1;
    this.spark.visible = sparkOn && !lap;
    this.spark.scale.setScalar(grow * (1 + Math.sin(clock * 6) * 0.08));
    this.sparkLight.intensity = sparkOn ? 2 : 0;
    this.tile.visible = !sparkOn || lap;
    const tex = this.tileTex[form];
    if (this.tileMat.map !== tex) {
      this.tileMat.map = tex;
      this.tileMat.needsUpdate = true;
    }
    // stamped from approval on, never before
    this.check.visible = !lap && ((form === 5 && dwell > 0.32) || (form > 5 && form < 8));
    this.piece.position.copy(at).setY(0.85 + Math.sin(clock * 1.6) * 0.03);
    // into the phone at POST
    if (form === 6 && !lap) {
      const into = sm(0.15, 0.5, dwell);
      this.piece.position.lerp(this.phoneScreenAt, into * 0.85);
      this.piece.scale.setScalar(1 - into * 0.55);
    } else this.piece.scale.setScalar(lap ? 0.8 : 1);
    // face the camera, a little turn of life
    this.piece.lookAt(this.cam.position.x, this.piece.position.y, this.cam.position.z);
    this.piece.rotateY(Math.sin(clock * 0.8) * 0.15);
    // squash on the stamp
    if (form === 5 && !lap) {
      const hit = sm(0.22, 0.3, dwell) * (1 - sm(0.36, 0.5, dwell));
      this.piece.scale.y *= 1 - hit * 0.18;
    }

    // ---- stations: yellow only where the piece is ----
    this.st.forEach((s, i) => {
      const d = Math.abs(((uu - s.u + 1.5) % 1) - 0.5);
      const on = d < 0.03;
      s.rim.emissiveIntensity = lerp(s.rim.emissiveIntensity, on ? 1.4 : 0, 0.15);
      if (on !== s.on) {
        s.on = on;
        s.plaque.map = s.tex[on ? 1 : 0];
        s.plaque.needsUpdate = true;
      }
      void i;
    });
    this.tally.visible = k === 3 ? Math.floor(clock * 2.5) % 2 === 0 : true;
    this.flash.intensity = k === 3 ? Math.max(0, 1 - Math.abs(dwell - 0.3) * 12) * 30 : 0;
    this.playhead.position.x = k === 4 ? lerp(-0.3, 0.3, dwell) : -0.3;
    const press = k === 5 ? sm(0.1, 0.26, dwell) * (1 - sm(0.36, 0.6, dwell)) : 0;
    this.stamp.position.set(0.08, lerp(1.45, 1.1, press), lerp(1.5, 0.62, press));
    this.stamp.visible = k >= 4 && k <= 6;
    const pop = k === 6 ? sm(0.5, 0.62, dwell) : lap ? 1 : 0;
    this.heart.scale.setScalar(Math.max(0.001, pop * (1 + Math.sin(clock * 5) * 0.05)));
    (this.heart.material as THREE.MeshBasicMaterial).opacity = pop;
    const rise = k === 7 ? sm(0.1, 0.8, dwell) : w >= PIPE.back ? 1 : 0;
    const H = [0.9, 0.55, 0.7, 0.45, 0.62, 0.8, 0.38, 0.5];
    this.bars.forEach((b, i) => (b.scale.y = Math.max(0.02, H[i] * clamp(rise * 1.3 - i * 0.04))));
    const back = (k === 8 ? sm(0.2, 0.7, dwell) : 0) + (w >= PIPE.back ? 1 : 0);
    this.arrowMat.emissiveIntensity = Math.min(1, back) * 0.9;

    // ---- the trail: yellow up to the piece, the whole ring once it has gone round ----
    const filled = u >= 1 ? 1 : uu;
    this.trail.geometry.setDrawRange(0, Math.floor((filled * this.trailCount) / 6) * 6);

    // ---- camera: follow the piece from outside the ring, then crane up over the loop ----
    const crane = sm(PIPE.back, PIPE.loopA + 0.02, w);
    const intro = 1 - sm(0.0, PIPE.first + 0.02, w);
    const followP = new THREE.Vector3().copy(at).addScaledVector(out, 3.6).setY(1.75);
    const tangent = this.curve.getTangentAt(uu);
    followP.addScaledVector(tangent, -0.9);
    const followL = new THREE.Vector3().copy(at).addScaledVector(out, -0.5).setY(0.75);
    // from above the loop sits right of the copy
    const top = new THREE.Vector3(-3.9, 15.5, 10);
    const topL = new THREE.Vector3(-3.9, 0, 0.4);
    const wide = new THREE.Vector3(0, 6.5, 12);
    this.p.copy(followP).lerp(wide, intro * 0.85).lerp(top, crane);
    this.l.copy(followL).lerp(topL, Math.max(crane, intro * 0.85));
    this.p.x += pointer.x * 0.15;
    this.p.y += pointer.y * 0.08;
    this.cam.position.copy(this.p);
    this.cam.lookAt(this.l);
    this.key.position.copy(at).addScaledVector(out, 1.5).setY(4.2);
    this.key.target.position.copy(at);
    this.key.intensity = lerp(40, 90, crane);
    this.hemi.intensity = lerp(0.35, 0.9, crane);
    this.key.angle = lerp(0.5, 1.1, crane);
    this.key.distance = lerp(14, 26, crane);

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
