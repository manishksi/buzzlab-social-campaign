import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** Physical props for the machine, built from primitives. Units: roughly metres. */

export const mats = {
  yellow: () =>
    new THREE.MeshPhysicalMaterial({ color: 0xf9fe02, roughness: 0.32, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.22, emissive: 0xf9fe02, emissiveIntensity: 0 }),
  black: () => new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.28, metalness: 0.1 }),
  body: () => new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.42, metalness: 0.65 }),
  rubber: () => new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.85, metalness: 0 }),
  bone: () => new THREE.MeshStandardMaterial({ color: 0xeeebe3, roughness: 0.55, metalness: 0 }),
  glass: () => new THREE.MeshPhysicalMaterial({ color: 0x0a0a12, roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02 }),
};

/** A circular yellow play button: a thick puck with rounded edges and an embossed black triangle. */
export function playButton(rough: THREE.Texture) {
  const g = new THREE.Group();
  const R = 1;
  const T = 0.34;
  const bev = 0.12;
  // profile of the puck, revolved: flat face, rounded rim, flat back
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(0, -T / 2));
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    pts.push(new THREE.Vector2(R - bev + Math.cos(a) * bev, Math.sin(a) * (T / 2)));
  }
  pts.push(new THREE.Vector2(0, T / 2));
  const lathe = new THREE.LatheGeometry(pts, 96);
  lathe.rotateX(Math.PI / 2);
  const m = mats.yellow();
  m.roughnessMap = rough;
  const puck = new THREE.Mesh(lathe, m);
  puck.castShadow = true;
  g.add(puck);
  // the triangle, slightly rounded and raised from the face
  const tri = new THREE.Shape();
  const s = 0.42;
  const rr = 0.07;
  const P = [new THREE.Vector2(-s * 0.62, -s), new THREE.Vector2(s * 1.05, 0), new THREE.Vector2(-s * 0.62, s)];
  for (let i = 0; i < 3; i++) {
    const a = P[i];
    const b = P[(i + 1) % 3];
    const c = P[(i + 2) % 3];
    const ab = b.clone().sub(a).normalize();
    const ca = a.clone().sub(c).normalize();
    const p0 = a.clone().sub(ca.clone().multiplyScalar(rr));
    const p1 = a.clone().add(ab.clone().multiplyScalar(rr));
    if (i === 0) tri.moveTo(p0.x, p0.y);
    else tri.lineTo(p0.x, p0.y);
    tri.quadraticCurveTo(a.x, a.y, p1.x, p1.y);
  }
  const triGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3 });
  const triMesh = new THREE.Mesh(triGeo, new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5, metalness: 0 }));
  triMesh.position.z = T / 2 - 0.01;
  triMesh.castShadow = true;
  g.add(triMesh);
  return { group: g, puck, tri: triMesh, material: m };
}

