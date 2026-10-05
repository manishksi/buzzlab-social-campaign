import * as THREE from "three";

/**
 * People for the 3D worlds — realistic, skinned human characters built from MakeHuman's CC0 assets
 * (see public/assets/people/README.md). One male and one female body, each with hair styles,
 * outfits, shoes, eyes, brows, lashes and teeth fitted to it, all skinned to one skeleton.
 *
 * The skeleton rests "neutral": standing, arms hanging, every joint frame aligned with the world,
 * facing +z. A pose is a set of joint rotations on top of that (the same convention the scenes have
 * always used), plus finger grip, jaw, eyes and lids.
 *
 * Call `await loadPeople()` once (the world loaders do), then `makePerson()` is synchronous.
 */

const BASE = "/assets/people/";

type JointName =
  | "hips" | "spine" | "chest" | "neck" | "head" | "jaw" | "eyeL" | "eyeR" | "lidL" | "lidR"
  | "shoulderL" | "elbowL" | "wristL" | "shoulderR" | "elbowR" | "wristR"
  | "hipL" | "kneeL" | "ankleL" | "hipR" | "kneeR" | "ankleR";
const POSABLE: JointName[] = ["hips", "spine", "chest", "neck", "head", "shoulderL", "elbowL", "wristL", "shoulderR", "elbowR", "wristR", "hipL", "kneeL", "ankleL", "hipR", "kneeR", "ankleR"];

export type Sex = "m" | "f";
export type PersonOpts = {
  sex: Sex;
  /** an outfit baked for that sex: m — tee, whitetee, jacket, shirt, suit · f — tee, blouse, sport */
  outfit: string;
  /** m — short02, short04, short01, short03 · f — bob02, bob01, ponytail01, long01 */
  hair: string;
  shoes?: "sneakers" | "boots" | "navy";
  /** a colour the shoes are dyed (multiplied over their texture) */
  shoeColor?: number;
  /** skin texture: skin_m, skin_m_deep, skin_f, skin_f_light */
  skin?: string;
  /** a flat fabric colour for the top / bottom garment instead of its printed texture */
  top?: number;
  bottom?: number;
  hairColor?: number;
  /** cut away the strands that fall in front of the eyes (keeps glasses and eyes visible) */
  trimFringe?: boolean;
  /** round wire frames (true / "round") or thick rectangular ones ("rect") */
  glasses?: boolean | "round" | "rect";
  headphones?: boolean;
  /** a colour multiplied over the skin texture, to warm or deepen the tone */
  skinTint?: number;
  /** facial hair over the jaw, chin, cheeks and upper lip */
  beard?: "stubble" | "trim" | "full";
  beardColor?: number;
  /** a baseball cap in this colour */
  cap?: number;
  /** horizontal stripes of this colour across the top garment */
  stripes?: number;
};

export type Person = {
  root: THREE.Group;
  sex: Sex;
  j: Record<JointName, THREE.Bone>;
  /** fingers, e.g. f21L = index finger, first joint, left hand */
  fingers: Record<string, THREE.Bone>;
  face: { jaw: THREE.Bone; eyes: THREE.Bone[]; lids: THREE.Bone[] };
  /** head-local points (eyes, mouth, mouth corner, nose, ears, top), chest-local `chestL`, wrist-local palms */
  anchors: Record<string, THREE.Vector3>;
  meshes: THREE.SkinnedMesh[];
  mats: { skin: THREE.MeshPhysicalMaterial; [k: string]: THREE.Material };
  hipY: number;
};

// ---------------------------------------------------------------------------------------------
// loading
// ---------------------------------------------------------------------------------------------
type PartMeta = { name: string; kind: string; count: number; lo: number[]; span: number[]; pos: number; nor: number; uv: number; si: number; sw: number; ind: number; indCount: number; ind32: boolean; src?: number; reg?: number; deletes?: [number, number][] };
type BoneMeta = { name: string; parent: string | null; pos: number[]; bind: number[] };
type Lib = { bones: BoneMeta[]; parts: Record<string, { meta: PartMeta; geo: THREE.BufferGeometry; src?: Uint16Array; reg?: Uint8Array }>; anchors: Record<string, number[]>; curl: Record<string, number[]> };

const libs: Partial<Record<Sex, Lib>> = {};
const textures = new Map<string, THREE.Texture>();
let loading: Promise<void> | null = null;

