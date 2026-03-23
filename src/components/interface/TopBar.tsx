import { ChevronDown } from "lucide-react";
import Menu from "./Menu";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useAuth } from "../../hooks/useAuth";

const topBarH = 56;

interface Props {
  showProjectsList: boolean,
  activeProjectName: string,
  charNum: number,
  connNum: number,
  showAddMenu: boolean,
  setShowAddMenu: React.Dispatch<React.SetStateAction<boolean>>
  setShowAddChar: React.Dispatch<React.SetStateAction<boolean>>
  setShowAddConn: React.Dispatch<React.SetStateAction<boolean>>
  setShowProjSettings: React.Dispatch<React.SetStateAction<boolean>>
  setShowSiteSettings: React.Dispatch<React.SetStateAction<boolean>>
  setShowProjects: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedId: React.Dispatch<React.SetStateAction<string>>
}

export default function TopBar({
  showProjectsList, activeProjectName,
  charNum, connNum,
  showAddMenu,
  setShowAddMenu,
  setShowAddChar,
  setShowAddConn,
  setShowProjSettings,
  setShowSiteSettings,
  setShowProjects,
  setSelectedId
}: Props) {
  const isMobile = useIsMobile();
  const { status } = useAuth();

  return <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      height: `calc(${topBarH}px + env(safe-area-inset-top, 0px))`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: "env(safe-area-inset-top, 0px)",
      paddingLeft: "16px",
      paddingRight: "16px",
      background: "var(--topbar-gradient)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src="/logo.svg"
        alt="Logo"
        style={{
          width: 30,
          height: 30,
          flexShrink: 0,
        }}
        className="logo-theme"
      />
      {!isMobile && (
        <span className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Character Loom
        </span>
      )}

      <button
        onClick={() => {
          setShowProjects(!showProjectsList);
          setSelectedId(null);
          setShowAddMenu(false);
        }}
        disabled={status === "signed-out"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 10px",
          borderRadius: 6,
          cursor: status === "signed-out" ? "" : "pointer",
          background: showProjectsList ? "var(--gold-dim)" : "var(--bg-surface)",
          border: `1px solid ${showProjectsList ? "var(--gold-border)" : "var(--border-subtle)"}`,
          color: showProjectsList ? "var(--gold)" : "var(--text-muted)",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          maxWidth: isMobile ? 130 : 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: isMobile ? 90 : 170,
          }}
        >
          {activeProjectName ?? "My Story"}
        </span>
        {status !== "signed-out" && <ChevronDown size={12} style={{ flexShrink: 0 }} />}
      </button>

      {!isMobile && (
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {charNum} chars · {connNum} connections
        </span>
      )}
    </div>

    <Menu
      setShowAddChar={setShowAddChar}
      setShowAddConn={setShowAddConn}
      setShowAddMenu={setShowAddMenu}
      setShowProjSettings={setShowProjSettings}
      setShowSiteSettings={setShowSiteSettings}
      showAddMenu={showAddMenu}
      disableAddConnection={charNum < 2}
    />
  </div>
}