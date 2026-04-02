import { useState, useCallback, useEffect } from "react";
import { Character, Connection, ConnectionType } from "../lib/types";
import { useAppState } from "../hooks/useAppState";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAuth } from "../hooks/useAuth";
import ForceGraph from "./ForceGraph";
import CharacterPanel from "./interface/CharacterPanel";
import AddCharacterModal from "./modals/AddCharacterModal";
import AddConnectionModal from "./modals/AddConnectionModal";
import ProjectSettingsModal from "./modals/ProjectSettingsModal";
import ProjectsSidebar from "./interface/ProjectsSidebar";
import SiteSettingsModal from "./modals/SiteSettingsModal";
import Legend from "./interface/Legend";
import GraphNavigation from "./interface/GraphNavigation";
import { fetchUserProjects } from "../lib/api";
import { useNotifications } from "../hooks/useNotifications";
import { uploadProject } from "../lib/cloudStorage";
import { cleanRadicalProjects, loadProjectData, promoteTempProject } from "../lib/localstorage";
import { deleteActiveProject, handleActiveProjConfirmation } from "../lib/abstractStorage";
import Loading from "./Loading";
import TopBar from "./interface/TopBar";
import { GUEST_KEY } from "../lib/constants";
import ImportModal from "./modals/ImportModal";

export default function GraphApp() {
  const notify = useNotifications();

  const {
    state, loaded, userId,
    activeData, saveActiveData, resetActiveProject,
    activeProject, createProject, saveProject, reloadActiveProject, syncWithRemote, deleteProject, switchProject,
    setTheme, setLabelBg, importChrl, updateUser
  } = useAppState();

  const isMobile = useIsMobile();
  const { user, status } = useAuth();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightTypeId, setHighlightTypeId] = useState<string | null>(null);
  const [showAddChar, setShowAddChar] = useState(false);
  const [showAddConn, setShowAddConn] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showProjSettings, setShowProjSettings] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const selectedCharacter = activeData.characters.find((c) => c.id === selectedId) ?? null;
  const theme = state.theme ?? "dark";
  const useLabelBg = state.useLabelBg ?? true;

  const showActiveProjectConflictMessage = useCallback((uid: string, pid: string) => {
    const project = loadProjectData(uid, pid);
    notify.confirmation(`"${project.name}" was not synced. Showing local project.\nOverwrite local data?`,
      "confirm",
      () => { promoteTempProject(uid, project.id); reloadActiveProject() }, "Overwrite",
      () => deleteProject(project.id, true)
    )
  }, [notify, deleteProject, reloadActiveProject]);

  useEffect(() => {
    if (!userId) return;
    if (window.location.pathname !== "/") setShowImport(true);
  }, [userId])

  useEffect(() => {
    cleanRadicalProjects();
    if (status === "signed-in" && user) {
      notify.success(`Logged in as: ${user.displayName}`);
      const result = updateUser(user.uid);
      if (!result) return;
      const { existed, meta: freshMeta, projects: freshProjects } = result;

      fetchUserProjects()
        .then((remoteProjects) => {
          const { unsaved, staged } = syncWithRemote(remoteProjects, freshProjects, freshMeta, user.uid);
          if (!existed) return;
          if (staged.includes(freshMeta.activeProjectId)) {
            showActiveProjectConflictMessage(user.uid, freshMeta.activeProjectId);
          }
          unsaved.forEach((up) => {
            notify.confirmation(
              `"${up.name}" was not saved to the cloud.\nUpload?`,
              "dismiss",
              () => uploadProject(user.uid, { id: up.id }).then(() => notify.success(`Uploaded "${up.name}"`)), "Upload",
              () => { }, "Local only",
              1000 * 60 * 60 * 10
            );
          });
        }).catch(() => notify.error("Failed to contact server.\nShowing only local projects"));
    } else if (status === "signed-out") {
      updateUser(GUEST_KEY);
    }
  }, [status, user]);

  useEffect(() => {
    if (handleActiveProjConfirmation(userId, activeProject)) {
      showActiveProjectConflictMessage(userId, activeProject.id);
    }
  }, [activeProject?.id])

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

  const handleAddConnection = (conn: Connection) => {
    saveActiveData({ ...activeData, connections: [...activeData.connections, conn] });
  }

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

  const handleAddConnectionType = (type: ConnectionType) => {
    const next = [...activeData.connectionTypes, type];
    saveActiveData({ ...activeData, connectionTypes: next });
    notify.success(`Added "${type.label.trim()}" connection`)
  }

  const handleRemoveConnectionType = (id: string) => {
    const conn = activeData.connectionTypes.find(t => t.id === id);
    const remainingConnections = activeData.connections.filter(c => c.type !== id);
    const remainingTypes = activeData.connectionTypes.filter(c => c.id !== id);
    saveActiveData({ ...activeData, connectionTypes: remainingTypes, connections: remainingConnections });
    notify.success(`Removed "${conn.label}" connection`)
  }

  if (!loaded || status === "loading") {
    return <Loading />
  }

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
      <TopBar
        showProjectsList={showProjects}
        activeProjectName={activeProject?.name}
        connNum={activeData.connections.length}
        charNum={activeData.characters.length}
        setShowAddChar={setShowAddChar}
        setShowAddConn={setShowAddConn}
        setShowAddMenu={setShowAddMenu}
        setShowProjSettings={setShowProjSettings}
        setShowSiteSettings={setShowSiteSettings}
        setShowProjects={setShowProjects}
        setSelectedId={setSelectedId}
        showAddMenu={showAddMenu}
      />

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
          onSwitch={(id) => {
            switchProject(id);
            setSelectedId(null);
            setHighlightTypeId(null);
          }}
          onCreate={createProject}
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
          onReset={() => {
            resetActiveProject();
            setSelectedId(null);
            setHighlightTypeId(null);
          }}
          onDelete={() => deleteActiveProject(activeProject, notify, deleteProject)}
          onAddConnectionType={handleAddConnectionType}
          onRemoveConnectionType={handleRemoveConnectionType}
          onClose={() => setShowProjSettings(false)}
          onSaveCb={saveProject}
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

      {showImport && (
        <ImportModal
          onImport={importChrl}
          onClose={() => {
            setShowImport(false);
            const { origin } = window.location;
            window.location.replace(origin);
          }}
        />
      )}
    </div>
  );
}