function decode(buf: ArrayBuffer, m: PartMeta) {
  const n = m.count;
  const q = new Uint16Array(buf, m.pos, n * 3);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = m.lo[i % 3] + (q[i] / 65535) * m.span[i % 3];
  const nq = new Int8Array(buf, m.nor, n * 4);
  const nor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = nq[i * 4] / 127;
    const y = nq[i * 4 + 1] / 127;
    const z = nq[i * 4 + 2] / 127;
    const l = Math.hypot(x, y, z) || 1;
    nor[i * 3] = x / l;
    nor[i * 3 + 1] = y / l;
    nor[i * 3 + 2] = z / l;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Uint16Array(buf.slice(m.uv, m.uv + n * 4)), 2, true));
  g.setAttribute("skinIndex", new THREE.BufferAttribute(new Uint8Array(buf.slice(m.si, m.si + n * 4)), 4));
  g.setAttribute("skinWeight", new THREE.BufferAttribute(new Uint8Array(buf.slice(m.sw, m.sw + n * 4)), 4, true));
  const ind = m.ind32 ? new Uint32Array(buf.slice(m.ind, m.ind + m.indCount * 4)) : new Uint16Array(buf.slice(m.ind, m.ind + m.indCount * 2));
  g.setIndex(new THREE.BufferAttribute(ind, 1));
  const src = m.src !== undefined ? new Uint16Array(buf.slice(m.src, m.src + n * 2)) : undefined;
  const reg = m.reg !== undefined ? new Uint8Array(buf.slice(m.reg, m.reg + n)) : undefined;
  if (reg) {
    // two groups: bottom garment (0), top garment (1)
    const lists: number[][] = [[], []];
    for (let t = 0; t < ind.length; t += 3) {
      const r = reg[ind[t]];
      lists[r].push(ind[t], ind[t + 1], ind[t + 2]);
    }
    const all = new (m.ind32 ? Uint32Array : Uint16Array)(lists[0].length + lists[1].length);
    all.set(lists[0], 0);
    all.set(lists[1], lists[0].length);
    g.setIndex(new THREE.BufferAttribute(all, 1));
    g.addGroup(0, lists[0].length, 0);
    g.addGroup(lists[0].length, lists[1].length, 1);
  }
  return { geo: g, src, reg };
}

async function loadLib(sex: Sex) {
  const name = sex === "m" ? "male" : "female";
  const [meta, buf] = await Promise.all([fetch(BASE + name + ".json").then((r) => r.json()), fetch(BASE + name + ".bin").then((r) => r.arrayBuffer())]);
  const lib: Lib = { bones: meta.bones, parts: {}, anchors: meta.anchors, curl: meta.curl };
  for (const m of meta.parts as PartMeta[]) lib.parts[m.name] = { meta: m, ...decode(buf, m) };
  libs[sex] = lib;
}

function loadTex(key: string, color = true) {
  if (textures.has(key)) return Promise.resolve();
  return new Promise<void>((res) => {
    new THREE.TextureLoader().load(
      BASE + "tex/" + key + ".webp",
      (t) => {
        t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.anisotropy = 4;
        t.flipY = false;
        textures.set(key, t);
        res();
      },
      undefined,
      () => res(),
    );
  });
}

const COLOR_TEX = ["skin_m", "skin_m_deep", "skin_f", "skin_f_light", "eye", "brow_m", "brow_f", "lash_m", "lash_f", "teeth", "hair_short02", "hair_short04", "hair_short01", "hair_short03", "hair_bob02", "hair_bob01", "hair_ponytail01", "hair_long01", "m_tee", "m_whitetee", "m_jacket", "m_shirt", "m_suit", "f_tee", "f_blouse", "f_sport", "shoes_sneakers", "shoes_boots", "shoes_navy"];
const DATA_TEX = ["hair_short02_n", "m_tee_n", "m_tee_ao", "m_whitetee_n", "m_whitetee_ao", "m_jacket_n", "m_jacket_ao", "m_shirt_n", "m_shirt_ao", "f_tee_n", "f_tee_ao", "f_blouse_n", "f_blouse_ao", "f_sport_n", "f_sport_ao"];

/** Fetch both bodies and every texture once. Safe to call repeatedly. */
export function loadPeople() {
  if (!loading) loading = Promise.all([loadLib("m"), loadLib("f"), ...COLOR_TEX.map((k) => loadTex(k, true)), ...DATA_TEX.map((k) => loadTex(k, false))]).then(() => undefined);
  return loading;
}

// ---------------------------------------------------------------------------------------------
// materials
// ---------------------------------------------------------------------------------------------
/** Skin: a soft wrap on the diffuse term, wider in red than blue, so light bleeds warm into the shadow side like real skin. */
function skinMaterial(map?: THREE.Texture) {
  const m = new THREE.MeshPhysicalMaterial({ map, roughness: 0.5, sheen: 0.35, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xd08a70), specularIntensity: 0.6, clearcoat: 0.04, clearcoatRoughness: 0.4 });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      "#include <lights_physical_pars_fragment>",
      THREE.ShaderChunk.lights_physical_pars_fragment.replace(
        "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );",
        `float skinNL = dot( geometryNormal, directLight.direction );
	vec3 skinWrap = clamp( ( vec3( skinNL ) + vec3( 0.46, 0.2, 0.12 ) ) / vec3( 1.46, 1.2, 1.12 ), 0.0, 1.0 );
	reflectedLight.directDiffuse += skinWrap * directLight.color * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );`,
      ),
    );
  };
  m.customProgramCacheKey = () => "buzzlab-skin";
  return m;
}

const tex = (k: string) => textures.get(k);

function fabric(o: { map?: THREE.Texture; color?: number; normal?: THREE.Texture; ao?: THREE.Texture; rough?: number; sheen?: number }) {
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color ?? 0xffffff,
    roughness: o.rough ?? 0.86,
    sheen: o.sheen ?? 0.6,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(o.color ?? 0x888888).multiplyScalar(0.6),
  });
  if (o.map) m.map = o.map;
  if (o.normal) m.normalMap = o.normal;
  if (o.ao) m.aoMap = o.ao;
  return m;
}

