import { useState, useCallback, useEffect } from "react";
import { Character, Connection, ConnectionType } from "../lib/types";
import { useAppState } from "../lib/useAppState";
import ForceGraph from "./ForceGraph";
import CharacterPanel from "./CharacterPanel";
import AddCharacterModal from "./AddCharacterModal";
import AddConnectionModal from "./AddConnectionModal";
import ProjectSettingsModal from "./ProjectSettingsModal";
import ProjectsSidebar from "./ProjectsSidebar";
import SiteSettingsModal from "./SiteSettingsModal";
import Legend from "./Legend";
import { UserPlus, Link, BookOpen, SlidersHorizontal, Palette, Plus, ChevronDown } from "lucide-react";

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

export default function GraphApp() {
  const {
    state, loaded,
    activeData, saveActiveData, resetActiveProject,
    activeProject, createProject, renameProject, deleteProject, switchProject, setTheme, importChrw,
  } = useAppState();

  const isMobile = useIsMobile();

  const [selectedId, setSelectedId]            = useState<string | null>(null);
  const [highlightTypeId, setHighlightTypeId]  = useState<string | null>(null);
  const [showAddChar, setShowAddChar]           = useState(false);
  const [showAddConn, setShowAddConn]           = useState(false);
  const [showProjects, setShowProjects]         = useState(false);
  const [showProjSettings, setShowProjSettings] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  // Mobile: small "Add" dropdown
  const [showAddMenu, setShowAddMenu]           = useState(false);

  const selectedCharacter = activeData.characters.find((c) => c.id === selectedId) ?? null;
  const theme = state.theme ?? "dark";

  const handleUpdatePositions = useCallback(() => {}, []);

  const handleSelectCharacter = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) { setHighlightTypeId(null); setShowAddMenu(false); }
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
    saveActiveData({ ...activeData, characters: activeData.characters.map((c) => c.id === updated.id ? updated : c) });

  const handleDeleteCharacter = (id: string) => {
    saveActiveData({
      ...activeData,
      characters: activeData.characters.filter((c) => c.id !== id),
      connections: activeData.connections.filter((c) => c.source !== id && c.target !== id),
    });
    setSelectedId(null);
  };

  const handleDeleteConnection = (connId: string) =>
    saveActiveData({ ...activeData, connections: activeData.connections.filter((c) => c.id !== connId) });

  const handleSaveConnectionTypes = (types: ConnectionType[]) =>
    saveActiveData({ ...activeData, connectionTypes: types });

  if (!loaded) {
    return (
      <div style={{ display: "flex", width: "100vw", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <p className="font-display text-2xl" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  // ── Shared top-bar height so graph can account for it ──
  const topBarH = 56;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "var(--radial-bg)" }} />

      {/* ── TOP BAR ────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
        height: topBarH,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
        background: "var(--topbar-gradient)",
      }}>

        {/* LEFT: logo + project name (clickable → stories) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={isMobile ? 16 : 18} style={{ color: "var(--gold)", flexShrink: 0 }} />

          {/* Desktop: "Character Web" static label */}
          {!isMobile && (
            <span className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Character Web
            </span>
          )}

          {/* Project name → opens Stories */}
          <button
            onClick={() => { setShowProjects(!showProjects); setSelectedId(null); setShowAddMenu(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 6, cursor: "pointer",
              background: showProjects ? "var(--gold-dim)" : "var(--bg-surface)",
              border: `1px solid ${showProjects ? "var(--gold-border)" : "var(--border-subtle)"}`,
              color: showProjects ? "var(--gold)" : "var(--text-muted)",
              fontFamily: "'DM Mono', monospace", fontSize: isMobile ? 12 : 12,
              maxWidth: isMobile ? 130 : 220,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 90 : 170 }}>
              {activeProject?.name ?? "My Story"}
            </span>
            <ChevronDown size={12} style={{ flexShrink: 0 }} />
          </button>

          {/* Desktop only: stats */}
          {!isMobile && (
            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {activeData.characters.length} chars · {activeData.connections.length} connections
            </span>
          )}
        </div>

        {/* RIGHT: action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>

          {/* ── DESKTOP ──────────────────────────────── */}
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
              <IconBtn onClick={() => setShowSiteSettings(true)} title="Appearance">
                <Palette size={15} />
              </IconBtn>
            </>
          )}

          {/* ── MOBILE: 3 icon buttons ───────────────── */}
          {isMobile && (
            <>
              {/* Add menu (character / connection) */}
              <div style={{ position: "relative" }}>
                <IconBtn
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  title="Add"
                  active={showAddMenu}>
                  <Plus size={18} />
                </IconBtn>
                {showAddMenu && (
                  <>
                    <div onClick={() => setShowAddMenu(false)}
                      style={{ position: "fixed", inset: 0, zIndex: 38 }} />
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 39,
                      background: "var(--panel-gradient)",
                      border: "1px solid var(--border-medium)",
                      borderRadius: 10, overflow: "hidden", minWidth: 170,
                      boxShadow: "0 8px 32px var(--shadow-lg)",
                    }}>
                      <button onClick={() => { setShowAddChar(true); setShowAddMenu(false); }}
                        style={dropdownItemStyle(true)}>
                        <UserPlus size={14} /> Add Character
                      </button>
                      <button onClick={() => { setShowAddConn(true); setShowAddMenu(false); }}
                        style={dropdownItemStyle(false)}>
                        <Link size={14} /> Add Connection
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Story settings */}
              <IconBtn onClick={() => setShowProjSettings(true)} title="Story settings">
                <SlidersHorizontal size={18} />
              </IconBtn>

              {/* Appearance */}
              <IconBtn onClick={() => setShowSiteSettings(true)} title="Appearance">
                <Palette size={18} />
              </IconBtn>
            </>
          )}
        </div>
      </div>

      {/* ── GRAPH (fills full screen, behind UI layers) ── */}
      <ForceGraph
        data={activeData}
        selectedId={selectedId}
        highlightTypeId={highlightTypeId}
        theme={theme}
        onSelectCharacter={handleSelectCharacter}
        onUpdatePositions={handleUpdatePositions}
      />

      {/* ── LEGEND — always visible, z-index above SVG ─── */}
      <div style={{ position: "absolute", bottom: 24, left: 16, zIndex: 15 }}>
        <Legend
          types={activeData.connectionTypes}
          highlightTypeId={highlightTypeId}
          onHighlight={handleLegendHighlight}
          compact={isMobile}
        />
      </div>

      {/* Desktop hint */}
      {!isMobile && (
        <div style={{
          position: "absolute", bottom: 24, right: 24, zIndex: 5,
          textAlign: "right", pointerEvents: "none",
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: "var(--text-muted-dim)",
        }}>
          <p>Scroll to zoom · Drag to pan</p>
          <p>Click node · Click legend to filter</p>
        </div>
      )}

      {/* ── STORIES SIDEBAR ────────────────────────────── */}
      {showProjects && (
        <ProjectsSidebar
          projects={state.projects}
          activeId={state.activeProjectId}
          onSwitch={(id) => { switchProject(id); setSelectedId(null); setHighlightTypeId(null); }}
          onCreate={createProject}
          onRename={renameProject}
          onDelete={deleteProject}
          onClose={() => setShowProjects(false)}
        />
      )}

      {/* ── CHARACTER PANEL ────────────────────────────── */}
      {selectedCharacter && !showProjects && (
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 30,
          width: isMobile ? "100%" : undefined,
        }}>
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

      {/* ── MODALS ──────────────────────────────────────── */}
      {showAddChar && <AddCharacterModal onAdd={handleAddCharacter} onClose={() => setShowAddChar(false)} />}

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
          onReset={() => { resetActiveProject(); setSelectedId(null); setHighlightTypeId(null); }}
          onDelete={() => deleteProject(activeProject.id)}
          onSaveConnectionTypes={handleSaveConnectionTypes}
          onClose={() => setShowProjSettings(false)}
        />
      )}

      {showSiteSettings && (
        <SiteSettingsModal
          theme={theme}
          onSetTheme={setTheme}
          onImport={importChrw}
          onClose={() => setShowSiteSettings(false)}
        />
      )}
    </div>
  );
}

