import { useState, useCallback } from "react";
import { AuthProps, Character, Connection, ConnectionType } from "../lib/types";
import { useAppState } from "../lib/useAppState";
import { useIsMobile } from "../lib/useIsMobile";
import { AuthUser, AuthState } from "../lib/useAuth";
import ForceGraph from "./ForceGraph";
import CharacterPanel from "./CharacterPanel";
import AddCharacterModal from "./AddCharacterModal";
import AddConnectionModal from "./AddConnectionModal";
import ProjectSettingsModal from "./ProjectSettingsModal";
import ProjectsSidebar from "./ProjectsSidebar";
import SiteSettingsModal from "./SiteSettingsModal";
import Legend from "./Legend";
import { UserPlus, Link, SlidersHorizontal, Cog, Plus, ChevronDown } from "lucide-react";
import GraphNavigation from "./GraphNavigation";
import ToolBtn from "./ToolBtn";
import UserMenu from "./UserMenu";
import IconBtn from "./IconBtn";


export default function GraphApp({ user, authStatus, onSignIn, onSignOut }: AuthProps) {
  const {
    state, loaded,
    activeData, saveActiveData, resetActiveProject,
    activeProject, createProject, renameProject, deleteProject, switchProject, setTheme, setLabelBg, importChrl,
  } = useAppState();

  const isMobile = useIsMobile();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightTypeId, setHighlightTypeId] = useState<string | null>(null);
  const [showAddChar, setShowAddChar] = useState(false);
  const [showAddConn, setShowAddConn] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showProjSettings, setShowProjSettings] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const selectedCharacter = activeData.characters.find((c) => c.id === selectedId) ?? null;
  const theme = state.theme ?? "dark";
  const useLabelBg = state.useLabelBg ?? true;

  const handleUpdatePositions = useCallback(() => { }, []);

  const handleSelectCharacter = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      setHighlightTypeId(null);
      setShowAddMenu(false);
    }
  }, []);

  const handleLegendHighlight = useCallback((typeId: string | null) => {
    setHighlightTypeId(typeId);
    if (typeId) setSelectedId(null);
  }, []);

  const handleAddCharacter = (char: Character) => {
    saveActiveData({ ...activeData, characters: [...activeData.characters, char] });
    setShowAddChar(false);
    setSelectedId(char.id);
    setHighlightTypeId(null);
  };

  const handleAddConnection = (conn: Connection) =>
    saveActiveData({ ...activeData, connections: [...activeData.connections, conn] });

  const handleUpdateCharacter = (updated: Character) =>
    saveActiveData({
      ...activeData,
      characters: activeData.characters.map((c) => (c.id === updated.id ? updated : c)),
    });

  const handleDeleteCharacter = (id: string) => {
    saveActiveData({
      ...activeData,
      characters: activeData.characters.filter((c) => c.id !== id),
      connections: activeData.connections.filter((c) => c.source !== id && c.target !== id),
    });
    setSelectedId(null);
  };

  const handleDeleteConnection = (connId: string) =>
    saveActiveData({
      ...activeData,
      connections: activeData.connections.filter((c) => c.id !== connId),
    });

  const handleSaveConnectionTypes = (types: ConnectionType[]) =>
    saveActiveData({ ...activeData, connectionTypes: types });

  if (!loaded) {
    return (
      <div
        style={{
          display: "flex",
          width: "100vw",
          height: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-base)",
        }}
      >
        <p className="font-display text-2xl" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      </div>
    );
  }

  const topBarH = 56;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100dvh",
        minHeight: "100dvh",
        overflow: "hidden",
        background: "var(--bg-base)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "var(--radial-bg)",
        }}
      />

      {/* ── TOP BAR ────────────────────────────────────── */}
      <div
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
              setShowProjects(!showProjects);
              setSelectedId(null);
              setShowAddMenu(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
              background: showProjects ? "var(--gold-dim)" : "var(--bg-surface)",
              border: `1px solid ${showProjects ? "var(--gold-border)" : "var(--border-subtle)"}`,
              color: showProjects ? "var(--gold)" : "var(--text-muted)",
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
              {activeProject?.name ?? "My Story"}
            </span>
            <ChevronDown size={12} style={{ flexShrink: 0 }} />
          </button>

          {!isMobile && (
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {activeData.characters.length} chars · {activeData.connections.length} connections
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
          {!isMobile && (
            <>
              <ToolBtn onClick={() => setShowAddChar(true)} gold>
                <UserPlus size={14} /> Character
              </ToolBtn>
              <ToolBtn onClick={() => setShowAddConn(true)}>
                <Link size={14} /> Connection
              </ToolBtn>
              <IconBtn onClick={() => setShowProjSettings(true)} title="Story settings">
                <SlidersHorizontal size={15} />
              </IconBtn>
              <IconBtn onClick={() => setShowSiteSettings(true)} title="Site settings">
                <Cog size={18} />
              </IconBtn>
              {/* User avatar + sign out */}
              <UserMenu user={user} authStatus={authStatus} onSignIn={onSignIn} onSignOut={onSignOut} />
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
                        onClick={() => {
                          setShowAddConn(true);
                          setShowAddMenu(false);
                        }}
                        style={dropdownItemStyle(false)}
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

              <UserMenu isMobile user={user} authStatus={authStatus} onSignIn={onSignIn} onSignOut={onSignOut} />
            </>
          )}
        </div>
      </div>

      <ForceGraph
        data={activeData}
        selectedId={selectedId}
        highlightTypeId={highlightTypeId}
        theme={theme}
        useLabelBg={useLabelBg}
        onSelectCharacter={handleSelectCharacter}
        onUpdatePositions={handleUpdatePositions}
      />

      {isMobile ? (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: `calc(24px + env(safe-area-inset-bottom, 0px))`,
            zIndex: 16,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Legend
            types={activeData.connectionTypes}
            highlightTypeId={highlightTypeId}
            onHighlight={handleLegendHighlight}
            compact={isMobile}
          />

          <GraphNavigation
            compact={isMobile}
            onPanLeft={() => (document.querySelector(".graph-svg") as any)?.__panBy?.(120, 0)}
            onPanRight={() => (document.querySelector(".graph-svg") as any)?.__panBy?.(-120, 0)}
            onPanUp={() => (document.querySelector(".graph-svg") as any)?.__panBy?.(0, 120)}
            onPanDown={() => (document.querySelector(".graph-svg") as any)?.__panBy?.(0, -120)}
            onZoomIn={() => (document.querySelector(".graph-svg") as any)?.__zoomBy?.(1.2)}
            onZoomOut={() => (document.querySelector(".graph-svg") as any)?.__zoomBy?.(1 / 1.2)}
            onReset={() => (document.querySelector(".graph-svg") as any)?.__fitGraphToScreen?.()}
          />
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", bottom: 24, left: 16, zIndex: 15 }}>
            <Legend
              types={activeData.connectionTypes}
              highlightTypeId={highlightTypeId}
              onHighlight={handleLegendHighlight}
              compact={isMobile}
            />
          </div>

          <div style={{ position: "absolute", right: 16, bottom: 24, zIndex: 16 }}>
            <GraphNavigation
              compact={isMobile}
              onPanLeft={() => (document.querySelector(".graph-svg") as any)?.__panBy?.(120, 0)}
              onPanRight={() => (document.querySelector(".graph-svg") as any)?.__panBy?.(-120, 0)}
              onPanUp={() => (document.querySelector(".graph-svg") as any)?.__panBy?.(0, 120)}
              onPanDown={() => (document.querySelector(".graph-svg") as any)?.__panBy?.(0, -120)}
              onZoomIn={() => (document.querySelector(".graph-svg") as any)?.__zoomBy?.(1.2)}
              onZoomOut={() => (document.querySelector(".graph-svg") as any)?.__zoomBy?.(1 / 1.2)}
              onReset={() => (document.querySelector(".graph-svg") as any)?.__fitGraphToScreen?.()}
            />
          </div>
        </>
      )}

      <div
        style={{
          position: "absolute",
          bottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
          zIndex: 5,
          margin: "auto",
          width: "100%",
          textAlign: "center",
          pointerEvents: "none",
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: "var(--text-muted-dim)",
        }}
      >
        <p>TheWizard studio ©{new Date().getFullYear()}</p>
      </div>

      {showProjects && (
        <ProjectsSidebar
          projects={state.projects}
          activeId={state.activeProjectId}
          onSwitch={(id) => {
            switchProject(id);
            setSelectedId(null);
            setHighlightTypeId(null);
          }}
          onCreate={createProject}
          onRename={renameProject}
          onDelete={deleteProject}
          onClose={() => setShowProjects(false)}
        />
      )}

      {selectedCharacter && !showProjects && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            width: isMobile ? "100%" : undefined,
          }}
        >
          <CharacterPanel
            key={selectedCharacter.id}
            character={selectedCharacter}
            connections={activeData.connections}
            allCharacters={activeData.characters}
            connectionTypes={activeData.connectionTypes}
            onClose={() => setSelectedId(null)}
            onUpdate={handleUpdateCharacter}
            onDelete={handleDeleteCharacter}
            onDeleteConnection={handleDeleteConnection}
          />
        </div>
      )}

      {showAddChar && (
        <AddCharacterModal onAdd={handleAddCharacter} onClose={() => setShowAddChar(false)} />
      )}

      {showAddConn && (
        <AddConnectionModal
          characters={activeData.characters}
          connectionTypes={activeData.connectionTypes}
          onAdd={handleAddConnection}
          onClose={() => setShowAddConn(false)}
        />
      )}

      {showProjSettings && activeProject && (
        <ProjectSettingsModal
          project={activeProject}
          canDelete={state.projects.length > 1}
          connectionTypes={activeData.connectionTypes}
          characterCount={activeData.characters.length}
          connectionCount={activeData.connections.length}
          projectData={activeData}
          onRename={(name) => renameProject(activeProject.id, name)}
          onReset={() => {
            resetActiveProject();
            setSelectedId(null);
            setHighlightTypeId(null);
          }}
          onDelete={() => deleteProject(activeProject.id)}
          onSaveConnectionTypes={handleSaveConnectionTypes}
          onClose={() => setShowProjSettings(false)}
        />
      )}

      {showSiteSettings && (
        <SiteSettingsModal
          theme={theme}
          labelBg={useLabelBg}
          onSetTheme={setTheme}
          onSetLabelBg={setLabelBg}
          onImport={importChrl}
          onClose={() => setShowSiteSettings(false)}
        />
      )}
    </div>
  );
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