// ---------------------------------------------------------------------------------------------
// building a person
// ---------------------------------------------------------------------------------------------
export function makePerson(o: PersonOpts): Person {
  const lib = libs[o.sex];
  if (!lib) throw new Error("loadPeople() first");
  const root = new THREE.Group();
  // skeleton
  const bones: THREE.Bone[] = [];
  const byName: Record<string, THREE.Bone> = {};
  for (const b of lib.bones) {
    const bone = new THREE.Bone();
    bone.name = b.name;
    bone.position.set(b.pos[0], b.pos[1], b.pos[2]);
    bone.quaternion.set(b.bind[0], b.bind[1], b.bind[2], b.bind[3]);
    (b.parent ? byName[b.parent] : root).add(bone);
    byName[b.name] = bone;
    bones.push(bone);
  }
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);

  const outfitDeletes = new Set<number>();
  const meshes: THREE.SkinnedMesh[] = [];
  const mats: Person["mats"] = { skin: skinMaterial(tex(o.skin ?? (o.sex === "m" ? "skin_m" : "skin_f"))) };
  if (o.skinTint !== undefined) mats.skin.color.set(o.skinTint);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], shadow = true) => {
    const m = new THREE.SkinnedMesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    m.frustumCulled = false;
    root.add(m);
    m.bind(skeleton, new THREE.Matrix4());
    meshes.push(m);
    return m;
  };
  const part = (name: string) => lib.parts[name];
  const delOf = (name: string) => part(name)?.meta.deletes?.forEach(([a, b]) => {
    for (let i = a; i <= b; i++) outfitDeletes.add(i);
  });

  // outfit
  const out = part(o.outfit);
  if (out) {
    delOf(o.outfit);
    const key = (o.sex === "m" ? "m_" : "f_") + o.outfit;
    const textured = fabric({ map: tex(key), normal: tex(key + "_n"), ao: tex(key + "_ao") });
    const top = o.top !== undefined ? fabric({ color: o.top, normal: tex(key + "_n"), ao: tex(key + "_ao"), sheen: 0.8 }) : textured;
    const bottom = o.bottom !== undefined ? fabric({ color: o.bottom, normal: tex(key + "_n"), ao: tex(key + "_ao"), rough: 0.8 }) : textured;
    if (o.stripes !== undefined && top !== textured) stripe(top as THREE.MeshPhysicalMaterial, o.stripes);
    mats.top = top;
    mats.bottom = bottom;
    add(out.geo, out.reg ? [bottom, top] : textured);
  }
  // shoes
  if (o.shoes && part(o.shoes)) {
    delOf(o.shoes);
    mats.shoes = new THREE.MeshPhysicalMaterial({ map: tex("shoes_" + o.shoes), color: o.shoeColor ?? 0xffffff, roughness: 0.55, clearcoat: o.shoes === "boots" ? 0.3 : 0 });
    add(part(o.shoes).geo, mats.shoes);
  }
  // body, with everything under the clothes removed
  {
    const b = part("body");
    const src = b.src!;
    const ind = b.geo.index!.array as ArrayLike<number>;
    const keep: number[] = [];
    for (let t = 0; t < ind.length; t += 3) {
      if (outfitDeletes.has(src[ind[t]]) || outfitDeletes.has(src[ind[t + 1]]) || outfitDeletes.has(src[ind[t + 2]])) continue;
      keep.push(ind[t], ind[t + 1], ind[t + 2]);
    }
    const g = new THREE.BufferGeometry();
    for (const k of ["position", "normal", "uv", "skinIndex", "skinWeight"]) g.setAttribute(k, b.geo.getAttribute(k));
    g.setIndex(keep);
    add(g, mats.skin);
  }
  // eyes, brows, lashes, teeth
  // the eye mesh carries a cornea shell that is transparent in the texture: cut it away, keep the iris
  mats.eyes = new THREE.MeshPhysicalMaterial({ map: tex("eye"), alphaTest: 0.5, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.6 });
  add(part("eyes").geo, mats.eyes, false);
  mats.brows = new THREE.MeshStandardMaterial({ map: tex(o.sex === "m" ? "brow_m" : "brow_f"), alphaTest: 0.3, roughness: 0.85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  add(part("brows").geo, mats.brows, false);
  mats.lashes = new THREE.MeshStandardMaterial({ map: tex(o.sex === "m" ? "lash_m" : "lash_f"), alphaTest: 0.3, roughness: 0.8, side: THREE.DoubleSide, color: 0x222222 });
  add(part("lashes").geo, mats.lashes, false);
  mats.teeth = new THREE.MeshStandardMaterial({ map: tex("teeth"), roughness: 0.3 });
  add(part("teeth").geo, mats.teeth, false);
  // hair
  const hair = part(o.hair);
  if (hair) {
    const hairMat = new THREE.MeshPhysicalMaterial({
      map: tex("hair_" + o.hair),
      color: o.hairColor ?? 0x6a5a50,
      alphaTest: 0.42,
      alphaToCoverage: true,
      side: THREE.DoubleSide,
      roughness: 0.48,
      sheen: 0.5,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color(0x6a5040),
      anisotropy: 0.6,
    });
    const hn = tex("hair_" + o.hair + "_n");
    if (hn) hairMat.normalMap = hn;
    mats.hair = hairMat;
    let geo = hair.geo;
    const head = new THREE.Vector3();
    byName.head.getWorldPosition(head);
    if (o.cap !== undefined) {
      // under a cap only the hair below its band shows: the sides and the nape (see addCap)
      const band = head.y + lib.anchors.eyeL[1] + CAP.band;
      const pos = geo.getAttribute("position");
      const ind = geo.index!.array as ArrayLike<number>;
      const keep: number[] = [];
      for (let t = 0; t < ind.length; t += 3) {
        let y = 0;
        let z = 0;
        for (let k = 0; k < 3; k++) {
          y += pos.getY(ind[t + k]) / 3;
          z += pos.getZ(ind[t + k]) / 3;
        }
        // the band runs higher at the front than at the back
        if (y > band + (z - head.z - CAP.z) * Math.tan(CAP.tilt) - 0.003) continue;
        keep.push(ind[t], ind[t + 1], ind[t + 2]);
      }
      const g2 = new THREE.BufferGeometry();
      for (const k of ["position", "normal", "uv", "skinIndex", "skinWeight"]) g2.setAttribute(k, geo.getAttribute(k));
      g2.setIndex(keep);
      geo = g2;
    }
    if (o.trimFringe) {
      // bind space: the head is unrotated, so the eyes sit at the head bone's rest position + anchor
      const eyeY = head.y + lib.anchors.eyeL[1];
      const eyeZ = head.z + lib.anchors.eyeL[2];
      const pos = geo.getAttribute("position");
      const ind = geo.index!.array as ArrayLike<number>;
      const keep: number[] = [];
      const c = new THREE.Vector3();
      for (let t = 0; t < ind.length; t += 3) {
        c.set(0, 0, 0);
        for (let k = 0; k < 3; k++) c.add(va.fromBufferAttribute(pos, ind[t + k]));
        c.multiplyScalar(1 / 3);
        if (c.z > eyeZ - 0.02 && c.y < eyeY + 0.03 && Math.abs(c.x) < 0.07) continue;
        keep.push(ind[t], ind[t + 1], ind[t + 2]);
      }
      const src = geo;
      geo = new THREE.BufferGeometry();
      for (const k of ["position", "normal", "uv", "skinIndex", "skinWeight"]) geo.setAttribute(k, src.getAttribute(k));
      geo.setIndex(keep);
    }
    add(geo, hairMat);
  }

  // facial hair, lifted off the skin (bind space, like the fringe trim above)
  if (o.beard) {
    const head = new THREE.Vector3();
    byName.head.getWorldPosition(head);
    const color = o.beardColor ?? o.hairColor ?? 0x15100c;
    for (const layer of beardLayers(o.beard)) {
      const geo = beardGeometry(part("body").geo, head, lib.anchors, o.beard, layer.lift, layer.alpha);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1 - layer.lift * 400 });
      if (layer.strands) {
        mat.alphaMap = beardStrands();
        mat.alphaTest = 0.5;
        mat.side = THREE.DoubleSide;
      } else {
        // the shadow of the beard on the skin: a smooth tint, densest in the middle
        mat.transparent = true;
        mat.depthWrite = false;
      }
      mats["beard" + layer.lift] = mat;
      add(geo, mat, false);
    }
  }

  // binding is done: rest neutral
  for (const b of bones) b.quaternion.identity();

  const j = byName as Record<JointName, THREE.Bone>;
  const anchors: Record<string, THREE.Vector3> = {};
  for (const [k, v] of Object.entries(lib.anchors)) anchors[k] = new THREE.Vector3(v[0], v[1], v[2]);
  const fingers: Record<string, THREE.Bone> = {};
  for (const n of Object.keys(byName)) if (/^f\d\d[LR]$/.test(n)) fingers[n] = byName[n];
  const p: Person = { root, sex: o.sex, j, fingers, face: { jaw: j.jaw, eyes: [j.eyeL, j.eyeR], lids: [j.lidL, j.lidR] }, anchors, meshes, mats, hipY: j.hips.position.y };
  curls.set(p, lib.curl);
  if (o.glasses) addGlasses(p, o.glasses === "rect" ? "rect" : "round");
  if (o.headphones) addHeadphones(p);
  if (o.cap !== undefined) addCap(p, o.cap);
  applyPose(p, POSES.stand);
  return p;
}

