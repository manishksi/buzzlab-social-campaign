import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { anchorWorld, applyPose, blink, breathe, look, makePerson, orientHand, POSES, reach, type Person, type PersonOpts } from "./people";
import { canvasChair, cStand, gearMats, monitorStand, proCamera, proSoftbox } from "./gear";
import { contentTextures } from "./textures";
import { SET, roleAt } from "./set-time";
import type { Label } from "./worlds";

/**
 * ACT 09 — the miniature set, presented the way an architectural model is: a round model of the
 * whole production on a slow turntable, in the dark, with one pool of light at the front.
 *
 * The camera never flies around. It holds one direction and only breathes in and out; the model
 * turns, one quiet step at a time, and brings each role into the light in order — director, DOP,
 * lighting, producer, editor, creative, social — and finally turns all the way round to the DOP's
 * shoulder, looking at the talent. Then it pulls back for the line that closes the deck.
 * Driven by `w` (0 → 1).
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const Y0 = 0.42; // the model's floor
const R = 2.85; // where the roles stand, from the centre
/** where a role comes to rest: front, a little right of centre */
const SPOT_DIR = new THREE.Vector3(0.32, 0, 1).normalize();
const STEP = Math.PI / 4;
const UP = new THREE.Vector3(0, 1, 0);

