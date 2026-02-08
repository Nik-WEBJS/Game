// --- Technology → Visual decoration mapping ---

// xOffset: horizontal position along back wall (fraction of floorWidth, -0.5..0.5)
// yBase: vertical position (0 = floor)
// wallMounted: if true, placed flush against back wall; if false, placed on floor near wall
export interface TechDecorationDef {
  techId: string;
  type: 'server_rack' | 'screen_panel' | 'safe' | 'camera';
  color: string;
  emissive: string;
  emissiveIntensity: number;
  items: { xOffset: number; yBase: number }[];
  scale: [number, number, number];
  wallMounted: boolean; // true = on wall surface, false = on floor near wall
}

export const TECH_DECORATIONS: TechDecorationDef[] = [
  {
    techId: 'cloud_infra',
    type: 'server_rack',
    color: '#1e3a5f',
    emissive: '#3b82f6',
    emissiveIntensity: 0.3,
    items: [{ xOffset: -0.35, yBase: 0 }, { xOffset: -0.2, yBase: 0 }],
    scale: [0.5, 1.2, 0.4],
    wallMounted: false,
  },
  {
    techId: 'ai_ml',
    type: 'screen_panel',
    color: '#1a1a2e',
    emissive: '#8b5cf6',
    emissiveIntensity: 0.5,
    items: [{ xOffset: 0.2, yBase: 1.2 }, { xOffset: 0.35, yBase: 1.2 }],
    scale: [0.7, 0.9, 0.1],
    wallMounted: true,
  },
  {
    techId: 'blockchain',
    type: 'safe',
    color: '#374151',
    emissive: '#f59e0b',
    emissiveIntensity: 0.2,
    items: [{ xOffset: 0.42, yBase: 0 }],
    scale: [0.6, 0.7, 0.5],
    wallMounted: false,
  },
  {
    techId: 'cybersecurity',
    type: 'camera',
    color: '#1f2937',
    emissive: '#ef4444',
    emissiveIntensity: 0.6,
    items: [{ xOffset: -0.3, yBase: 2.5 }, { xOffset: 0.3, yBase: 2.5 }],
    scale: [0.2, 0.2, 0.3],
    wallMounted: true,
  },
  {
    techId: 'microservices',
    type: 'server_rack',
    color: '#1e293b',
    emissive: '#06b6d4',
    emissiveIntensity: 0.3,
    items: [{ xOffset: -0.05, yBase: 0 }],
    scale: [0.4, 1.0, 0.4],
    wallMounted: false,
  },
];

// --- ISO visual decoration ---

export const ISO_ABSENT = { clutter: 0, paperStacks: 0 };
export const ISO_IN_PROGRESS = { documents: 3, diagrams: 1 };
export const ISO_CERTIFIED = { documents: 6, diagrams: 3, plants: 3 };
export const ISO_PROBLEM = { documents: 4, diagrams: 2, inspectors: 1, warningLights: 2 };