const curls = new WeakMap<Person, Record<string, number[]>>();

// ---------------------------------------------------------------------------------------------
// facial hair: a shell lifted off the face along its normals, dense in the middle of the beard
// region and thinning out at its edges (head-local metres; z forward, y up, x to the left ear)
// ---------------------------------------------------------------------------------------------
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function beardLayers(kind: "stubble" | "trim" | "full") {
  if (kind === "stubble") return [{ lift: 0.0007, alpha: 0.5, strands: false }];
  if (kind === "trim") return [{ lift: 0.0008, alpha: 0.86, strands: false }, { lift: 0.0021, alpha: 1.0, strands: true }];
  return [{ lift: 0.001, alpha: 0.96, strands: false }, { lift: 0.0032, alpha: 1.2, strands: true }, { lift: 0.005, alpha: 0.9, strands: true }];
}

/** how much beard grows at a head-local point (0–1) */
function beardDensity(v: THREE.Vector3, A: Record<string, number[]>, kind: "stubble" | "trim" | "full") {
  const ax = Math.abs(v.x);
  const ex = Math.abs(A.earL[0]);
  const mouthY = A.mouth[1];
  const nose = A.nose[1];
  // the cheek line: just under the nose in the middle, up to the sideburns at the ears
  const rise = smooth(0.03, ex * 0.97, ax);
  const top = nose - 0.009 + Math.pow(rise, kind === "full" ? 1 : 1.7) * (A.earL[1] - nose + 0.004) - (kind === "full" ? 0 : kind === "trim" ? 0.004 : 0.008);
  let d = 1 - smooth(top - 0.008, top, v.y);
  // in front of the ears
  d *= smooth(A.earL[2] - 0.004, A.earL[2] + 0.006, v.z);
  // down under the chin onto the throat, but not down the sides of the neck
  const low = mouthY - (kind === "full" ? 0.092 : kind === "trim" ? 0.074 : 0.068);
  d *= smooth(low - 0.01, low, v.y);
  if (v.y < mouthY - 0.045) d *= 1 - smooth(0.045, 0.06, ax + (mouthY - 0.045 - v.y) * 0.6);
  // the lips stay clear
  const lx = ax / (Math.abs(A.cornerL[0]) + 0.002);
  const ly = (v.y - (mouthY - 0.004)) / 0.0135;
  if (v.z > A.mouth[2] - 0.035) d *= smooth(0.85, 1.15, Math.hypot(lx, ly));
  // stubble is thinner on the cheeks
  if (kind === "stubble") d *= 1 - 0.4 * smooth(0.03, 0.06, ax) * smooth(mouthY, top, v.y);
  return d;
}

