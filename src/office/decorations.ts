// --- Technology → Visual decoration mapping ---

export interface DecorationDef {
  techId: string;
  type: 'server_rack' | 'screen_panel' | 'safe' | 'camera';
  color: string;
  emissive: string;
  emissiveIntensity: number;
  positions: [number, number, number][];
  scale: [number, number, number];
}

export const TECH_DECORATIONS: DecorationDef[] = [
  {
    techId: 'cloud_infra',
    type: 'server_rack',
    color: '#1e3a5f',
    emissive: '#3b82f6',
    emissiveIntensity: 0.3,
    positions: [[-5.5, 0, -2], [-5.5, 0, 0]],
    scale: [0.5, 1.2, 0.4],
  },
  {
    techId: 'ai_ml',
    type: 'screen_panel',
    color: '#1a1a2e',
    emissive: '#8b5cf6',
    emissiveIntensity: 0.5,
    positions: [[5.5, 0, -2], [5.5, 0, 0]],
    scale: [0.1, 0.9, 0.7],
  },
  {
    techId: 'blockchain',
    type: 'safe',
    color: '#374151',
    emissive: '#f59e0b',
    emissiveIntensity: 0.2,
    positions: [[-5.5, 0, 2]],
    scale: [0.6, 0.7, 0.5],
  },
  {
    techId: 'cybersecurity',
    type: 'camera',
    color: '#1f2937',
    emissive: '#ef4444',
    emissiveIntensity: 0.6,
    positions: [[-4, 2.5, -4], [4, 2.5, -4]],
    scale: [0.2, 0.2, 0.3],
  },
  {
    techId: 'microservices',
    type: 'server_rack',
    color: '#1e293b',
    emissive: '#06b6d4',
    emissiveIntensity: 0.3,
    positions: [[5.5, 0, 2]],
    scale: [0.4, 1.0, 0.4],
  },
];

// --- ISO visual decoration ---

export const ISO_ABSENT = { clutter: 0, paperStacks: 0 };
export const ISO_IN_PROGRESS = { documents: 4, diagrams: 2 };
export const ISO_CERTIFIED = { plants: 3 };
export const ISO_PROBLEM = { inspectors: 1, warningLights: 2 };
