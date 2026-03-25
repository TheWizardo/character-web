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

import { updateProject } from "./api";
import { compressData, decompressData, dehydrateProject } from "./compress";
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
export async function uploadProject(uid: string, { p, id }: { p?: Project, id?: string }): Promise<boolean> {
  let zippedProject: string;
  let updatedAt: number;
  let isPublic: boolean;
  let pid: string;
  if (p) {
    zippedProject = compressData(dehydrateProject(p));
    updatedAt = p.updatedAt;
    isPublic = p.isPublic === true;
    pid = p.id;
  }
  else {
    zippedProject = getRawProject(uid, id, false);
    const unzipped = decompressData<Project>(zippedProject);
    updatedAt = unzipped.updatedAt;
    isPublic = unzipped.isPublic === true;
    pid = id;
  }
  if (!zippedProject) return false;

  return updateProject(pid, { zippedProject, updatedAt, isPublic });
}

/**
 * Compares remote projects against local ones and stages newer server
 * versions in the temp slot for user confirmation.
 *
 * - Local newer than remote → write to temp slot (pending user confirmation)
 * - Remote newer than local → updates local
 *
 * Returns the IDs of projects that were staged in temp (i.e. need user confirmation).
 */
export function stageNewerRemoteProjects(uid: string,
  remoteProjects: (ProjectServer & { id: string })[],
  localProjects: Project[]
): string[] {
  const staged: string[] = [];
  for (const remote of remoteProjects) {
    const local = localProjects.find((lp) => lp.id === remote.id);
    if (remote.updatedAt < local?.updatedAt) {
      saveRawProject(uid, remote.id, remote.zippedProject, true);
      staged.push(remote.id);
    }
    if (!local || remote.updatedAt > local?.updatedAt) {
      saveRawProject(uid, remote.id, remote.zippedProject, false);
    }
  }

  return staged;
}

/** Returns true if there is a staged (temp) version waiting for this project. */
export function hasPendingSync(uid: string, pid: string): boolean {
  return projectExists(uid, pid, true);
}