function beardGeometry(body: THREE.BufferGeometry, head: THREE.Vector3, A: Record<string, number[]>, kind: "stubble" | "trim" | "full", lift: number, alpha: number) {
  const pos = body.getAttribute("position");
  const nor = body.getAttribute("normal");
  const n = pos.count;
  const dens = new Float32Array(n);
  const v = new THREE.Vector3();
  const nv = new THREE.Vector3();
  const centre = new THREE.Vector3(0, A.mouth[1] + 0.02, 0);
  const out = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).sub(head);
    if (v.y > 0.06 || v.y < -0.16 || v.z < -0.03) continue;
    // only the outside of the face, not the inside of the mouth
    nv.fromBufferAttribute(nor, i);
    if (nv.dot(out.copy(v).sub(centre)) <= 0) continue;
    dens[i] = beardDensity(v, A, kind);
  }
  const ind = body.index!.array as ArrayLike<number>;
  const keep: number[] = [];
  for (let t = 0; t < ind.length; t += 3) if (dens[ind[t]] > 0.02 || dens[ind[t + 1]] > 0.02 || dens[ind[t + 2]] > 0.02) keep.push(ind[t], ind[t + 1], ind[t + 2]);
  const lifted = new Float32Array(n * 3);
  const col = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    nv.fromBufferAttribute(nor, i);
    v.fromBufferAttribute(pos, i).addScaledVector(nv, lift * Math.sqrt(dens[i]));
    lifted[i * 3] = v.x;
    lifted[i * 3 + 1] = v.y;
    lifted[i * 3 + 2] = v.z;
    col[i * 4] = col[i * 4 + 1] = col[i * 4 + 2] = 1;
    col[i * 4 + 3] = Math.min(1, dens[i] * alpha);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(lifted, 3));
  for (const k of ["normal", "uv", "skinIndex", "skinWeight"]) g.setAttribute(k, body.getAttribute(k));
  g.setAttribute("color", new THREE.BufferAttribute(col, 4));
  g.setIndex(keep);
  return g;
}

let strands: THREE.Texture | null = null;
/** short dark hairs, as an alpha map tiled over the face's skin UVs */
function beardStrands() {
  if (strands) return strands;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  g.lineCap = "round";
  for (let i = 0; i < 1400; i++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const a = Math.PI / 2 + (rnd() - 0.5) * 0.9;
    const l = 6 + rnd() * 9;
    const b = 150 + rnd() * 105;
    g.strokeStyle = `rgb(${b},${b},${b})`;
    g.lineWidth = 1.2 + rnd() * 1.2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  strands = new THREE.CanvasTexture(c);
  strands.wrapS = strands.wrapT = THREE.RepeatWrapping;
  strands.repeat.set(4, 4);
  return strands;
}

/** horizontal stripes across a garment, in the body's rest height (metres) */
function stripe(m: THREE.MeshPhysicalMaterial, color: number) {
  const c = new THREE.Color(color);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.stripeColor = { value: c };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vRestY;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvRestY = position.y;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vRestY;\nuniform vec3 stripeColor;")
      .replace("#include <map_fragment>", "#include <map_fragment>\nfloat stp = fract(vRestY * 24.0);\ndiffuseColor.rgb = mix(diffuseColor.rgb, stripeColor, smoothstep(0.6, 0.64, stp) * (1.0 - smoothstep(0.94, 0.98, stp)));");
  };
  m.customProgramCacheKey = () => "buzzlab-stripes";
}

