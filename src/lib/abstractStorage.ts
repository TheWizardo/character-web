import { deleteRemoteProject, getPublicProject } from "./api";
import { projectExists, saveRawProject } from "./localstorage";
import { Project } from "./types";
import { NotificationService } from "../hooks/useNotifications";
import { DEF_PROJECT_NAME, DEFAULT_CONNECTION_TYPES } from "./constants";
import { isCompressed, decompressData } from "./compress";

export function handleActiveProjConfirmation(uid: string, activeProject: Project) {
  if (!activeProject) return false;
  return projectExists(uid, activeProject.id, true);
};

export function deleteActiveProject(
  activeProject: Project,
  notify: NotificationService,
  deleteCb: (id: string, isTemp: boolean) => void
) {
  const name = activeProject.name;
  deleteCb(activeProject.id, false);
  if (deleteRemoteProject(activeProject.id)) {
    notify.success(`Deleted "${name}"`);
  }
  else {
    notify.error(`Unable to delete "${name}" from the cloud`)
  }
}

export function isEmptyProject(p: Project): boolean {
  const hasRealName = p.name.trim() !== DEF_PROJECT_NAME;
  const uniqueTypes = p.connectionTypes.filter(pt =>
    !DEFAULT_CONNECTION_TYPES.find(dt => dt.id === pt.id)
  )
  const isEmpty = (
    !hasRealName &&
    (p.characters.length === 0) &&
    (p.connections.length === 0) &&
    (uniqueTypes.length === 0)
  );
  return isEmpty
}

// ── factory functions ─────────────────────────────────────
export function makeEmptyProject(id: string, name: string): Project {
  const now = Date.now();
  return {
    id, name,
    createdAt: now, updatedAt: now,
    characters: [], connections: [],
    connectionTypes: [...DEFAULT_CONNECTION_TYPES],
    isPublic: undefined
  };
}

export async function importWithLink(uid: string, pid: string): Promise<{ project: Project, collision: boolean }> {
  if (!uid.trim() || !pid.trim()) {
    throw new Error("Both uid and pid are required");
  }

  const compressed = await getPublicProject(uid.trim(), pid.trim());

  if (!isCompressed(compressed)) {
    throw new Error("Invalid public project response");
  }

  const project = decompressData<Project>(compressed);
  saveRawProject(uid, pid, compressed, true);

  return {
    collision: projectExists(uid, project.id, false),
    project
  };
}