import * as THREE from "three";

/**
 * People for the 3D worlds — one builder for the editor, the studio crew, the miniature set and
 * Tanishka, so they all share a look: premium stylized, human proportions, soft clay-like
 * materials. Units are metres; a person faces +z, feet at y = 0.
 *
 * Every person is a small joint hierarchy (hips → spine → shoulders/elbows/wrists, neck → head,
 * hips → knees → ankles) so poses and subtle motion are just joint rotations.
 */

export type HairStyle = "short" | "bob" | "bun" | "buzz";
export type PersonOpts = {
  shirt: number;
  pants?: number;
  skin?: number;
  hair?: number;
  hairStyle?: HairStyle;
  female?: boolean;
  headphones?: boolean;
  glasses?: boolean;
  oversized?: boolean;
  shoes?: number;
  beard?: boolean;
  /** long sleeves (a hoodie / jacket) instead of a tee */
  sleeves?: "short" | "long";
};

export type Person = {
  root: THREE.Group;
  j: Record<
    "hips" | "spine" | "neck" | "head" | "shoulderL" | "elbowL" | "wristL" | "shoulderR" | "elbowR" | "wristR" | "hipL" | "kneeL" | "ankleL" | "hipR" | "kneeR" | "ankleR",
    THREE.Object3D
  >;
  face: { mouth: THREE.Mesh; mouthOpen: THREE.Mesh; eyes: THREE.Mesh[]; brows: THREE.Mesh[]; skull: THREE.Mesh; group: THREE.Group };
  mats: Record<string, THREE.Material>;
};

const HIP_H = 0.94;

export function personMaterials(o: PersonOpts) {
  return {
    skin: new THREE.MeshStandardMaterial({ color: o.skin ?? 0xc08a66, roughness: 0.58, metalness: 0 }),
    shirt: new THREE.MeshPhysicalMaterial({ color: o.shirt, roughness: 0.82, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(o.shirt) }),
    pants: new THREE.MeshStandardMaterial({ color: o.pants ?? 0x121212, roughness: 0.88 }),
    hair: new THREE.MeshStandardMaterial({ color: o.hair ?? 0x17110c, roughness: 0.72 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.5 }),
    shoes: new THREE.MeshStandardMaterial({ color: o.shoes ?? 0xe9e6de, roughness: 0.6 }),
    sole: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
    gear: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.38, metalness: 0.35 }),
    cushion: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.3, metalness: 0.9 }),
    lip: new THREE.MeshStandardMaterial({ color: 0x8a4a3c, roughness: 0.6 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.4 }),
  };
}

/** A head that isn't a ball: narrower jaw, a chin, a flatter face plane, a fuller back. */
function headGeometry(female: boolean) {
  const g = new THREE.SphereGeometry(1, 56, 44);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let X = x * (female ? 0.086 : 0.091);
    let Y = y * (female ? 0.112 : 0.118);
    let Z = z * 0.102;
    if (y < 0) {
      const k = -y;
      X *= 1 - (female ? 0.36 : 0.3) * k * k;
      Z *= 1 - 0.1 * k;
      if (z > 0) Z += 0.01 * k * z;
    }
    if (z > 0) Z *= 0.93;
    if (z < 0 && y > -0.3) Z *= 1.06;
    // cheekbones
    X *= 1 + 0.04 * Math.exp(-((y + 0.1) ** 2) * 20) * Math.max(0, z);
    p.setXYZ(i, X, Y, Z);
  }
  g.computeVertexNormals();
  return g;
}