// ---------------------------------------------------------------------------------------------
// accessories, built to each head's anchors
// ---------------------------------------------------------------------------------------------
/** where a cap sits (head-local): its band's centre height above the eyes, its centre's depth, its tilt back */
const CAP = { band: 0.022, z: -0.002, tilt: 0.1, depth: 0.116 };

/** a baseball cap: a six-panel crown over the skull and a curved brim, worn straight */
function addCap(p: Person, color: number) {
  const a = p.anchors;
  const ex = Math.abs(a.earL.x);
  const g = new THREE.Group();
  const cloth = new THREE.MeshPhysicalMaterial({ color, roughness: 0.85, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(color).multiplyScalar(0.7) });
  const band = a.eyeL.y + CAP.band;
  const rise = a.top.y - band + 0.012;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), cloth);
  crown.scale.set(ex + 0.009, rise, CAP.depth);
  crown.position.set(0, band, CAP.z);
  crown.rotation.x = -CAP.tilt;
  // seams and the button on top
  const seam = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8), roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 4, 48, Math.PI), seam);
    r.rotation.set(0, (i / 3) * Math.PI, 0);
    crown.add(r);
  }
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 12, 8), cloth);
  button.position.set(0, band + rise * Math.cos(CAP.tilt), CAP.z - rise * Math.sin(CAP.tilt));
  // the brim: a half ellipse, curved down at the sides
  const shape = new THREE.Shape();
  shape.moveTo(-0.082, 0);
  shape.absellipse(0, 0, 0.082, 0.078, Math.PI, 2 * Math.PI, false, 0);
  shape.lineTo(-0.082, 0);
  const brimGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 32 });
  brimGeo.rotateX(-Math.PI / 2);
  const bp = brimGeo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < bp.count; i++) bp.setY(i, bp.getY(i) - 3 * bp.getX(i) * bp.getX(i));
  brimGeo.computeVertexNormals();
  const brim = new THREE.Mesh(brimGeo, cloth);
  // on the front of the band (the crown is tipped back, so its front edge sits higher)
  brim.position.set(0, band + CAP.depth * Math.sin(CAP.tilt) - 0.003, CAP.z + CAP.depth * Math.cos(CAP.tilt) - 0.012);
  brim.rotation.x = 0.17;
  g.add(crown, button, brim);
  g.traverse((n) => ((n as THREE.Mesh).castShadow = true));
  p.j.head.add(g);
}

function addGlasses(p: Person, style: "round" | "rect") {
  const a = p.anchors;
  const g = new THREE.Group();
  const frame = new THREE.MeshPhysicalMaterial({ color: 0x141210, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.02, clearcoat: 1, depthWrite: false });
  const r = Math.abs(a.eyeL.x) * 0.78;
  // thick acetate rectangles: a rounded-rect rim with the lens cut out of it
  const rim = (w: number, h: number, t: number) => {
    const rr = (sh: THREE.Shape | THREE.Path, hw: number, hh: number, c: number) => {
      sh.moveTo(-hw + c, -hh);
      sh.lineTo(hw - c, -hh);
      sh.quadraticCurveTo(hw, -hh, hw, -hh + c);
      sh.lineTo(hw, hh - c);
      sh.quadraticCurveTo(hw, hh, hw - c, hh);
      sh.lineTo(-hw + c, hh);
      sh.quadraticCurveTo(-hw, hh, -hw, hh - c);
      sh.lineTo(-hw, -hh + c);
      sh.quadraticCurveTo(-hw, -hh, -hw + c, -hh);
      return sh;
    };
    const outer = rr(new THREE.Shape(), w / 2, h / 2, 0.006) as THREE.Shape;
    outer.holes.push(rr(new THREE.Path(), w / 2 - t, h / 2 - t, 0.004) as THREE.Path);
    const geo = new THREE.ExtrudeGeometry(outer, { depth: 0.004, bevelEnabled: false, curveSegments: 6 });
    geo.translate(0, 0, -0.002);
    return geo;
  };
  for (const s of [1, -1]) {
    const c = (s > 0 ? a.eyeL : a.eyeR).clone();
    c.z += 0.022;
    const ring = new THREE.Mesh(style === "rect" ? rim(r * 2.35, r * 1.55, 0.0042) : new THREE.TorusGeometry(r, 0.0021, 10, 48), frame);
    ring.position.copy(c);
    if (style === "rect") ring.position.x += s * 0.002;
    const lens = new THREE.Mesh(style === "rect" ? new THREE.PlaneGeometry(r * 2.3, r * 1.5) : new THREE.CircleGeometry(r, 40), lensMat);
    lens.position.copy(c).add(new THREE.Vector3(0, 0, 0.0005));
    const ear = (s > 0 ? a.earL : a.earR).clone();
    const from = new THREE.Vector3(c.x + s * (style === "rect" ? r * 1.2 : r), c.y + (style === "rect" ? r * 0.4 : 0), c.z - 0.002);
    const to = new THREE.Vector3(ear.x - s * 0.004, ear.y + 0.006, ear.z + 0.004);
    const temple = new THREE.Mesh(new THREE.CylinderGeometry(style === "rect" ? 0.0024 : 0.0015, style === "rect" ? 0.0024 : 0.0015, from.distanceTo(to), 6), frame);
    temple.position.copy(from).lerp(to, 0.5);
    temple.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    g.add(ring, lens, temple);
  }
  const bridge = style === "rect" ? new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.004, 0.004), frame) : new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0017, 8, 16, Math.PI), frame);
  bridge.position.set(0, a.eyeL.y + (style === "rect" ? 0.007 : 0.004), a.eyeL.z + 0.024);
  g.add(bridge);
  p.j.head.add(g);
}

