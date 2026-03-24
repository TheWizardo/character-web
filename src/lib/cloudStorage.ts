/**
 * cloudStorage.ts
 *
 * Sync logic between localStorage and the backend.
 * No compression/decompression — operates on raw blobs opaquely where possible.
 *
 * Temp slot strategy:
 *   When the server has a newer version of a project, it is written to
 *   cl:p:{id}:temp rather than overwriting the user's current work.
 *   The app then prompts the user to confirm before calling promoteTempProject().
 */

import { updateProject, deleteRemoteProject } from "./api";
import { decompressData } from "./compress";
import {
  getRawProject,
  saveRawProject,
  projectExists,
} from "./localstorage";
import { Project, ProjectServer } from "./types";

/**
 * Uploads the current local version of a project to the backend.
 * Reads the raw compressed blob directly — no full decompression needed
 * except to extract updatedAt for the server payload.
 */
export async function uploadProject(id: string): Promise<boolean> {
  const zippedProject = getRawProject(id, false);
  if (!zippedProject) return false;

  const { updatedAt } = decompressData<Pick<Project, "updatedAt">>(zippedProject);
  return updateProject(id, { zippedProject, updatedAt });
}

/**
 * Compares remote projects against local ones and stages newer server
 * versions in the temp slot for user confirmation.
 *
 * - Remote newer than local → write to temp slot (pending user confirmation)
 * - Local newer than remote → no action (upload is triggered separately on button press)
 *
 * Returns the IDs of projects that were staged in temp (i.e. need user confirmation).
 */
export function stageNewerRemoteProjects(
  remoteProjects: (ProjectServer & { id: string })[],
  localProjects: Project[]
): string[] {
  const staged: string[] = [];
  for (const remote of remoteProjects) {
    const local = localProjects.find((lp) => lp.id === remote.id);
    if (remote.updatedAt > local?.updatedAt) {
      saveRawProject(remote.id, remote.zippedProject, true);
      staged.push(remote.id);
    }
    if (!local) {
      saveRawProject(remote.id, remote.zippedProject, false);
    }
  }

  return staged;
}

/** Returns true if there is a staged (temp) version waiting for this project. */
export function hasPendingSync(id: string): boolean {
  return projectExists(id, true);
}

/** Deletes a project from the backend. */
export async function removeProject(id: string): Promise<boolean> {
  return deleteRemoteProject(id);
}
