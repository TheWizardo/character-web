import { UserPlus, Link, SlidersHorizontal, Cog, Plus } from "lucide-react";
import IconBtn from "./IconBtn";
import ToolBtn from "./ToolBtn";
import UserMenu from "./UserMenu";
import { useIsMobile } from "../../hooks/useIsMobile";

export interface MenuProps {
  showAddMenu: boolean,
  setShowAddMenu: (b: boolean) => void,
  setShowAddChar: (b: boolean) => void,
  setShowAddConn: (b: boolean) => void,
  setShowProjSettings: (b: boolean) => void,
  setShowSiteSettings: (b: boolean) => void,
  disableAddConnection: boolean
}

export default function Menu({
  showAddMenu,
  setShowAddMenu,
  setShowAddChar,
  setShowAddConn,
  setShowProjSettings,
  setShowSiteSettings,
  disableAddConnection
}: MenuProps) {

  const isMobile = useIsMobile();
  return <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
    {!isMobile && (
      <>
        <ToolBtn onClick={() => setShowAddChar(true)} gold>
          <UserPlus size={14} /> Character
        </ToolBtn>
        <ToolBtn disabled={disableAddConnection} gold={!disableAddConnection} onClick={() => setShowAddConn(true)}>
          <Link size={14} /> Connection
        </ToolBtn>
        <IconBtn onClick={() => setShowProjSettings(true)} title="Story settings">
          <SlidersHorizontal size={15} />
        </IconBtn>
        <IconBtn onClick={() => setShowSiteSettings(true)} title="Site settings">
          <Cog size={18} />
        </IconBtn>
      </>
    )}

    {isMobile && (
      <>
        <div style={{ position: "relative" }}>
          <IconBtn
            onClick={() => setShowAddMenu(!showAddMenu)}
            title="Add"
            active={showAddMenu}
          >
            <Plus size={18} />
          </IconBtn>

          {showAddMenu && (
            <>
              <div
                onClick={() => setShowAddMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 38 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  zIndex: 39,
                  background: "var(--panel-gradient)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: 10,
                  overflow: "hidden",
                  minWidth: 170,
                  boxShadow: "0 8px 32px var(--shadow-lg)",
                }}
              >
                <button
                  onClick={() => {
                    setShowAddChar(true);
                    setShowAddMenu(false);
                  }}
                  style={dropdownItemStyle(true)}
                >
                  <UserPlus size={14} /> Add Character
                </button>
                <button
                  disabled={disableAddConnection}
                  onClick={() => {
                    setShowAddConn(true);
                    setShowAddMenu(false);
                  }}
                  style={dropdownItemStyle(!disableAddConnection)}
                >
                  <Link size={14} /> Add Connection
                </button>
              </div>
            </>
          )}
        </div>

        <IconBtn onClick={() => setShowProjSettings(true)} title="Story settings">
          <SlidersHorizontal size={18} />
        </IconBtn>

        <IconBtn onClick={() => setShowSiteSettings(true)} title="Site settings">
          <Cog size={20} />
        </IconBtn>

      </>
    )}
    {/* User avatar + sign out */}
    <UserMenu />
  </div>
}

const dropdownItemStyle = (gold: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "12px 16px",
  textAlign: "left",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: "'DM Mono', monospace",
  fontSize: 13,
  color: gold ? "var(--gold)" : "var(--text-secondary)",
  borderBottom: gold ? "1px solid var(--border-subtle)" : "none",
});