function addHeadphones(p: Person) {
  const a = p.anchors;
  const g = new THREE.Group();
  const shell = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const pad = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.95 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.3, metalness: 0.9 });
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const ang = Math.PI * t;
    pts.push(new THREE.Vector3(Math.cos(ang) * (a.earL.x + 0.022), a.earL.y + 0.03 + Math.sin(ang) * (a.top.y - a.earL.y + 0.012), a.earL.z * 0.6));
  }
  const band = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.006, 8, false), shell);
  band.scale.z = 1;
  g.add(band);
  for (const s of [1, -1]) {
    const e = s > 0 ? a.earL : a.earR;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.042, 0.03, 40), shell);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(e.x + s * 0.028, e.y, e.z + 0.004);
    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.011, 12, 36), pad);
    cushion.rotation.y = Math.PI / 2;
    cushion.position.set(e.x + s * 0.011, e.y, e.z + 0.004);
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.05, 0.012), metal);
    yoke.position.set(e.x + s * 0.03, e.y + 0.045, e.z + 0.004);
    g.add(cup, cushion, yoke);
  }
  p.j.head.add(g);
}

// ---------------------------------------------------------------------------------------------
// poses
// ---------------------------------------------------------------------------------------------
export type Pose = Partial<Record<JointName, [number, number, number]>> & {
  hipY?: number;
  /** finger curl, 0 open … 1 fist */
  gripL?: number;
  gripR?: number;
  thumbL?: number;
  thumbR?: number;
};

export const POSES: Record<string, Pose> = {
  stand: {
    spine: [0.02, 0, 0],
    shoulderL: [0.06, 0, 0.04],
    shoulderR: [0.06, 0, -0.04],
    elbowL: [-0.18, 0, 0],
    elbowR: [-0.18, 0, 0],
    gripL: 0.3,
    gripR: 0.3,
    thumbL: 0.3,
    thumbR: 0.3,
  },
  sit: {
    hipY: 0.56,
    hipL: [-1.5, 0, 0.05],
    hipR: [-1.5, 0, -0.05],
    kneeL: [1.45, 0, 0],
    kneeR: [1.45, 0, 0],
    ankleL: [0.06, 0, 0],
    ankleR: [0.06, 0, 0],
    gripL: 0.3,
    gripR: 0.3,
    thumbL: 0.3,
    thumbR: 0.3,
  },
};

const va = new THREE.Vector3();

export function applyPose(p: Person, ...poses: Pose[]) {
  for (const k of POSABLE) p.j[k].rotation.set(0, 0, 0);
  p.j.jaw.rotation.set(0, 0, 0);
  p.j.hips.position.y = p.hipY;
  let gL = 0;
  let gR = 0;
  let tL = 0;
  let tR = 0;
  for (const pose of poses) {
    if (pose.hipY !== undefined) p.j.hips.position.y = pose.hipY;
    if (pose.gripL !== undefined) gL = pose.gripL;
    if (pose.gripR !== undefined) gR = pose.gripR;
    if (pose.thumbL !== undefined) tL = pose.thumbL;
    if (pose.thumbR !== undefined) tR = pose.thumbR;
    for (const [k, v] of Object.entries(pose)) {
      if (!Array.isArray(v)) continue;
      const n = p.j[k as JointName];
      if (!n) continue;
      n.rotation.x += v[0];
      n.rotation.y += v[1];
      n.rotation.z += v[2];
    }
  }
  // a bend of the back is shared by the lower spine and the chest, so it curves instead of hinging
  const s = p.j.spine.rotation;
  p.j.chest.rotation.set(p.j.chest.rotation.x + s.x * 0.5, p.j.chest.rotation.y + s.y * 0.5, p.j.chest.rotation.z + s.z * 0.5);
  s.set(s.x * 0.5, s.y * 0.5, s.z * 0.5);
  grip(p, "L", gL, tL);
  grip(p, "R", gR, tR);
}