/** Hair as a shell around the head; where there is no hair, the shell tucks inside the skull. */
function hairGeometry(style: HairStyle) {
  const g = new THREE.SphereGeometry(1, 56, 44);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const front = Math.max(0, z);
    let hairline: number;
    let out: number;
    if (style === "bob") {
      // frames the face, falls to the jaw at the sides and back, bangs at the front
      hairline = z > 0.45 && Math.abs(x) < 0.75 ? 0.42 : -0.62;
      out = 1.13 + (y < 0 ? 0.08 * -y : 0) + 0.02 * Math.sin(x * 9 + y * 5);
    } else if (style === "bun") {
      hairline = lerp(-0.2, 0.42, (z + 1) / 2) - 0.25 * (1 - front) * Math.abs(x);
      out = 1.06;
    } else if (style === "buzz") {
      hairline = lerp(-0.1, 0.46, (z + 1) / 2) - 0.2 * Math.abs(x);
      out = 1.025;
    } else {
      hairline = lerp(-0.22, 0.48, (z + 1) / 2) - 0.32 * Math.abs(x) * (1 - front * 0.6);
      out = 1.075 + 0.06 * Math.max(0, y) + 0.018 * Math.sin(x * 11 + z * 7) * Math.max(0, y);
    }
    const inHair = y > hairline;
    const s = inHair ? out : 0.9;
    let X = x * 0.091 * s;
    let Y = y * 0.118 * s;
    let Z = z * 0.102 * s;
    if (inHair && style === "short" && y > 0.55 && z > 0.1) {
      Z += 0.012 * z; // a little quiff
      Y += 0.01;
    }
    if (style === "bob" && inHair && z > 0.45 && Math.abs(x) < 0.75) Z += 0.008; // bangs sit off the forehead
    p.setXYZ(i, X, Y, Z);
  }
  g.computeVertexNormals();
  return g;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function capsule(r: number, len: number, mat: THREE.Material, seg = 16) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, seg), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function torsoGeometry(oversized: boolean, female: boolean) {
  const o = oversized ? 0.022 : 0;
  const f = female ? -0.012 : 0;
  const prof: [number, number][] = [
    [-0.13 - o, 0.0],
    [-0.13 - o, 0.168 + o * 1.1 + f],
    [-0.04, 0.165 + o + f],
    [0.1, 0.158 + o + f * 1.4],
    [0.24, 0.17 + o + (female ? 0.006 : 0)],
    [0.36, 0.188 + o + f],
    [0.45, 0.2 + o + f * 1.5],
    [0.5, 0.188 + o + f],
    [0.535, 0.145 + o * 0.5],
    [0.555, 0.08],
    [0.56, 0.0],
  ];
  const g = new THREE.LatheGeometry(
    prof.map(([y, r]) => new THREE.Vector2(r, y)),
    40,
  );
  g.scale(1, 1, 0.6);
  g.computeVertexNormals();
  return g;
}