/** A cinema camera on a tripod. Lens points along -x by default (toward the content coming in). */
export function cinemaCamera(T: Record<string, THREE.Texture>, opts: { eye?: boolean } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.55, 0.42, 4, 0.05), mats.body());
  body.castShadow = true;
  g.add(body);
  // lens: barrel + rings + front glass
  const lens = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.5, 40), mats.rubber());
  barrel.rotation.z = Math.PI / 2;
  lens.add(barrel);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 8, 40), i === 1 ? mats.yellow() : mats.body());
    ring.rotation.y = Math.PI / 2;
    ring.position.x = -0.08 - i * 0.12;
    lens.add(ring);
  }
  const front = new THREE.Mesh(new THREE.CircleGeometry(0.16, 40), mats.glass());
  front.rotation.y = -Math.PI / 2;
  front.position.x = -0.255;
  lens.add(front);
  // the lens that is also an eye: a yellow iris and a pupil that can blink
  let eye: THREE.Group | null = null;
  if (opts.eye) {
    eye = new THREE.Group();
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.1, 40), new THREE.MeshBasicMaterial({ color: 0xf9fe02 }));
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.045, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    pupil.position.z = 0.001;
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.016, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(-0.03, 0.03, 0.002);
    eye.add(iris, pupil, glint);
    eye.rotation.y = -Math.PI / 2;
    eye.position.x = -0.258;
    lens.add(eye);
  }
  lens.position.set(-0.68, 0, 0);
  g.add(lens);
  // matte box
  const matte = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.16, 4, 1, true), mats.rubber());
  matte.rotation.z = Math.PI / 2;
  matte.rotation.x = Math.PI / 4;
  matte.position.x = -0.98;
  (matte.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  g.add(matte);
  // top handle and side monitor with REC
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 24, Math.PI), mats.rubber());
  handle.position.set(0, 0.28, 0);
  g.add(handle);
  const mon = new THREE.Group();
  const monBody = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.28, 0.05, 2, 0.015), mats.rubber());
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.24), new THREE.MeshBasicMaterial({ map: T.monitor, toneMapped: false }));
  screen.position.z = 0.027;
  mon.add(monBody, screen);
  mon.position.set(0.1, 0.5, 0.22);
  mon.rotation.y = 0.35;
  g.add(mon);
  const rec = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.13), new THREE.MeshBasicMaterial({ map: T.rec, toneMapped: false, transparent: true }));
  rec.position.set(0.02, 0.05, 0.215);
  g.add(rec);
  const tally = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), new THREE.MeshBasicMaterial({ color: 0xf9fe02 }));
  tally.position.set(-0.36, 0.2, 0.2);
  g.add(tally);
  // tripod
  const legs = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 1.7, 8), mats.body());
    leg.position.set(Math.cos(a) * 0.32, -1.05, Math.sin(a) * 0.32);
    leg.rotation.z = Math.cos(a) * 0.22;
    leg.rotation.x = -Math.sin(a) * 0.22;
    legs.add(leg);
  }
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 16), mats.body());
  head.position.y = -0.34;
  legs.add(head);
  g.add(legs);
  return { group: g, rec, tally, eye, legs };
}

export function directorsChair(T: Record<string, THREE.Texture>) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6 });
  const leg = (x: number, z: number, rz: number) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), wood);
    m.position.set(x, 0.5, z);
    m.rotation.z = rz;
    g.add(m);
  };
  leg(-0.25, -0.2, 0.25);
  leg(0.25, -0.2, -0.25);
  leg(-0.25, 0.2, 0.25);
  leg(0.25, 0.2, -0.25);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.02, 0.42), mats.bone());
  seat.position.y = 0.8;
  g.add(seat);
  for (const x of [-0.27, 0.27]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.7, 8), wood);
    post.position.set(x, 1.15, -0.2);
    g.add(post);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.46), wood);
    arm.position.set(x, 1.02, 0);
    g.add(arm);
  }
  // the canvas back reads correctly from both sides
  for (const side of [0, 1]) {
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.22), new THREE.MeshStandardMaterial({ map: T.chair, roughness: 0.7 }));
    back.position.set(0, 1.36, -0.2 - side * 0.002);
    back.rotation.y = side * Math.PI;
    g.add(back);
  }
  return g;
}

export function microphone() {
  const g = new THREE.Group();
  const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 8, 24), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 }));
  capsule.rotation.z = Math.PI / 2;
  g.add(capsule);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.05, 24), mats.yellow());
  band.rotation.z = Math.PI / 2;
  band.position.x = 0.15;
  g.add(band);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.4, 8), mats.body());
  pole.rotation.z = Math.PI / 2;
  pole.position.x = 1.45;
  g.add(pole);
  return g;
}

export function softbox() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.18, 0.5, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, side: THREE.DoubleSide }));
  box.rotation.x = Math.PI / 2;
  box.rotation.y = Math.PI / 4;
  g.add(box);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.76), new THREE.MeshBasicMaterial({ color: 0xfffbe0 }));
  face.position.z = 0.25;
  g.add(face);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.2, 8), mats.body());
  stand.position.y = -1.3;
  g.add(stand);
  return { group: g, face };
}

