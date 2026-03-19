export interface Character {
  id: string;
  name: string;
  fullName: string;
  age?: number;
  birthDate?: string;
  physicalDescription: string;
  hobbies: string[];
  address: string;
  workplace: string;
  education: string;
  additionalInfo?: string;
  color?: string;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  mutual?: boolean;
}

export interface ConnectionType {
  id: string;
  label: string;
  emoji: string;
  color: string;
  isDefault: boolean;
}

export interface GraphData {
  characters: Character[];
  connections: Connection[];
  connectionTypes: ConnectionType[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  projects: Project[];
  activeProjectId: string;
  projectData: Record<string, GraphData>;
  theme?: "dark" | "light";
}
