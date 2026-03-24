export interface Character {
  id: string;
  name: string;
  fullName?: string;
  age?: number;
  birthDate?: string;
  physicalDescription?: string;
  hobbies?: string[];
  address?: string;
  workplace?: string;
  education?: string;
  additionalInfo?: string;
  color?: string;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  unmutual?: true;
}

export interface ConnectionType {
  id: string;
  label: string;
  emoji: string;
  color: string;
  isDefault?: boolean;
}

export interface GraphData {
  characters: Character[];
  connections: Connection[];
  connectionTypes: ConnectionType[];
}

export interface Project extends GraphData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectServer {
  zippedProject: string;
  updatedAt: number;
}

export interface Meta {
  projectIds: string[];
  activeProjectId: string;
  theme?: "dark" | "light";
  useLabelBg?: boolean;
}

export interface AppState {
  projects: Project[];
  activeProjectId: string;
  projectData: Record<string, GraphData>;
  theme?: "dark" | "light";
  useLabelBg: boolean;
}

export interface ChrlFile extends Project {
  version: 1;
  exportedAt: number;
}

type AuthState = "loading" | "signed-out" | "signed-in";
interface AuthUser { uid: string; displayName: string | null; email: string | null; photoURL: string | null; }

export interface AuthService {
  user: AuthUser | null;
  status: AuthState;
  signIn: () => Promise<any>;
  logOut: () => void;
}

export type NotificationKind = "success" | "error" | "confirmation";

interface BaseNotification {
  id: number;
  message: string;
}

interface SimpleNotification extends BaseNotification {
  kind: "success" | "error";
}

interface ConfirmationNotification extends BaseNotification {
  kind: "confirmation";
  danger: "confirm" | "dismiss";
  onConfirm: () => void; // user clicked "Sync now"
  confirmText?: string;
  onDismiss?: () => void; // user clicked "Keep local"
  dismissText?: string;
}

export type Notification = SimpleNotification | ConfirmationNotification;