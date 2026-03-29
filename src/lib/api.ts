/**
 * api.ts
 *
 * Four plain async functions for interacting with the Character Loom backend.
 * Each one fetches a fresh Firebase ID token automatically.
 *
 * Set REACT_APP_API_URL in your .env (defaults to http://localhost:4000).
 */

import { getAuth } from "firebase/auth";
import { ProjectServer } from "./types";

// const BASE = "http://localhost:4000";
const BASE = "https://api.character-loom.com";

async function token(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
}

type Method = 'GET' | 'DELETE' | 'POST' | 'PUT'

async function req<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token()}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`${res.status}: ${error}`);
  }
  return res.json();
}

/**
 * Fetches all projects for the user from the backend.
 * Creates an empty user record on first call.
 */
export async function fetchUserProjects(): Promise<(ProjectServer & { id: string })[]> {
  const { projects } = await req<{ uid: string; projects: (ProjectServer & { id: string })[] }>("GET", "/user");
  return projects;
}

/**
 * Pushes a project blob to the backend.
 * `data` is the raw value of localStorage.getItem("cl:p:{id}") — no extra work needed.
 * Records the server's changedAt locally on success so future comparisons stay accurate.
 * Returns true on success, false on failure.
 */
export async function updateProject(id: string, data: ProjectServer): Promise<boolean> {
  try {
    const res = await req<{ ok: true; projectId: string; changedAt: number }>(
      "PUT", "/project", { id, data }
    );
    return res.ok;
  } catch (err) {
    console.warn("[api] updateProject failed", id, err);
    return false;
  }
}

/**
 * Deletes a project from the backend.
 * Returns true on success or if the project wasn't on the server (404).
 * Returns false on unexpected errors.
 */
export async function deleteRemoteProject(id: string): Promise<boolean> {
  try {
    await req("DELETE", `/project/${id}`);
    return true;
  } catch (err: any) {
    if (err?.message?.startsWith("404")) return true; // already gone — that's fine
    console.warn("[api] deleteRemoteProject failed", id, err);
    return false;
  }
}

export async function getPublicProject(uid: string, pid: string): Promise<string> {
  try {
    const { data } = await req<{ data: string }>('GET', `/share/${uid}/${pid}`);
    return data;
  } catch (err: any) {
    console.warn("[api] getPublicProject failed", uid, pid, err);
    return "";
  }
}