export function makePerson(o: PersonOpts): Person {
  const female = !!o.female;
  const mats = personMaterials(o);
  const root = new THREE.Group();
  const J = (name: string, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const n = new THREE.Object3D();
    n.name = name;
    n.position.set(x, y, z);
    parent.add(n);
    return n;
  };
  const hips = J("hips", root, 0, HIP_H, 0);
  const spine = J("spine", hips, 0, 0.02, 0);

  // torso: the shirt
  const torso = new THREE.Mesh(torsoGeometry(!!o.oversized, female), mats.shirt);
  torso.castShadow = true;
  torso.receiveShadow = true;
  spine.add(torso);
  // a soft hem line and neckline so the tee reads as cloth
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.168 + (o.oversized ? 0.024 : 0), 0.006, 6, 40), mats.shirt);
  hem.rotation.x = Math.PI / 2;
  hem.scale.set(1, 0.6, 1);
  hem.position.y = o.oversized ? -0.152 : -0.13;
  spine.add(hem);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.009, 8, 28), mats.shirt);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1, 0.75, 1);
  collar.position.y = 0.552;
  spine.add(collar);

  // pelvis
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mats.pants);
  pelvis.scale.set(0.165, 0.11, 0.105);
  pelvis.position.y = -0.06;
  pelvis.castShadow = true;
  hips.add(pelvis);

  // neck + head
  const neck = J("neck", spine, 0, 0.53, 0.004);
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.1, 20), mats.skin);
  neckMesh.position.y = 0.035;
  neckMesh.castShadow = true;
  neck.add(neckMesh);
  const head = J("head", neck, 0, 0.055, 0.012);
  const skull = new THREE.Mesh(headGeometry(female), mats.skin);
  skull.position.y = 0.105;
  skull.castShadow = true;
  head.add(skull);
  const F = new THREE.Group();
  F.position.y = 0.105;
  head.add(F);
  // nose, ears
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mats.skin);
  nose.scale.set(0.011, 0.019, 0.013);
  nose.position.set(0, -0.03, 0.094);
  nose.rotation.x = 0.32;
  F.add(nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mats.skin);
    ear.scale.set(0.012, 0.028, 0.019);
    ear.position.set(s * 0.09, -0.024, -0.004);
    F.add(ear);
  }
  // eyes (a white, an iris), brows, mouth
  const eyes: THREE.Mesh[] = [];
  const brows: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.013, 14, 10), mats.white);
    white.position.set(s * 0.032, -0.006, 0.082);
    white.scale.set(1, 0.72, 0.6);
    F.add(white);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0078, 12, 10), mats.dark);
    iris.position.set(s * 0.032, -0.006, 0.0892);
    iris.scale.set(1, 1, 0.5);
    F.add(iris);
    eyes.push(iris);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0128, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.skin);
    lid.position.set(s * 0.032, -0.004, 0.081);
    lid.scale.set(1, 0.55, 0.62);
    F.add(lid);
    const brow = capsule(0.0042, 0.026, mats.hair, 8);
    brow.rotation.z = Math.PI / 2 + s * (female ? 0.12 : 0.06);
    brow.position.set(s * 0.033, 0.014, 0.092);
    F.add(brow);
    brows.push(brow);
  }
  const mouth = capsule(0.0035, female ? 0.024 : 0.028, female ? mats.lip : mats.dark, 8);
  mouth.rotation.z = Math.PI / 2;
  mouth.position.set(0, -0.074, 0.088);
  F.add(mouth);
  const mouthOpen = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  mouthOpen.position.set(0, -0.077, 0.085);
  mouthOpen.scale.set(0.0001, 0.0001, 0.0001);
  F.add(mouthOpen);
  if (o.beard) {
    const beard = new THREE.Mesh(headGeometry(female), new THREE.MeshStandardMaterial({ color: o.hair ?? 0x17110c, roughness: 0.9, transparent: true, opacity: 0.35 }));
    beard.scale.setScalar(1.012);
    beard.position.y = 0.105;
    const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.03);
    (beard.material as THREE.MeshStandardMaterial).clippingPlanes = [clip];
    head.add(beard);
  }
  // hair
  const hair = new THREE.Mesh(hairGeometry(o.hairStyle ?? (female ? "bob" : "short")), mats.hair);
  hair.position.y = 0.105;
  hair.castShadow = true;
  head.add(hair);
  if ((o.hairStyle ?? (female ? "bob" : "short")) === "short") {
    const clumps: [number, number, number, number][] = [
      [-0.04, 0.215, 0.05, 0.034],
      [0.012, 0.226, 0.058, 0.036],
      [0.05, 0.212, 0.04, 0.03],
      [-0.06, 0.2, -0.01, 0.034],
      [0.06, 0.205, -0.02, 0.032],
      [0.0, 0.222, -0.03, 0.04],
    ];
    for (const [x, y, z, r] of clumps) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mats.hair);
      c.position.set(x, y - 0.005, z);
      c.scale.set(1.2, 0.62, 1.1);
      c.rotation.set(0.3 * z * 10, x * 8, 0);
      head.add(c);
    }
  }
  if (o.hairStyle === "bun") {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 16), mats.hair);
    bun.position.set(0, 0.215, -0.06);
    head.add(bun);
  }
  // headphones: band over the top, cups on the ears
  if (o.headphones) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.011, 10, 40, Math.PI), mats.gear);
    band.position.set(0, 0.105, -0.004);
    band.scale.set(1, 1.12, 1);
    head.add(band);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.014, 8, 30, Math.PI * 0.5), mats.cushion);
    pad.position.set(0, 0.105, -0.004);
    pad.rotation.z = Math.PI * 0.25;
    pad.scale.set(1, 1.13, 1);
    head.add(pad);
    for (const s of [-1, 1]) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.05, 0.036, 28), mats.gear);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(s * 0.108, 0.098, -0.004);
      head.add(cup);
      const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.013, 10, 24), mats.cushion);
      cushion.rotation.y = Math.PI / 2;
      cushion.position.set(s * 0.093, 0.098, -0.004);
      head.add(cushion);
      const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.05, 0.012), mats.metal);
      yoke.position.set(s * 0.112, 0.145, -0.004);
      head.add(yoke);
    }
  }
  if (o.glasses) {
    const frame = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.35, metalness: 0.2 });
    for (const s of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.0034, 8, 32), frame);
      ring.position.set(s * 0.033, 0.1, 0.1);
      head.add(ring);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.026, 28), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05 }));
      lens.position.set(s * 0.033, 0.1, 0.1005);
      head.add(lens);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.09), frame);
      arm.position.set(s * 0.086, 0.104, 0.052);
      arm.rotation.y = s * 0.12;
      head.add(arm);
    }
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0024, 6, 12, Math.PI), frame);
    bridge.position.set(0, 0.103, 0.101);
    head.add(bridge);
  }

  // arms
  const sleeveLen = o.sleeves === "long" ? 0.0 : o.oversized ? 0.2 : 0.15;
  // open-ended tube, seen from inside at the cuff: its own double-sided material
  const sleeveMat = mats.shirt.clone();
  sleeveMat.side = THREE.DoubleSide;
  const arm = (s: 1 | -1, n: "L" | "R") => {
    const sh = J(`shoulder${n}`, spine, s * 0.185, 0.475, 0);
    const upper = capsule(0.048, 0.19, o.sleeves === "long" ? mats.shirt : mats.skin);
    upper.position.y = -0.135;
    sh.add(upper);
    if (o.sleeves !== "long") {
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(o.oversized ? 0.066 : 0.058, o.oversized ? 0.072 : 0.056, sleeveLen, 20, 1, true), sleeveMat);
      sleeve.position.y = -sleeveLen / 2 - 0.005;
      sleeve.castShadow = true;
      sh.add(sleeve);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(o.oversized ? 0.07 : 0.06, 20, 14), mats.shirt);
      cap.position.set(-s * 0.012, -0.005, 0);
      cap.scale.set(1, 0.72, 0.92);
      sh.add(cap);
    }
    const el = J(`elbow${n}`, sh, 0, -0.275, 0);
    const fore = capsule(0.04, 0.19, o.sleeves === "long" ? mats.shirt : mats.skin);
    fore.position.y = -0.12;
    el.add(fore);
    const wr = J(`wrist${n}`, el, 0, -0.245, 0);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.085, 0.028, 2, 2, 2), mats.skin);
    rounden(palm.geometry as THREE.BoxGeometry, 0.012);
    palm.position.y = -0.045;
    palm.castShadow = true;
    wr.add(palm);
    const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.07, 0.022, 2, 2, 2), mats.skin);
    rounden(fingers.geometry as THREE.BoxGeometry, 0.01);
    fingers.position.set(0, -0.11, 0.004);
    fingers.rotation.x = 0.35;
    wr.add(fingers);
    const thumb = capsule(0.011, 0.035, mats.skin, 8);
    thumb.position.set(-s * 0.04, -0.06, 0.014);
    thumb.rotation.z = s * 0.6;
    wr.add(thumb);
    return { sh, el, wr };
  };
  const L = arm(1, "L");
  const R = arm(-1, "R");

  // legs
  const leg = (s: 1 | -1, n: "L" | "R") => {
    const hp = J(`hip${n}`, hips, s * 0.09, -0.05, 0);
    const thigh = capsule(0.07, 0.3, mats.pants);
    thigh.position.y = -0.2;
    hp.add(thigh);
    const kn = J(`knee${n}`, hp, 0, -0.42, 0);
    const shin = capsule(0.055, 0.32, mats.pants);
    shin.position.y = -0.2;
    kn.add(shin);
    const an = J(`ankle${n}`, kn, 0, -0.43, 0);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.075, 0.27, 2, 2, 3), mats.shoes);
    rounden(shoe.geometry as THREE.BoxGeometry, 0.03);
    shoe.position.set(0, -0.045, 0.06);
    shoe.castShadow = true;
    an.add(shoe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.104, 0.018, 0.275), mats.sole);
    sole.position.set(0, -0.079, 0.06);
    an.add(sole);
    return { hp, kn, an };
  };
  const LL = leg(1, "L");
  const LR = leg(-1, "R");

  root.traverse((n) => {
    if ((n as THREE.Mesh).isMesh) (n as THREE.Mesh).castShadow = true;
  });

  return {
    root,
    j: {
      hips,
      spine,
      neck,
      head,
      shoulderL: L.sh,
      elbowL: L.el,
      wristL: L.wr,
      shoulderR: R.sh,
      elbowR: R.el,
      wristR: R.wr,
      hipL: LL.hp,
      kneeL: LL.kn,
      ankleL: LL.an,
      hipR: LR.hp,
      kneeR: LR.kn,
      ankleR: LR.an,
    },
    face: { mouth, mouthOpen, eyes, brows, skull, group: F },
    mats,
  };
}

