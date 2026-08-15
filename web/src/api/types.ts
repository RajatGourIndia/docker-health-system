export type ContainerState = 'running' | 'exited' | 'paused' | 'restarting' | 'dead' | 'created' | string;

export interface PortMapping {
  privatePort: number;
  publicPort: number | null;
  type: string;
  ip: string | null;
}

export interface ContainerSummary {
  id: string;
  name: string;
  image: string;
  state: ContainerState;
  status: string;
  ports: PortMapping[];
  createdAt: string;
}

export interface ContainerDetail extends ContainerSummary {
  env: string[];
  mounts: unknown[];
  restartPolicy: { Name?: string; MaximumRetryCount?: number } | null;
}

export interface ContainerEvent {
  id: string;
  action: string;
  status: string;
  container: ContainerSummary | null;
}

export interface ContainerStats {
  cpuPercent: number;
  memUsageBytes: number;
  memLimitBytes: number;
  memPercent: number;
  timestamp: string;
}

export interface ImageSummary {
  id: string;
  repoTags: string[];
  size: number;
  createdAt: string;
}

export interface SessionInfo {
  username: string;
  expiresAt: string;
}

export type ContainerAction = 'start' | 'stop' | 'restart' | 'pause' | 'unpause';
