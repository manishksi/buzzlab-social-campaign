import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * Production gear built at real-world scale with real materials — anodised metal, rubber, glass,
 * fabric — for the sets that need to read as a professional production (the miniature set, the
 * studio floor). Units: metres. Everything casts and receives shadows.
 */

export const gearMats = () => ({
  anod: new THREE.MeshPhysicalMaterial({ color: 0x1c1c1e, roughness: 0.38, metalness: 0.75, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
  black: new THREE.MeshPhysicalMaterial({ color: 0x0d0d0d, roughness: 0.5, metalness: 0.3 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.92 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x9b9ea3, roughness: 0.28, metalness: 0.95 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xd8dade, roughness: 0.12, metalness: 1 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x0a0c14, roughness: 0.04, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 0.9 }),
  yellow: new THREE.MeshPhysicalMaterial({ color: 0xf2e400, roughness: 0.4, clearcoat: 0.5 }),
  fabric: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.96 }),
  diffusion: new THREE.MeshStandardMaterial({ color: 0xfaf6ec, roughness: 0.9, emissive: 0xfff4dc, emissiveIntensity: 0.6, side: THREE.DoubleSide }),
  wood: new THREE.MeshStandardMaterial({ color: 0x2a221b, roughness: 0.62 }),
});
type M = ReturnType<typeof gearMats>;

const shadow = (o: THREE.Object3D) => {
  o.traverse((n) => {
    const m = n as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return o;
};

/** A three-legged stand (tripod / light stand) whose legs meet a column at `h`. */
function legs(m: M, h: number, spread: number, r = 0.012) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const foot = new THREE.Vector3(Math.cos(a) * spread, 0, Math.sin(a) * spread);
    const top = new THREE.Vector3(Math.cos(a) * 0.04, h, Math.sin(a) * 0.04);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, foot.distanceTo(top), 10), m.steel);
    leg.position.copy(foot).lerp(top, 0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(r * 1.6, 10, 8), m.rubber);
    shoe.position.copy(foot);
    g.add(leg, shoe);
    // spreader
    const mid = foot.clone().lerp(top, 0.25);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, mid.length(), 6), m.anod);
    sp.position.copy(mid).multiplyScalar(0.5).setY(mid.y);
    sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(mid.x, 0, mid.z).normalize());
    g.add(sp);
  }
  return g;
}

/** Cinema camera on a fluid-head tripod. Lens along -z. Returns the group and the lens tip. */
export function proCamera(m: M, opts: { tripod?: boolean; height?: number } = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 1.38;
  const cam = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.13, 0.2, 3, 0.012), m.anod);
  const side = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.1, 0.16, 2, 0.006), m.black);
  side.position.set(0.07, 0, 0);
  const battery = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.08, 0.04, 2, 0.008), m.black);
  battery.position.set(0, -0.005, 0.12);
  // lens: barrel, rings, front element
  const lens = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.046, 0.16, 32), m.black);
  barrel.rotation.x = Math.PI / 2;
  lens.add(barrel);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.018, 40), i === 1 ? m.yellow : m.rubber);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = -0.03 - i * 0.04;
    lens.add(ring);
  }
  const front = new THREE.Mesh(new THREE.CircleGeometry(0.038, 32), m.glass);
  front.position.z = -0.081;
  front.rotation.y = Math.PI;
  lens.add(front);
  lens.position.set(0, 0, -0.18);
  // matte box with flags
  const mb = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.06), m.black);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.095), m.glass);
  hole.position.z = -0.031;
  hole.rotation.y = Math.PI;
  const flagTop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.003, 0.08), m.black);
  flagTop.position.set(0, 0.062, -0.07);
  flagTop.rotation.x = -0.15;
  mb.add(box, hole, flagTop);
  mb.position.set(0, 0, -0.3);
  // top handle, rails, monitor
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 8, 20, Math.PI), m.black);
  handle.position.set(0, 0.075, -0.02);
  handle.rotation.y = Math.PI / 2;
  const rails = new THREE.Group();
  for (const x of [-0.03, 0.03]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.42, 10), m.steel);
    r.rotation.x = Math.PI / 2;
    r.position.set(x, -0.085, -0.1);
    rails.add(r);
  }
  const mon = new THREE.Group();
  const mf = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.09, 0.02, 2, 0.005), m.black);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.125, 0.075), new THREE.MeshBasicMaterial({ color: 0x2b3238 }));
  scr.position.z = 0.0105;
  mon.add(mf, scr);
  mon.position.set(-0.11, 0.11, 0.02);
  mon.rotation.y = -0.6;
  const tally = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3020 }));
  tally.position.set(0.03, 0.066, -0.09);
  cam.add(body, side, battery, lens, mb, handle, rails, mon, tally);
  cam.position.y = H;
  g.add(cam);
  if (opts.tripod !== false) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 20), m.black);
    head.position.y = H - 0.13;
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m.anod);
    bowl.position.y = H - 0.17;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.4, 8), m.steel);
    arm.rotation.x = Math.PI / 2 - 0.35;
    arm.position.set(0.05, H - 0.15, 0.2);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 10), m.rubber);
    grip.rotation.x = Math.PI / 2 - 0.35;
    grip.position.set(0.05, H - 0.08, 0.4);
    g.add(head, bowl, arm, grip, legs(m, H - 0.18, 0.42));
  }
  shadow(g);
  return { group: g, cam, tally, monitor: scr };
}

