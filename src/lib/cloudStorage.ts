import { updateProject } from "./api";
import { decompressData, getRawProject, saveProject } from "./localstorage";
import { Project, ProjectServer } from "./types";

export function uploadProject(id: string): Promise<boolean> {
    const zippedProject = getRawProject(id, false);
    const project = decompressData<Project>(zippedProject);
    return updateProject(id, { zippedProject, updatedAt: project.updatedAt });
}

export function syncProjects(remoteProjects: (ProjectServer & { id: string })[], localProjects: Project[]) {
    remoteProjects.forEach(rp => {
        const localProject = localProjects.find(lp => lp.id === rp.id);
        if (localProject && rp.updatedAt < localProject.updatedAt) {
            saveProject(rp.id, rp.zippedProject, true);
        }
        else {
            saveProject(rp.id, rp.zippedProject, false);
        }
    })
}

export function tempExists(id: string): boolean {
    const temp = getRawProject(id, true);
    return temp !== null;
}