/** Round off a subdivided box by pulling corner vertices toward an inner box (cheap bevel). */
export function rounden(g: THREE.BoxGeometry, r: number) {
  const { width, height, depth } = g.parameters;
  const p = g.attributes.position as THREE.BufferAttribute;
  const hx = width / 2 - r;
  const hy = height / 2 - r;
  const hz = depth / 2 - r;
  const v = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    c.set(THREE.MathUtils.clamp(v.x, -hx, hx), THREE.MathUtils.clamp(v.y, -hy, hy), THREE.MathUtils.clamp(v.z, -hz, hz));
    const d = v.clone().sub(c);
    if (d.lengthSq() > 0) d.setLength(r);
    p.setXYZ(i, c.x + d.x, c.y + d.y, c.z + d.z);
  }
  g.computeVertexNormals();
}

// ---------------------------------------------------------------------------------------------
// Poses. Angles in radians; a pose is a set of joint rotations applied over the rest pose.
// ---------------------------------------------------------------------------------------------
export type Pose = Partial<Record<keyof Person["j"], [number, number, number]>> & { hipY?: number };

export const POSES: Record<string, Pose> = {
  stand: {
    shoulderL: [0.05, 0, 0.12],
    shoulderR: [0.05, 0, -0.12],
    elbowL: [-0.15, 0, 0],
    elbowR: [-0.15, 0, 0],
  },
  sit: {
    hipY: 0.52,
    hipL: [-1.5, 0, 0.06],
    hipR: [-1.5, 0, -0.06],
    kneeL: [1.45, 0, 0],
    kneeR: [1.45, 0, 0],
    ankleL: [0.05, 0, 0],
    ankleR: [0.05, 0, 0],
  },
};