/** An LED softbox on a light stand, aimed along -z of its group. */
export function proSoftbox(m: M, opts: { height?: number; size?: number } = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 1.9;
  const S = opts.size ?? 0.6;
  const head = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(S * 0.72, S * 0.2, S * 0.55, 4, 1, true), m.fabric);
  shell.rotation.x = Math.PI / 2;
  shell.rotation.y = Math.PI / 4;
  (shell.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(S, S), m.diffusion.clone());
  face.position.z = -S * 0.275;
  face.rotation.y = Math.PI;
  const lamp = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.16, 0.1, 2, 0.01), m.anod);
  lamp.position.z = S * 0.32;
  const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 6, 20, Math.PI), m.steel);
  yoke.position.z = S * 0.3;
  yoke.rotation.z = Math.PI;
  head.add(shell, face, lamp, yoke);
  head.position.y = H;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, H - 0.4, 10), m.steel);
  column.position.y = 0.4 + (H - 0.4) / 2 - 0.05;
  g.add(head, column, legs(m, 0.45, 0.4));
  shadow(g);
  return { group: g, head, face };
}

/** A C-stand with a grip arm and a black flag. */
export function cStand(m: M) {
  const g = new THREE.Group();
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 1.9, 10), m.steel);
  column.position.y = 0.95;
  const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), m.anod);
  knuckle.position.y = 1.86;
  knuckle.rotation.z = Math.PI / 2;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 8), m.steel);
  arm.rotation.z = Math.PI / 2 - 0.15;
  arm.position.set(-0.45, 1.93, 0);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.008), m.black);
  frame.position.set(-0.98, 2.0, 0);
  frame.rotation.y = 0.3;
  // turtle base: three flat legs at different heights
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.012, 0.02), m.steel);
    leg.position.set(Math.cos(a) * 0.2, 0.06 + i * 0.07, Math.sin(a) * 0.2);
    leg.rotation.y = -a;
    g.add(leg);
  }
  g.add(column, knuckle, arm, frame);
  shadow(g);
  return g;
}

/** A director's / client monitor on a stand. Screen faces +z. */
export function monitorStand(m: M, screenMap: THREE.Texture, h = 1.35) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.27, 0.035, 2, 0.008), m.black);
  frame.position.y = h;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.41, 0.235), new THREE.MeshBasicMaterial({ map: screenMap, toneMapped: false }));
  screen.position.set(0, h, 0.0185);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.006, 0.12), m.black);
  hood.position.set(0, h + 0.14, 0.05);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h - 0.3, 8), m.steel);
  column.position.y = 0.3 + (h - 0.3) / 2 - 0.1;
  g.add(frame, screen, hood, column, legs(m, 0.32, 0.3, 0.01));
  shadow(g);
  return { group: g, screen };
}

/** A director's chair, canvas back printed with `label`. Faces +z. */
export function canvasChair(m: M, label: THREE.Texture) {
  const g = new THREE.Group();
  const wood = m.wood;
  const canvas = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95, side: THREE.DoubleSide });
  for (const [x, z] of [
    [-0.25, -0.2],
    [0.25, -0.2],
    [-0.25, 0.2],
    [0.25, 0.2],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.85, 0.035), wood);
    leg.position.set(x, 0.42, z);
    leg.rotation.z = x > 0 ? -0.08 : 0.08;
    g.add(leg);
  }
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.4), canvas);
  seat.position.y = 0.8;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.2), new THREE.MeshStandardMaterial({ map: label, roughness: 0.9, side: THREE.DoubleSide }));
  back.position.set(0, 1.18, -0.21);
  for (const x of [-0.27, 0.27]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.5, 0.035), wood);
    post.position.set(x, 1.1, -0.21);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.45), wood);
    arm.position.set(x, 1.0, 0);
    g.add(post, arm);
  }
  const rest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.03), wood);
  rest.position.set(0, 0.32, 0.2);
  g.add(seat, back, rest);
  shadow(g);
  return g;
}