/** Curl the fingers of one hand (0 open, 1 closed); the thumb separately. */
export function grip(p: Person, side: "L" | "R", amount: number, thumb = amount) {
  const curl = curls.get(p)!;
  const base = [1.15, 1.35, 0.95];
  for (let d = 1; d <= 5; d++)
    for (let k = 1; k <= 3; k++) {
      const name = `f${d}${k}${side}`;
      const b = p.fingers[name];
      const ax = curl[name];
      if (!b || !ax) continue;
      const a = d === 1 ? thumb * [0.25, 0.55, 0.6][k - 1] : amount * base[k - 1] * (1 + (d - 2) * 0.04);
      b.quaternion.setFromAxisAngle(va.set(ax[0], ax[1], ax[2]), a);
    }
}

/** Breathing and a little life, layered over whatever pose is set. Call after applyPose. */
export function breathe(p: Person, t: number, seed = 0, amount = 1) {
  const b = Math.sin(t * 1.25 + seed) * amount;
  p.j.chest.rotation.x += b * 0.008;
  p.j.chest.scale.set(1 + b * 0.006, 1 + b * 0.004, 1 + b * 0.01);
  p.j.head.rotation.y += Math.sin(t * 0.37 + seed * 2) * 0.03 * amount;
  p.j.head.rotation.x += Math.sin(t * 0.29 + seed) * 0.015 * amount;
}

/** Blink every few seconds. */
export function blink(p: Person, t: number, seed = 0) {
  const c = (t + seed * 1.7) % 4.6;
  const k = c < 0.14 ? Math.sin((c / 0.14) * Math.PI) : 0;
  for (const l of p.face.lids) l.rotation.x = k * 0.42;
}

/** Point the eyes (radians). */
export function look(p: Person, yaw: number, pitch: number) {
  for (const e of p.face.eyes) e.rotation.set(pitch, yaw, 0);
}

/** Open the jaw, 0 … 1. */
export function openMouth(p: Person, amount: number) {
  p.j.jaw.rotation.x = amount * 0.42;
}

// ---------------------------------------------------------------------------------------------
// reaching: put a hand on something
// ---------------------------------------------------------------------------------------------
const _S = new THREE.Vector3();
const _E = new THREE.Vector3();
const _T = new THREE.Vector3();
const _W = new THREE.Vector3();
const _d = new THREE.Vector3();
const _pp = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();

/**
 * Two-bone arm IK: the wrist goes to `target` (world), the elbow bends toward `pole` (a world
 * direction, e.g. out and down). Call after applyPose; the person's matrices are updated here.
 */
export function reach(p: Person, side: "L" | "R", target: THREE.Vector3, pole: THREE.Vector3) {
  const sh = p.j[`shoulder${side}` as JointName];
  const el = p.j[`elbow${side}` as JointName];
  const wr = p.j[`wrist${side}` as JointName];
  p.root.updateMatrixWorld(true);
  sh.getWorldPosition(_S);
  el.getWorldPosition(_E);
  wr.getWorldPosition(_W);
  const L1 = _S.distanceTo(_E);
  const L2 = _E.distanceTo(_W);
  _d.copy(target).sub(_S);
  const dist = THREE.MathUtils.clamp(_d.length(), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
  _d.normalize();
  _pp.copy(pole).addScaledVector(_d, -pole.dot(_d)).normalize();
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  _E.copy(_S).addScaledVector(_d, a).addScaledVector(_pp, h);
  _T.copy(_S).addScaledVector(_d, dist);
  // shoulder: rest upper-arm direction (the elbow's offset) onto S→E, in the chest's frame
  sh.parent!.getWorldQuaternion(_q).invert();
  sh.quaternion.setFromUnitVectors(_x.copy(el.position).normalize(), _y.copy(_E).sub(_S).normalize().applyQuaternion(_q));
  sh.updateMatrixWorld(true);
  sh.getWorldQuaternion(_q).invert();
  el.quaternion.setFromUnitVectors(_x.copy(wr.position).normalize(), _y.copy(_T).sub(_E).normalize().applyQuaternion(_q));
  el.updateMatrixWorld(true);
}

/**
 * Turn a hand so its fingers point along `fingers` and its palm faces `palm` (world directions).
 * In the rest pose the fingers hang down and each palm faces the thigh.
 */
export function orientHand(p: Person, side: "L" | "R", fingers: THREE.Vector3, palm: THREE.Vector3) {
  const wr = p.j[`wrist${side}` as JointName];
  // rest basis (neutral, world-aligned): fingers down, palm inward
  _x.set(0, -1, 0);
  _y.set(side === "L" ? -1 : 1, 0, 0);
  _z.crossVectors(_x, _y);
  _m.makeBasis(_x, _y, _z);
  // target basis
  _x.copy(fingers).normalize();
  _y.copy(palm).addScaledVector(_x, -palm.dot(_x)).normalize();
  _z.crossVectors(_x, _y);
  _m2.makeBasis(_x, _y, _z);
  _m2.multiply(_m.transpose());
  const world = new THREE.Quaternion().setFromRotationMatrix(_m2);
  wr.parent!.getWorldQuaternion(_q).invert();
  wr.quaternion.copy(_q.multiply(world));
  wr.updateMatrixWorld(true);
}

/** World position of a head-local anchor. */
export function anchorWorld(p: Person, key: string, out = new THREE.Vector3()) {
  return p.j.head.localToWorld(out.copy(p.anchors[key]));
}