type Role = {
  key: string;
  label: string;
  person: Person;
  /** the turntable angle that brings this role to the front */
  psi: number;
  /** look height when presented (seated people lower) */
  lookY: number;
  ring: THREE.Mesh;
  pose: (k: number) => void;
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
  private cam = new THREE.PerspectiveCamera(28, 1, 0.05, 200);
  private w = 1;
  private h = 1;
  private T = contentTextures();
  private table = new THREE.Group();
  private roles: Role[] = [];
  private psiEnd = 0;
  private spot!: THREE.SpotLight;
  private p = new THREE.Vector3();
  private l = new THREE.Vector3();
  private tmp = new THREE.Vector3();
  private V = new THREE.Vector3();

  constructor(private renderer: THREE.WebGLRenderer, private opts: { lowPower: boolean }) {
    const pm = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.28;
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.028);
    this.build();
  }

  /** Place something in a role's local frame (the role faces +z there) onto the turntable. */
  private station(at: THREE.Vector3, facing: number) {
    const g = new THREE.Group();
    g.position.copy(at);
    g.rotation.y = facing;
    this.table.add(g);
    return g;
  }

  private build() {
    const s = this.scene;
    const T = this.T;
    const m = gearMats();
    const low = this.opts.lowPower;

    // light: a warm key from front-left, a cool rim from behind, and the pool at the front spot
    s.add(new THREE.HemisphereLight(0xc8c6c0, 0x0a0a0a, 0.22));
    const key = new THREE.DirectionalLight(0xfff0dc, 0.55);
    key.position.set(-5, 9, 7);
    key.castShadow = !low;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -5.5;
    sc.right = 5.5;
    sc.top = 5.5;
    sc.bottom = -5.5;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    s.add(key);
    const rim = new THREE.DirectionalLight(0xd8e4ff, 0.7);
    rim.position.set(4, 6, -8);
    s.add(rim);
    const spotAt = SPOT_DIR.clone().multiplyScalar(R).setY(Y0);
    this.spot = new THREE.SpotLight(0xffe7b0, 40, 12, 0.33, 0.7, 1.2);
    this.spot.position.copy(spotAt).add(new THREE.Vector3(-0.8, 5.2, 2.2));
    this.spot.target.position.copy(spotAt);
    this.spot.castShadow = !low;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.shadow.bias = -0.0006;
    s.add(this.spot, this.spot.target);

    // the model: a round plinth with a thin yellow edge, on a turntable
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(4.05, 4.1, Y0, 96), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.55 }));
    plinth.position.y = Y0 / 2;
    plinth.receiveShadow = true;
    const edge = new THREE.Mesh(new THREE.TorusGeometry(4.06, 0.008, 6, 160), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false }));
    edge.rotation.x = Math.PI / 2;
    edge.position.y = Y0 + 0.002;
    const top = new THREE.Mesh(new THREE.CircleGeometry(4.02, 96), new THREE.MeshStandardMaterial({ color: 0x1d1c1a, roughness: 0.72 }));
    top.rotation.x = -Math.PI / 2;
    top.position.y = Y0 + 0.003;
    top.receiveShadow = true;
    this.table.add(plinth, edge, top);
    s.add(this.table);

    const add = (key: string, label: string, o: PersonOpts, i: number, opts: { lookY: number; seated?: boolean }, build: (p: Person, local: THREE.Group) => (k: number) => void) => {
      const psi = i * STEP;
      // local position: the front spot, turned back by psi
      const at = SPOT_DIR.clone().multiplyScalar(R).applyAxisAngle(UP, -psi);
      const p = makePerson(o);
      // everyone faces 3/4 to camera-left, toward their station
      const facing = Math.atan2(SPOT_DIR.x, SPOT_DIR.z) - psi - 0.95;
      const frame = this.station(at.clone().setY(Y0), facing);
      frame.add(p.root);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.5, 64), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false, transparent: true, opacity: 0, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.006;
      frame.add(ring);
      const pose = build(p, frame);
      this.roles.push({ key, label, person: p, psi, lookY: opts.lookY, ring, pose });
      return frame;
    };
    const W = (g: THREE.Object3D, x: number, y: number, z: number) => g.localToWorld(this.V.set(x, y, z)).clone();

    // 01 director: in the canvas chair, chin on his hand, watching the monitor
    add("director", "Director — calls the shot", { sex: "m", outfit: "shirt", hair: "short01", hairColor: 0x2a2a2a, shoes: "boots", skin: "skin_m_deep" }, 0, { lookY: 1.25, seated: true }, (p, f) => {
      const chair = canvasChair(m, tex(512, 200, (g, w, h) => {
        g.fillStyle = "#111";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#f9fe02";
        g.font = '800 92px "Big Shoulders Display", sans-serif';
        g.fillText("DIRECTOR", 40, 130);
      }));
      f.add(chair);
      const mon = monitorStand(m, T.monitor, 1.42);
      mon.group.position.set(0.15, 0, 0.85);
      mon.group.rotation.y = Math.PI - 0.1;
      f.add(mon.group);
      return () => {
        applyPose(p, POSES.sit, { hipY: 0.9, spine: [0.24, 0, 0], kneeL: [-0.12, 0, 0], kneeR: [-0.12, 0, 0] });
        reach(p, "L", anchorWorld(p, "mouth", this.V).add(W(f, 0, -0.09, 0.03).sub(W(f, 0, 0, 0))), W(f, 0.6, -1, 0.2).sub(W(f, 0, 0, 0)));
        reach(p, "R", W(f, -0.1, 0.93, 0.42), W(f, -1, -0.4, -0.5).sub(W(f, 0, 0, 0)));
      };
    });
    // 02 DOP: on the camera, pointed at the talent in the middle
    add("dop", "DOP — frames it, rolls", { sex: "m", outfit: "jacket", hair: "short04", hairColor: 0x1d1612, shoes: "sneakers" }, 1, { lookY: 1.45 }, (p, f) => {
      const rig = proCamera(m, { height: 1.42 });
      f.add(rig.group);
      rig.group.position.set(0, 0, 0.62);
      // aim the rig at the centre of the model
      f.updateMatrixWorld(true);
      const centre = f.worldToLocal(new THREE.Vector3(0, Y0, 0));
      rig.group.rotation.y = Math.atan2(-(centre.x - 0), -(centre.z - 0.62));
      return () => {
        applyPose(p, POSES.stand, { spine: [0.14, 0, 0], neck: [0.1, 0, 0], head: [0.1, 0, 0], gripR: 0.65, gripL: 0.5 });
        rig.group.updateMatrixWorld(true);
        reach(p, "R", W(rig.group, 0.06, 1.27, 0.38), W(f, 1, -1, -0.3).sub(W(f, 0, 0, 0)));
        reach(p, "L", W(rig.group, -0.07, 1.42, -0.1), W(f, -1, -0.8, 0).sub(W(f, 0, 0, 0)));
      };
    });
    // 03 lighting: up at a softbox, adjusting it
    add("lighting", "Lighting — shapes the light", { sex: "f", outfit: "sport", hair: "ponytail01", hairColor: 0x1c140f, shoes: "sneakers", skin: "skin_f" }, 2, { lookY: 1.55 }, (p, f) => {
      const sb = proSoftbox(m, { height: 1.95, size: 0.62 });
      sb.group.position.set(0.15, 0, 0.75);
      f.add(sb.group);
      f.updateMatrixWorld(true);
      const centre = f.worldToLocal(new THREE.Vector3(0, Y0, 0));
      sb.group.rotation.y = Math.atan2(-(centre.x - 0.15), -(centre.z - 0.75));
      return (k) => {
        applyPose(p, POSES.stand, { neck: [-0.25, 0, 0], head: [-0.2, 0, 0], gripR: 0.55, gripL: 0.3 });
        sb.group.updateMatrixWorld(true);
        reach(p, "R", W(sb.head, 0.25, -0.05 + Math.sin(k * 1.1) * 0.02, 0.2), W(f, 1, -1, -0.5).sub(W(f, 0, 0, 0)));
        sb.head.rotation.x = Math.sin(k * 0.5) * 0.04;
      };
    });
    // 04 producer: the schedule board and a clipboard
    add("producer", "Producer — keeps the day on time", { sex: "f", outfit: "blouse", hair: "bob02", hairColor: 0x2b1a12, shoes: "boots", glasses: true, trimFringe: true }, 3, { lookY: 1.5 }, (p, f) => {
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
      const board = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.64, 0.025, 2, 0.006), new THREE.MeshStandardMaterial({ map: sched, roughness: 0.8 }));
      board.position.set(0.05, 1.45, 0.75);
      board.rotation.y = Math.PI;
      const easel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 8), m.steel);
      easel.position.set(0.05, 0.75, 0.78);
      f.add(board, easel);
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.27, 0.008), new THREE.MeshStandardMaterial({ map: sched, roughness: 0.8 }));
      clip.position.set(0.05, 1.08, 0.3);
      clip.rotation.x = -0.9;
      f.add(clip);
      return (k) => {
        applyPose(p, POSES.stand, { neck: [0.15, 0, 0], head: [0.1, 0, 0], gripL: 0.75 });
        reach(p, "L", W(f, 0.13, 1.02, 0.27), W(f, 1, -1, 0).sub(W(f, 0, 0, 0)));
        reach(p, "R", W(f, -0.03 + Math.sin(k * 1.6) * 0.02, 1.12, 0.32), W(f, -1, -1, 0).sub(W(f, 0, 0, 0)));
      };
    });
    // 05 editor: the same editor, yellow tee and headphones, at a desk
    add("editor", "Editor — cuts it while it's warm", { sex: "m", outfit: "tee", top: 0xf2e300, bottom: 0x121212, hair: "short02", hairColor: 0x2d241d, shoes: "sneakers", headphones: true }, 4, { lookY: 1.2, seated: true }, (p, f) => {
      const desk = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.04, 0.6, 2, 0.008), m.wood);
      desk.position.set(0, 0.74, 0.62);
      const legsM = m.steel;
      for (const x of [-0.56, 0.56]) {
        const lg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.72, 0.5), legsM);
        lg.position.set(x, 0.36, 0.62);
        f.add(lg);
      }
      const mon = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.36, 0.03, 2, 0.006), m.black);
      mon.position.set(0, 1.1, 0.82);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.59, 0.33), new THREE.MeshBasicMaterial({ map: T.thumb, toneMapped: false }));
      scr.position.set(0, 1.1, 0.804);
      scr.rotation.y = Math.PI;
      const kb = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.018, 0.12, 2, 0.005), m.black);
      kb.position.set(0.04, 0.77, 0.5);
      const mat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.004, 0.3), new THREE.MeshStandardMaterial({ color: 0xe8e000, roughness: 0.85 }));
      mat.position.set(0, 0.762, 0.48);
      const seat = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.07, 0.44, 2, 0.02), m.black);
      seat.position.set(0, 0.47, 0.02);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.44, 8), m.steel);
      post.position.set(0, 0.23, 0.02);
      f.add(desk, mon, scr, kb, mat, seat, post);
      return (k) => {
        applyPose(p, POSES.sit, { hipY: 0.6, spine: [0.16, 0, 0], head: [0.08, Math.sin(k * 0.31) * 0.05, 0], gripR: 0.35, gripL: 0.3 });
        reach(p, "L", W(f, 0.16, 0.8 + Math.max(0, Math.sin(k * 11)) * 0.01, 0.42), W(f, 1, -1, -1).sub(W(f, 0, 0, 0)));
        reach(p, "R", W(f, -0.28 - Math.sin(k * 0.9) * 0.02, 0.8, 0.44), W(f, -1, -1, -1).sub(W(f, 0, 0, 0)));
        const fwd = W(f, 0, -0.15, 1).sub(W(f, 0, 0, 0));
        orientHand(p, "L", fwd, this.tmp.set(0, -1, 0));
        orientHand(p, "R", fwd, this.tmp.set(0, -1, 0));
      };
    });
    // 06 creative: placing a frame on the storyboard
    add("creative", "Creative — holds the idea", { sex: "m", outfit: "whitetee", hair: "short01", hairColor: 0x1d1612, shoes: "navy", skin: "skin_m_deep" }, 5, { lookY: 1.5 }, (p, f) => {
      const board = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.95, 0.03, 2, 0.006), new THREE.MeshStandardMaterial({ map: T.storyboard, roughness: 0.85 }));
      board.position.set(0.1, 1.35, 0.72);
      board.rotation.y = Math.PI;
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.03, 0.03), m.steel);
      stand.position.set(0.1, 0.85, 0.74);
      f.add(board, stand);
      for (const x of [-0.55, 0.75]) {
        const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.88, 8), m.steel);
        lg.position.set(x, 0.44, 0.74);
        f.add(lg);
      }
      return (k) => {
        const up = 0.5 + 0.5 * Math.sin(k * 0.45);
        applyPose(p, POSES.stand, { head: [-0.05, 0, 0], gripR: 0.2 });
        reach(p, "R", W(f, -0.3, 1.25 + up * 0.18, 0.66), W(f, -1, -1, 0).sub(W(f, 0, 0, 0)));
      };
    });
    // 07 social: posting from her phone, the numbers on a screen beside her
    add("social", "Social — posts it, reads the numbers", { sex: "f", outfit: "tee", top: 0x1d1d1d, bottom: 0x253145, hair: "bob01", hairColor: 0x16100c, shoes: "navy", skin: "skin_f", trimFringe: true }, 6, { lookY: 1.5 }, (p, f) => {
      const dash = tex(512, 300, (g, w, h) => {
        g.fillStyle = "#0e0e0e";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#8a8882";
        g.font = '500 15px "IBM Plex Mono", monospace';
        g.fillText("EP.01 — 48H", 18, 30);
        ["REACH", "3S VIEWS", "WATCH", "COMPLETION", "SHARES", "SAVES", "PROFILE", "FOLLOWS"].forEach((mm, i) => {
          const x = 18 + (i % 4) * 124;
          const y = 70 + Math.floor(i / 4) * 116;
          g.fillStyle = "#8a8882";
          g.fillText(mm, x, y);
          g.fillStyle = i === 1 ? "#f9fe02" : "#eeebe3";
          g.font = '800 40px "Big Shoulders Display", sans-serif';
          g.fillText(["24.8K", "61%", "11.2s", "38%", "412", "906", "1.3K", "+218"][i], x, y + 46);
          g.font = '500 15px "IBM Plex Mono", monospace';
        });
      });
      const screen = monitorStand(m, dash, 1.4);
      screen.group.position.set(-0.55, 0, 0.7);
      screen.group.rotation.y = Math.PI + 0.5;
      f.add(screen.group);
      const phone = new THREE.Group();
      const pb = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.155, 0.009, 2, 0.008), m.black);
      const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: T.reelHero, toneMapped: false }));
      ps.position.z = -0.0055;
      ps.rotation.y = Math.PI;
      phone.add(pb, ps);
      p.j.wristR.add(phone);
      phone.position.set(0.0, -0.09, 0.035);
      phone.rotation.set(-1.4, 0, 0.2);
      return () => {
        applyPose(p, POSES.stand, { neck: [0.3, 0, 0], head: [0.15, 0, 0], gripR: 0.6, thumbR: 0.4 });
        reach(p, "R", W(f, -0.05, 1.18, 0.3), W(f, -1, -1, 0).sub(W(f, 0, 0, 0)));
        look(p, 0, 0.25);
      };
    });

    // 08 talent: in the middle, on a stool, in front of a small cyc, facing the DOP's camera
    const dopFrame = this.roles[1];
    const talent = makePerson({ sex: "f", outfit: "tee", top: 0x111111, bottom: 0x2a2626, hair: "bob02", hairColor: 0x2a1d14, shoes: "boots", skin: "skin_f_light", trimFringe: true });
    const tFrame = new THREE.Group();
    tFrame.position.set(0, Y0, 0);
    // face the DOP
    const dopLocal = SPOT_DIR.clone().multiplyScalar(R).applyAxisAngle(UP, -dopFrame.psi);
    tFrame.rotation.y = Math.atan2(dopLocal.x, dopLocal.z);
    this.table.add(tFrame);
    tFrame.add(talent.root);
    const stool = new THREE.Group();
    const stTop = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 28), m.black);
    stTop.position.y = 0.68;
    stool.add(stTop);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.7, 6), m.steel);
      sl.position.set(Math.cos(a) * 0.11, 0.34, Math.sin(a) * 0.11);
      sl.rotation.z = Math.cos(a) * 0.14;
      sl.rotation.x = -Math.sin(a) * 0.14;
      stool.add(sl);
    }
    stool.position.set(0, 0, -0.05);
    tFrame.add(stool);
    // the cyc: a curved white backdrop behind her
    const cycMat = new THREE.MeshStandardMaterial({ color: 0xa9a69f, roughness: 0.95, side: THREE.DoubleSide });
    const cyc = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.7, 48, 1, true, Math.PI * 0.7, Math.PI * 0.6), cycMat);
    cyc.position.set(0, 0.85, 0);
    cyc.receiveShadow = true;
    tFrame.add(cyc);
    const cycFloor = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48, Math.PI * 1.2, Math.PI * 0.6), cycMat);
    cycFloor.rotation.x = -Math.PI / 2;
    cycFloor.position.y = 0.004;
    cycFloor.receiveShadow = true;
    tFrame.add(cycFloor);
    const tRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.44, 64), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false, transparent: true, opacity: 0, depthWrite: false }));
    tRing.rotation.x = -Math.PI / 2;
    tRing.position.y = 0.008;
    tFrame.add(tRing);
    // two C-stands flanking the cyc, a boom over her
    const csA = cStand(m);
    csA.position.set(-1.6, 0, -0.9);
    csA.rotation.y = 0.6;
    const csB = cStand(m);
    csB.position.set(1.6, 0, -0.9);
    csB.rotation.y = Math.PI - 0.6;
    tFrame.add(csA, csB);
    // the last stop: the turntable keeps turning until the DOP is at the front again
    this.psiEnd = dopFrame.psi + Math.PI * 2;
    this.roles.push({
      key: "talent",
      label: "Talent — makes you stop",
      person: talent,
      psi: this.psiEnd,
      lookY: 1.35,
      ring: tRing,
      pose: (k) => {
        applyPose(talent, POSES.sit, { hipY: 0.78, hipL: [0.1, 0, 0.12], kneeL: [-0.16, 0, 0], hipR: [0.08, 0, -0.1], kneeR: [-0.1, 0, 0], head: [0, Math.sin(k * 0.4) * 0.12, 0], spine: [0.04, 0, 0] });
        reach(talent, "L", W(tFrame, 0.12, 0.74, 0.34), W(tFrame, 1, -0.5, -1).sub(W(tFrame, 0, 0, 0)));
        reach(talent, "R", W(tFrame, -0.12, 0.74, 0.34), W(tFrame, -1, -0.5, -1).sub(W(tFrame, 0, 0, 0)));
      },
    });
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cam.aspect = w / h;
    const tall = w / h < 1;
    this.cam.fov = tall ? 48 : 28;
    this.cam.setViewOffset(w, h, tall ? 0 : -w * 0.1, tall ? h * 0.12 : 0, w, h);
    this.cam.updateProjectionMatrix();
  }

  /** where the turntable is (radians) and how close the camera is (0 wide … 1 on the role) */
  private state(w: number) {
    const i = roleAt(w);
    if (w < SET.first) return { psi: 0, near: ease(sm(0.02, SET.first, w)) * 0.7 };
    if (i >= 0) {
      const local = (w - SET.first - i * SET.slot) / SET.slot;
      const prev = i === 0 ? 0 : this.roles[i - 1].psi;
      const turn = ease(clamp(local / 0.42));
      const psi = lerp(prev, this.roles[i].psi, turn);
      // ease out a little while the model turns, in again when it settles
      const near = i === 0 ? lerp(0.7, 1, ease(clamp(local / 0.42))) : 1 - Math.sin(turn * Math.PI) * 0.35;
      return { psi, near };
    }
    // the end: a last slow drift of the model, the camera all the way out
    const u = clamp((w - SET.back) / (1 - SET.back));
    return { psi: this.psiEnd + ease(u) * 0.35, near: 1 - ease(clamp(u / 0.45)) };
  }

  labels(w: number): Label[] {
    const i = roleAt(w);
    if (i < 0) return [];
    const local = (w - SET.first - i * SET.slot) / SET.slot;
    const a = sm(0.42, 0.52, local) * (1 - sm(0.92, 1, local));
    const r = this.roles[i];
    anchorWorld(r.person, "top", this.tmp).y += 0.32;
    this.tmp.project(this.cam);
    if (this.tmp.z > 1) return [];
    return [{ id: r.key, text: r.label, x: (this.tmp.x * 0.5 + 0.5) * this.w, y: (-this.tmp.y * 0.5 + 0.5) * this.h, a }];
  }

  render(w: number, clock: number, pointer: { x: number; y: number }) {
    const { psi, near } = this.state(w);
    this.table.rotation.y = psi;
    this.table.updateMatrixWorld(true);
    const i = roleAt(w);
    const r = i >= 0 ? this.roles[i] : this.roles[0];

    // camera: one direction only, breathing in and out
    const spot = SPOT_DIR.clone().multiplyScalar(R);
    const talentLast = i === 7;
    const focus = talentLast ? this.V.set(0, Y0 + r.lookY, 0).lerp(spot.clone().setY(Y0 + 1.4), 0.25) : spot.clone().setY(Y0 + r.lookY);
    const wideL = new THREE.Vector3(0.2, 0.7, 0.2);
    this.l.copy(wideL).lerp(focus, near);
    const dir = new THREE.Vector3(0.28, 0.5, 1).normalize();
    const dist = lerp(13.5, talentLast ? 5.2 : 3.6, near);
    this.p.copy(this.l).addScaledVector(dir, dist);
    this.p.x += pointer.x * 0.1;
    this.p.y += pointer.y * 0.06;
    this.cam.position.copy(this.p);
    this.cam.lookAt(this.l);

    // whoever is at the front stands in the pool of light, on a yellow ring
    this.roles.forEach((role, k) => {
      const at = k === 7 ? 0 : 1 - Math.min(1, Math.abs(Math.atan2(Math.sin(psi - role.psi), Math.cos(psi - role.psi))) / (STEP * 0.5));
      const on = k === i ? Math.max(at, k === 7 ? sm(0.45, 0.6, (w - SET.first - 7 * SET.slot) / SET.slot) : 0) : 0;
      const mat = role.ring.material as THREE.MeshBasicMaterial;
      mat.opacity += (on * 0.9 - mat.opacity) * 0.15;
      role.pose(clock + k * 2.3);
      breathe(role.person, clock, k, 0.8);
      blink(role.person, clock, k);
    });
    this.spot.intensity = lerp(22, 62, near);

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
