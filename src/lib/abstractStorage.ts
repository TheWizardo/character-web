import { deleteRemoteProject } from "./api";
import { projectExists } from "./localstorage";
import { Project } from "./types";
import { NotificationService } from "../hooks/useNotifications";
import { DEF_PROJECT_NAME, DEFAULT_CONNECTION_TYPES } from "./constants";

export function handleActiveProjConfirmation(activeProject: Project) {
  if (!activeProject) return false;
  return projectExists(activeProject.id, true);
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

  return (
    !hasRealName &&
    (p.characters.length === 0) &&
    (p.connections.length === 0) &&
    (uniqueTypes.length === 0)
  );
}