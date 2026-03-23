import { deleteRemoteProject } from "./api";
import { projectExists, promoteTempProject } from "./localstorage";
import { Project } from "./types";
import { NotificationService } from "../hooks/useNotifications";

export function handleActiveProjConfirmation(
  activeProject: Project,
  notify: NotificationService,
  reloadCb: () => void,
  deleteCb: (id: string, isTemp: boolean) => void
) {
  if (projectExists(activeProject.id, true)) {
    notify.confirmation(`"${activeProject.name}" was not synced. Showing local project.\nOverwrite local data?`,
      "confirm",
      () => { promoteTempProject(activeProject.id); reloadCb() }, "Overwrite",
      () => deleteCb(activeProject.id, true)
    )
  }
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