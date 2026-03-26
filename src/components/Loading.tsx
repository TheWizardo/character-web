export default function Loading() {
  const isPhone = typeof window !== "undefined" && window.innerWidth <= 640;

  const padY = isPhone ? "56px" : "clamp(24px, 4vw, 48px)";
  const padX = isPhone ? "28px" : "clamp(20px, 5vw, 44px)";
  const logoSize = isPhone ? "132px" : "clamp(72px, 12vw, 160px)";
  const ringInset = `calc(${isPhone ? "-12px" : "clamp(-8px, -1vw, -14px)"} - 0.5ch)`;
  const titleSize = isPhone ? "2.2rem" : "clamp(1.5rem, 2vw, 2.5rem)";
  const subtitleSize = isPhone ? "1.05rem" : "clamp(0.8rem, 1vw, 1rem)";
  const cardRadius = "clamp(16px, 2vw, 24px)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        overflow: "hidden",
        padding: "clamp(16px, 3vw, 32px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, color-mix(in srgb, var(--gold) 10%, transparent) 0%, transparent 55%)",
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isPhone ? 28 : "clamp(14px, 2vw, 22px)",
          padding: `${padY} ${padX}`,
          borderRadius: cardRadius,
          background: "color-mix(in srgb, var(--bg-deep) 86%, transparent)",
          border: "1px solid var(--border-subtle)",
          backdropFilter: "blur(10px)",
          width: isPhone ? "min(82vw, 340px)" : "clamp(280px, 78vw, 560px)",
          minHeight: isPhone ? "500px" : undefined,
          justifyContent: isPhone ? "center" : undefined,
        }}
      >
        <div
          style={{
            position: "relative",
            width: logoSize,
            height: logoSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: ringInset,
              right: ringInset,
              bottom: ringInset,
              left: ringInset,
              borderRadius: "50%",
              border: "2px solid color-mix(in srgb, var(--gold) 22%, transparent)",
              borderTopColor: "var(--gold)",
              animation: "cl-spin 1.35s ease-in-out infinite",
            }}
          />
          <img
            src="/logo.svg"
            alt="Character Loom"
            className="logo-theme"
            style={{
              width: logoSize,
              height: logoSize,
              display: "block",
              objectFit: "contain",
            }}
          />
        </div>

        <div style={{ textAlign: "center", maxWidth: "100%" }}>
          <p
            className="font-display"
            style={{
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "0.02em",
              fontSize: titleSize,
              lineHeight: 1.15,
            }}
          >
            Character Loom
          </p>
          <p
            className="font-mono"
            style={{
              color: "var(--text-muted)",
              margin: isPhone ? "12px 0 0 0" : "clamp(6px, 1vw, 10px) 0 0 0",
              fontSize: subtitleSize,
              lineHeight: 1.4,
            }}
          >
            Loading your story…
          </p>
        </div>
      </div>
    </div>
  );
}