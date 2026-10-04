/**
 * Extra film keyframes registered by pinned sections (scroll y → film time),
 * so moments inside a pin (e.g. the IP reveal) hit the right frame of the film.
 */
type Key = { y: number; t: number };
const providers = new Map<string, () => Key[]>();

export const filmKeys = {
  register(id: string, fn: () => Key[]) {
    providers.set(id, fn);
    return () => providers.delete(id);
  },
  all(): Key[] {
    const out: Key[] = [];
    providers.forEach((fn) => out.push(...fn()));
    return out;
  },
};