export function applyPose(p: Person, ...poses: Pose[]) {
  for (const k of Object.keys(p.j) as (keyof Person["j"])[]) p.j[k].rotation.set(0, 0, 0);
  p.j.hips.position.y = HIP_H;
  for (const pose of poses) {
    if (pose.hipY !== undefined) p.j.hips.position.y = pose.hipY;
    for (const [k, v] of Object.entries(pose)) {
      if (k === "hipY" || !v) continue;
      const [x, y, z] = v as [number, number, number];
      const n = p.j[k as keyof Person["j"]];
      n.rotation.x += x;
      n.rotation.y += y;
      n.rotation.z += z;
    }
  }
}

/** Breathing and a little life, layered over whatever pose is set. Call after applyPose. */
export function breathe(p: Person, t: number, seed = 0, amount = 1) {
  const b = Math.sin(t * 1.3 + seed) * 0.012 * amount;
  p.j.spine.rotation.x += b * 0.5;
  p.j.spine.scale.set(1 + b * 0.4, 1 + b * 0.3, 1 + b * 0.6);
  p.j.head.rotation.y += Math.sin(t * 0.37 + seed * 2) * 0.04 * amount;
  p.j.head.rotation.x += Math.sin(t * 0.29 + seed) * 0.02 * amount;
}

/** Blink: squash the eyes for a beat every few seconds. */
export function blink(p: Person, t: number, seed = 0) {
  const c = (t + seed * 1.7) % 4.6;
  const s = c < 0.12 ? 0.15 : 1;
  for (const e of p.face.eyes) e.scale.y = s;
}
