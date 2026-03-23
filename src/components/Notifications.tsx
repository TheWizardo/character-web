import { CheckCircle, XCircle, CloudOff, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Notification } from "../lib/types";
import { CRIT_COLOR } from "../lib/constants";
import { useNotifications } from "../hooks/useNotifications";

export default function Notifications() {
  const { notifications, dismiss } = useNotifications();
  return (
    <AnimatePresence>
      {notifications.length > 0 && (
        <motion.div
          key="notifications-root"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 360,
            width: "calc(100vw - 48px)",
            pointerEvents: "none",
          }}
        >
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <Toast key={n.id} n={n} dismiss={dismiss} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── individual toast ──────────────────────────────────────

function Toast({ n, dismiss }: { n: Notification; dismiss: (id: number) => void }) {
  const isConfirmation = n.kind === "confirmation";

  const colors = {
    success: { accent: "#27ae60", bg: "rgba(39,174,96,0.10)", border: "rgba(39,174,96,0.30)" },
    error: { accent: "#c0392b", bg: "rgba(192,57,43,0.10)", border: "rgba(192,57,43,0.30)" },
    confirmation: { accent: "#d4a843", bg: "rgba(212,168,67,0.10)", border: "rgba(212,168,67,0.30)" },
  }[n.kind];

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    confirmation: CloudOff,
  }[n.kind];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.16 } }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 30,
        mass: 0.8,
      }}
      whileHover={{ y: -1 }}
      style={{
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 10,
        background: `color-mix(in srgb, var(--bg-deep) 92%, transparent)`,
        backdropFilter: "blur(12px)",
        border: `1px solid ${colors.border}`,
        boxShadow: `0 4px 24px var(--shadow-lg), inset 0 0 0 1px ${colors.bg}`,
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.22, ease: "easeOut", delay: 0.05 }}
        style={{
          position: "absolute",
          inset: 0,
          height: 2,
          transformOrigin: "left",
          background: colors.accent,
          opacity: 0.8,
        }}
      />

      {/* Main row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <motion.div
          initial={{ rotate: -12, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.03 }}
        >
          <Icon
            size={16}
            style={{ color: colors.accent, flexShrink: 0, marginTop: 1 }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.04 }}
          style={{
            flex: 1,
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            lineHeight: 1.55,
            color: "var(--text-secondary)",
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {n.message}
        </motion.p>

        {!isConfirmation && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => dismiss(n.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 0,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={13} />
          </motion.button>
        )}
      </div>

      {/* Confirmation buttons */}
      {isConfirmation && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.08 }}
          style={{ display: "flex", gap: 8, paddingLeft: 26 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={n.onConfirm}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              color: n.danger === "confirm" ? CRIT_COLOR : colors.accent,
            }}
          >
            {n.confirmText || "Yes"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={n.onDismiss}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: n.danger === "dismiss" ? CRIT_COLOR : "var(--text-muted)",
            }}
          >
            {n.dismissText || "No"}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}