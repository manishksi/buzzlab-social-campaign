/** Grain + vignette + a warm wash that follows the global --heat value. */
export function Atmosphere() {
  return (
    <>
      <div className="vignette" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 110%, rgba(239,106,42,calc(var(--heat) * 0.16)), transparent 70%)",
        }}
      />
      <div className="grain" aria-hidden />
    </>
  );
}