/** The giant mouse pointer. */
export function cursor() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0, -1.6);
  s.lineTo(0.38, -1.22);
  s.lineTo(0.64, -1.82);
  s.lineTo(0.88, -1.72);
  s.lineTo(0.62, -1.12);
  s.lineTo(1.12, -1.12);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
  geo.center();
  const g = new THREE.Group();
  const fill = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.35 }));
  const edge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
  edge.scale.setScalar(1.07);
  g.add(edge, fill);
  return g;
}

/** A content tile: the piece itself plus, for reels, a UI layer that can fade away. */
export function tile(tex: THREE.Texture, w: number, h: number, ui?: THREE.Texture) {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.03, h * 1.03), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  back.position.z = -0.005;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
  g.add(back, face);
  let uiMesh: THREE.Mesh | null = null;
  if (ui) {
    uiMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ui, transparent: true, toneMapped: false, depthWrite: false }));
    uiMesh.position.z = 0.003;
    g.add(uiMesh);
  }
  return { group: g, face, ui: uiMesh, back };
}

/** The edit timeline: a long dark strip with four tracks of clips and a yellow playhead. */
export function timeline(length: number) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(length, 0.04, 2.6), new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.6 }));
  base.receiveShadow = true;
  g.add(base);
  const clipMats = [new THREE.MeshStandardMaterial({ color: 0xeeebe3, roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5 }), mats.yellow()];
  const cuts: number[] = [];
  const clips: THREE.Mesh[] = [];
  for (let track = 0; track < 4; track++) {
    let x = -length / 2 + 0.3 + (track * 0.7) % 1.3;
    let k = 0;
    while (x < length / 2 - 1) {
      const len = 1.2 + ((Math.sin(track * 31 + k * 7.7) + 1) / 2) * 3.4;
      const m = clipMats[track === 1 && k % 3 === 1 ? 2 : track < 2 ? (k % 2 ? 1 : 0) : 1];
      const clip = new THREE.Mesh(new THREE.BoxGeometry(Math.min(len, length / 2 - 0.5 - x) - 0.08, 0.06, 0.46), m);
      clip.position.set(x + clip.geometry.parameters.width / 2, 0.05, -0.95 + track * 0.62);
      clip.castShadow = true;
      g.add(clip);
      clips.push(clip);
      if (track === 0) cuts.push(x + len);
      x += len;
      k++;
    }
  }
  // ruler ticks
  const tickMat = new THREE.MeshBasicMaterial({ color: 0x5a5a5a });
  for (let x = -length / 2; x < length / 2; x += 0.5) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, (x * 2) % 2 === 0 ? 0.18 : 0.09), tickMat);
    t.position.set(x, 0.03, -1.25);
    g.add(t);
  }
  const playhead = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2.4, 0.035), new THREE.MeshBasicMaterial({ color: 0xf9fe02 }));
  bar.position.y = 1.1;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 3), new THREE.MeshBasicMaterial({ color: 0xf9fe02 }));
  cap.rotation.x = Math.PI;
  cap.position.y = 2.35;
  playhead.add(bar, cap);
  playhead.position.z = -1.3;
  g.add(playhead);
  return { group: g, playhead, cuts, clips };
}

/** A giant feed: a tall phone frame with a 3-column grid of slots. */
export function feedFrame(w: number, h: number) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.5, h + 0.9, 0.18, 6, 0.4), new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.25, metalness: 0.6 }));
  frame.position.z = -0.12;
  g.add(frame);
  // a thin off-white edge so the giant phone reads against the dark
  const edge = new THREE.Mesh(new RoundedBoxGeometry(w + 0.58, h + 0.98, 0.1, 6, 0.43), new THREE.MeshBasicMaterial({ color: 0x8a8882 }));
  edge.position.z = -0.17;
  g.add(edge);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  screen.position.z = -0.02;
  g.add(screen);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.5), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  bar.position.set(0, h / 2 - 0.25, -0.01);
  g.add(bar);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), new THREE.MeshBasicMaterial({ color: 0xf9fe02 }));
  dot.position.set(-w / 2 + 0.4, h / 2 - 0.25, 0);
  g.add(dot);
  return g;
}
