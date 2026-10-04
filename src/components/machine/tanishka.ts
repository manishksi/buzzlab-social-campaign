import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { applyPose, blink, breathe, makePerson, POSES, type Person } from "./people";
import { cinemaCamera, mats } from "./props";
import { contentTextures } from "./textures";
import { TAN, tanishkaMouth } from "./tanishka-time";

/**
 * TANISHKA — the last character, and the last joke. She's in the dark: bob, round glasses, a
 * cigarette in the corner of her mouth, a name badge, and a yellow tag that points right at her.
 * She looks at you. Then, very slowly, her jaw drops (the cigarette falls), and everything the
 * presentation was made of is pulled into her mouth: cards, cameras, the play button, the
 * playhead, script pages, yellow dots. The camera goes in after them. Black. (The section then
 * loops the page back to its first frame.) Driven by section progress `w` (0 → 1).
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

type Thing = { o: THREE.Object3D; from: THREE.Vector3; start: number; spin: number; size: number; bob: number };

export class TanishkaScene {
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(30, 1, 0.004, 100);
  private w = 1;
  private h = 1;
  private T = contentTextures();
  private her!: Person;
  private lips!: THREE.Mesh;
  private throat!: THREE.Mesh;
  private cig = new THREE.Group();
  private ember!: THREE.MeshBasicMaterial;
  private smoke: THREE.Mesh[] = [];
  private tag = new THREE.Group();
  private things: Thing[] = [];
  private mouthAt = new THREE.Vector3();
  private key!: THREE.SpotLight;
  private rim!: THREE.SpotLight;
  private yellowRim!: THREE.PointLight;
  private hemi!: THREE.HemisphereLight;
  private p = new THREE.Vector3();
  private l = new THREE.Vector3();
  private tmp = new THREE.Vector3();

  constructor(private renderer: THREE.WebGLRenderer, private opts: { lowPower: boolean }) {
    const pm = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.18;
    this.scene.background = new THREE.Color(0x000000);
    this.build();
  }

  private build() {
    const s = this.scene;
    const T = this.T;
    this.hemi = new THREE.HemisphereLight(0xc8c4bc, 0x050505, 0.35);
    s.add(this.hemi);
    this.key = new THREE.SpotLight(0xfff1de, 14, 6, 0.45, 0.7, 1.3);
    this.key.position.set(-0.9, 2.5, 1.5);
    this.key.target.position.set(0, 1.62, 0);
    s.add(this.key, this.key.target);
    this.rim = new THREE.SpotLight(0xdfe6ff, 10, 5, 0.5, 0.6, 1.3);
    this.rim.position.set(0.9, 2.2, -1.2);
    this.rim.target.position.set(0, 1.6, 0);
    s.add(this.rim, this.rim.target);
    this.yellowRim = new THREE.PointLight(0xf9fe02, 0.6, 2.2, 2);
    this.yellowRim.position.set(-0.6, 1.5, -0.6);
    s.add(this.yellowRim);

    // Tanishka
    const her = makePerson({ shirt: 0x161616, female: true, hairStyle: "bob", glasses: true, skin: 0xc99474, hair: 0x15100c, sleeves: "long", pants: 0x1c1c1c });
    this.her = her;
    s.add(her.root);
    (her.face.mouthOpen.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
    // lips round the opening, so it reads as a mouth and not a hole
    this.lips = new THREE.Mesh(new THREE.TorusGeometry(1, 0.16, 10, 40), new THREE.MeshStandardMaterial({ color: 0x9a4f42, roughness: 0.5 }));
    this.lips.position.copy(her.face.mouthOpen.position);
    this.lips.scale.setScalar(0.0001);
    her.face.group.add(this.lips);
    // behind the mouth, only black: the camera ends up in here
    this.throat = new THREE.Mesh(new THREE.SphereGeometry(0.058, 24, 16), new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }));
    this.throat.position.set(0, -0.085, 0.02);
    her.face.group.add(this.throat);

    // the cigarette, in the corner of her mouth
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.062, 14), new THREE.MeshStandardMaterial({ color: 0xf1efe8, roughness: 0.7 }));
    paper.position.y = 0.031 + 0.02;
    const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.0043, 0.0043, 0.02, 14), new THREE.MeshStandardMaterial({ color: 0xcfae7c, roughness: 0.8 }));
    filter.position.y = 0.01;
    const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.0041, 0.0042, 0.006, 14), new THREE.MeshStandardMaterial({ color: 0x6d6a66, roughness: 1 }));
    ash.position.y = 0.085;
    this.ember = new THREE.MeshBasicMaterial({ color: 0xffb340, toneMapped: false });
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.0043, 12, 8), this.ember);
    ember.position.y = 0.0885;
    ember.scale.y = 0.45;
    this.cig.add(paper, filter, ash, ember);
    this.cig.position.set(0.022, 0.03, 0.09);
    this.cig.rotation.set(Math.PI / 2 - 0.35, 0, -0.45);
    her.j.head.add(this.cig);
    const puff = tex(64, 64, (g) => {
      const r = g.createRadialGradient(32, 32, 1, 32, 32, 32);
      r.addColorStop(0, "rgba(255,255,255,.7)");
      r.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 64, 64);
    });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshBasicMaterial({ map: puff, transparent: true, opacity: 0, depthWrite: false }));
      s.add(m);
      this.smoke.push(m);
    }

    // the name badge on her chest
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.09, 0.055),
      new THREE.MeshStandardMaterial({
        map: tex(360, 220, (g, w, h) => {
          g.fillStyle = "#f2efe7";
          g.fillRect(0, 0, w, h);
          g.fillStyle = "#f9fe02";
          g.fillRect(0, 0, w, 58);
          g.fillStyle = "#000";
          g.font = '600 26px "IBM Plex Mono", monospace';
          g.fillText("HELLO, I'M", 22, 40);
          g.font = '800 70px "Big Shoulders Display", sans-serif';
          g.fillText("TANISHKA", 20, 146);
          g.font = '500 18px "IBM Plex Mono", monospace';
          g.fillText("BUZZLAB · NOT IN THE DECK", 22, 196);
        }),
        roughness: 0.6,
      }),
    );
    badge.position.set(0.075, 0.4, 0.118);
    badge.rotation.set(-0.08, 0.28, 0.05);
    her.j.spine.add(badge);

    // a yellow tag on a string, pointing right at her
    const tagTex = tex(600, 220, (g, w, h) => {
      g.fillStyle = "#f9fe02";
      g.beginPath();
      g.moveTo(90, 0);
      g.lineTo(w, 0);
      g.lineTo(w, h);
      g.lineTo(90, h);
      g.lineTo(0, h / 2);
      g.closePath();
      g.fill();
      g.fillStyle = "#000";
      g.beginPath();
      g.arc(70, h / 2, 9, 0, Math.PI * 2);
      g.fill();
      g.font = '800 92px "Big Shoulders Display", sans-serif';
      g.fillText("TANISHKA", 120, 136);
      g.font = '500 22px "IBM Plex Mono", monospace';
      g.fillText("← THAT'S HER", 124, 190);
    });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.077), new THREE.MeshStandardMaterial({ map: tagTex, transparent: true, roughness: 0.55, side: THREE.DoubleSide }));
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.5, 4), new THREE.MeshBasicMaterial({ color: 0x777777 }));
    string.position.set(-0.07, 0.25, 0);
    this.tag.add(card, string);
    this.tag.position.set(0.24, 1.73, 0.05);
    this.tag.rotation.z = -0.22;
    s.add(this.tag);

    // everything she's about to eat
    const tiles = [T.reelHero, T.reelTimer, T.postPortrait, T.thumb, T.meme, T.ad, T.story, T.reelCrowd, T.script];
    const add = (o: THREE.Object3D, size: number) => {
      const i = this.things.length;
      // a loose shell around her head, mostly in front and to the sides
      const a = (i * 2.399963) % (Math.PI * 2);
      const r = 0.36 + ((i * 37) % 11) * 0.05;
      const y = 1.64 + Math.sin(a) * r * 0.62;
      const from = new THREE.Vector3(Math.cos(a) * r * 1.25, y, -0.1 + ((i * 29) % 9) * 0.04);
      o.position.copy(from);
      o.rotation.set(((i * 17) % 7) * 0.3, ((i * 11) % 5) * 0.5, ((i * 13) % 9) * 0.2);
      o.visible = false;
      s.add(o);
      this.things.push({ o, from, start: TAN.open + 0.04 + ((i * 7) % 17) / 17 * 0.36, spin: (i % 2 ? 1 : -1) * (1 + (i % 4) * 0.4), size, bob: i * 0.7 });
    };
    for (let i = 0; i < 14; i++) {
      const t = tiles[i % tiles.length];
      const img = t.image as HTMLCanvasElement;
      const hgt = 0.09 + (i % 3) * 0.03;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(hgt * (img.width / img.height), hgt), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
      add(m, 1);
    }
    for (let i = 0; i < 3; i++) {
      const c = cinemaCamera(T);
      c.group.scale.setScalar(0.07);
      c.legs.visible = false;
      add(c.group, 0.07);
    }
    for (let i = 0; i < 8; i++) add(new THREE.Mesh(new THREE.SphereGeometry(0.012 + (i % 3) * 0.006, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false })), 1);
    for (let i = 0; i < 2; i++) {
      const play = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.016, 40), mats.yellow());
      disc.rotation.x = Math.PI / 2;
      const tri = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.03, 3), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      tri.rotation.z = -Math.PI / 2;
      tri.position.z = 0.009;
      play.add(disc, tri);
      add(play, 1);
    }
    const playhead = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.22, 0.006), new THREE.MeshBasicMaterial({ color: 0xf9fe02, toneMapped: false }));
    add(playhead, 1);
    const strip = new THREE.Mesh(
      new RoundedBoxGeometry(0.34, 0.05, 0.008, 2, 0.003),
      new THREE.MeshBasicMaterial({
        map: tex(512, 76, (g, w, h) => {
          g.fillStyle = "#111";
          g.fillRect(0, 0, w, h);
          for (let x = 4; x < w; ) {
            const len = 30 + ((x * 7) % 50);
            g.fillStyle = x % 3 === 0 ? "#d9d400" : "#555";
            g.fillRect(x, 14, len - 3, h - 28);
            x += len;
          }
        }),
      }),
    );
    add(strip, 1);
    for (let i = 0; i < 3; i++) add(new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.13), new THREE.MeshStandardMaterial({ map: T.script, side: THREE.DoubleSide, roughness: 0.9 })), 1);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cam.aspect = w / h;
    const tall = w / h < 1;
    this.cam.fov = tall ? 44 : 30;
    this.cam.setViewOffset(w, h, tall ? 0 : -w * 0.1, tall ? h * 0.1 : 0, w, h);
    this.cam.updateProjectionMatrix();
  }

  render(w: number, clock: number, pointer: { x: number; y: number }) {
    const her = this.her;
    const appear = sm(TAN.appear, TAN.appear + 0.1, w);
    const open = Math.pow(clamp((w - TAN.open) / (TAN.opened - TAN.open)), 1.6);
    const enter = sm(TAN.enter, TAN.inside, w);

    // she stands, looks at you, breathes; the jaw drops as the mouth opens
    applyPose(her, POSES.stand, { head: [-open * 0.14 + Math.sin(clock * 0.4) * 0.01 * (1 - open), Math.sin(clock * 0.23) * 0.04 * (1 - open), 0.03], spine: [-open * 0.05, 0, 0] });
    breathe(her, clock, 1.2, 0.6 * (1 - open));
    if (open < 0.05) blink(her, clock, 1.3);
    else for (const e of her.face.eyes) e.scale.y = 1 + open * 0.25; // eyes widen, deadpan
    her.face.brows.forEach((b, i) => (b.position.y = 0.014 + open * 0.008 + (i ? 0.002 : 0)));
    // the jaw drops: the head lengthens from the top down, the mouth opens and slides with it
    her.face.skull.scale.y = 1 + open * 0.24;
    her.face.skull.position.y = 0.105 - open * 0.026;
    const mo = her.face.mouthOpen;
    const mx = 0.0001 + open * 0.03;
    const my = 0.0001 + open * 0.046;
    mo.scale.set(mx, my, 0.012 + open * 0.02);
    mo.position.y = -0.077 - open * 0.032;
    mo.position.z = 0.085 + open * 0.006;
    this.lips.position.copy(mo.position).setZ(mo.position.z + 0.004);
    this.lips.scale.set(mx * 1.04, my * 1.04, Math.max(0.0001, open * 0.03));
    this.lips.visible = open > 0.03;
    her.face.mouth.visible = open < 0.08;
    // the black behind the mouth only exists once the camera is on its way in
    this.throat.visible = enter > 0.35;

    // the cigarette: smoulders, then falls out when the jaw goes
    const fall = sm(TAN.open, TAN.open + 0.08, w);
    this.cig.position.set(0.022 + fall * 0.02, 0.03 - fall * fall * 0.9, 0.09 + fall * 0.05);
    this.cig.rotation.set(Math.PI / 2 - 0.35 + fall * 2.2, 0, -0.45 - fall * 0.8);
    this.cig.visible = fall < 0.98;
    this.ember.color.setRGB(1, 0.62 + Math.sin(clock * 2.2) * 0.08, 0.2).multiplyScalar(0.8 + Math.sin(clock * 1.7) * 0.2);
    const tip = this.tmp;
    this.cig.children[3].getWorldPosition(tip);
    this.smoke.forEach((m, i) => {
      const k = (clock * 0.18 + i / this.smoke.length) % 1;
      m.position.set(tip.x + Math.sin(clock + i) * 0.01 + k * 0.02, tip.y + k * 0.28, tip.z + k * 0.02);
      m.scale.setScalar(0.5 + k * 2.2);
      m.lookAt(this.cam.position);
      (m.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.12 * (1 - fall) * appear;
    });
    this.tag.rotation.z = -0.22 + Math.sin(clock * 0.9) * 0.04 - open * 0.3;
    this.tag.position.x = 0.24 - sm(0.55, 0.75, w) * 0.2;
    this.tag.position.y = 1.73 - sm(0.55, 0.75, w) * 0.1;
    this.tag.scale.setScalar(1 - sm(0.6, 0.76, w) * 0.999);

    // where the mouth is, in the world and on screen
    her.root.updateMatrixWorld(true);
    mo.getWorldPosition(this.mouthAt);

    // the pull: everything spirals into the mouth and vanishes there
    for (const t of this.things) {
      const show = sm(TAN.open - 0.02, TAN.open + 0.06, w);
      const u = clamp((w - t.start) / 0.2);
      const k = u * u * u;
      t.o.visible = show > 0.01 && u < 1;
      if (!t.o.visible) continue;
      const ang = k * t.spin * 2.4;
      const dx = (t.from.x - this.mouthAt.x) * (1 - k);
      const dy = (t.from.y - this.mouthAt.y) * (1 - k);
      const dz = (t.from.z - this.mouthAt.z) * (1 - k);
      t.o.position.set(this.mouthAt.x + dx * Math.cos(ang) - dy * Math.sin(ang), this.mouthAt.y + dx * Math.sin(ang) + dy * Math.cos(ang) + Math.sin(clock + t.bob) * 0.01 * (1 - k), this.mouthAt.z + dz);
      t.o.rotation.z += 0.004 + k * 0.2;
      t.o.rotation.y += 0.003;
      t.o.scale.setScalar(t.size * Math.max(0.001, show * (1 - k * 0.92)));
    }

    // camera: a slow push, a hold while she opens, then straight into the mouth
    const push = sm(0, TAN.open, w);
    this.p.set(0, 1.66, lerp(1.7, 1.05, push) - open * 0.12);
    this.l.set(0, 1.635, 0);
    this.p.x += pointer.x * 0.03 * (1 - enter);
    this.p.y += pointer.y * 0.02 * (1 - enter);
    if (enter > 0) {
      const e = enter * enter * (3 - 2 * enter);
      this.throat.getWorldPosition(this.tmp);
      this.p.lerp(this.tmp, e);
      this.l.lerp(this.tmp.copy(this.mouthAt).add(new THREE.Vector3(0, 0, -0.3)), Math.min(1, e * 1.5));
    }
    this.cam.position.copy(this.p);
    this.cam.lookAt(this.l);
    // undo the off-centre framing as we go in, so the mouth ends up dead centre
    const tall = this.w / this.h < 1;
    this.cam.setViewOffset(this.w, this.h, tall ? 0 : -this.w * 0.1 * (1 - enter), tall ? this.h * 0.1 * (1 - enter) : 0, this.w, this.h);

    // light: she comes out of the dark, and the light goes with the camera into the black
    const lit = appear * (1 - sm(TAN.enter + 0.06, TAN.inside, w));
    this.key.intensity = 14 * lit;
    this.rim.intensity = 10 * lit;
    this.yellowRim.intensity = 0.6 * lit;
    this.hemi.intensity = 0.35 * lit;
    this.scene.environmentIntensity = 0.18 * lit;

    this.mouthAt.project(this.cam);
    tanishkaMouth.x = (this.mouthAt.x * 0.5 + 0.5) * this.w;
    tanishkaMouth.y = (-this.mouthAt.y * 0.5 + 0.5) * this.h;
    tanishkaMouth.open = open;

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