// ── Style helpers ──────────────────────────────────────────
const dropdownItemStyle = (gold: boolean): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: 10,
  width: "100%", padding: "12px 16px", textAlign: "left",
  background: "transparent", border: "none", cursor: "pointer",
  fontFamily: "'DM Mono', monospace", fontSize: 13,
  color: gold ? "var(--gold)" : "var(--text-secondary)",
  borderBottom: gold ? "1px solid var(--border-subtle)" : "none",
});

function ToolBtn({ onClick, children, gold, active }: {
  onClick: () => void; children: React.ReactNode; gold?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 8, cursor: "pointer",
      fontFamily: "'DM Mono', monospace", fontSize: 13,
      background: gold ? "linear-gradient(135deg, rgba(139,111,71,0.3), var(--gold-dim))"
        : active ? "var(--gold-dim)" : "var(--bg-surface)",
      border: `1px solid ${gold || active ? "var(--gold-border)" : "var(--border-medium)"}`,
      color: gold || active ? "var(--gold)" : "var(--text-muted)",
      transition: "transform 0.12s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
      {children}
    </button>
  );
}

function IconBtn({ onClick, title, children, active }: {
  onClick: () => void; title?: string; children: React.ReactNode; active?: boolean;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      padding: 8, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center",
      background: active ? "var(--gold-dim)" : "transparent",
      border: active ? "1px solid var(--gold-border)" : "1px solid transparent",
      color: active ? "var(--gold)" : "var(--text-muted)",
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--gold)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--text-muted)"; }}>
      {children}
    </button>
  );
}
