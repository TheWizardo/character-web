import { useState } from "react";
import { LogIn, LogOut } from 'lucide-react';
import IconBtn from "./IconBtn";
import { useAuth } from "../../hooks/useAuth";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useNotifications } from "../../hooks/useNotifications";


export default function UserMenu() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, signIn, logOut } = useAuth();
  const notify = useNotifications();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const creds = await signIn();
      if (creds === null) {
        notify.error("Login failed");
      }
    }
    finally {
      setLoading(false);
    }
  }

  const handleLogout = () => { 
    setOpen(false); 
    logOut(); 
    notify.dismissAll();
  }


  if (!user) {
    if (isMobile) {
      return (
        <IconBtn
          onClick={handleLogin}
          title="Sign in with Google"
        >
          <LogIn size={18} style={{ opacity: loading ? 0.5 : 1 }} />
        </IconBtn>
      );
    }
    return (
      <button
        onClick={handleLogin}
        disabled={loading}
        title="Sign in with Google"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8, cursor: loading ? "wait" : "pointer",
          background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
          color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", fontSize: 12,
          opacity: loading ? 0.6 : 1, transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-medium)"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        <LogIn size={14} />
        {loading ? "Signing in…" : "Sign in"}
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        title={user.displayName ?? user.email ?? "Account"}
        style={{
          width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
          border: "2px solid var(--border-medium)", overflow: "hidden",
          padding: 0, background: "var(--bg-surface)", transition: "border-color 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
      >
        {user.photoURL
          ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
          : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text-muted)" }}>
            {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
          </span>
        }
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 38 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 39,
            minWidth: 200, borderRadius: 10,
            background: "var(--panel-gradient)",
            border: "1px solid var(--border-medium)",
            boxShadow: "0 8px 32px var(--shadow-lg)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 15, color: "var(--text-primary)", fontWeight: 600, marginBottom: 2 }}>
                {user.displayName ?? "User"}
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text-muted)" }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px", cursor: "pointer", background: "transparent", border: "none",
                fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--text-muted)", textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

