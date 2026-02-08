'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISOVisualState } from './mappings';
import { TECH_DECORATIONS, ISO_ABSENT, ISO_IN_PROGRESS, ISO_CERTIFIED, ISO_PROBLEM } from './decorations';
import type { WallMaterial } from '@/game/types';
import { OFFICE_LEVELS } from '@/game/types';

interface OfficeModelProps {
  officeLevel: number;
  wallMaterials: { back: WallMaterial; left: WallMaterial; right: WallMaterial };
  technologies: string[];
  isoState: ISOVisualState;
  riskIntensity: number;
  profitGlow: { color: string; intensity: number };
}

export function OfficeModel({
  officeLevel,
  wallMaterials,
  technologies,
  isoState,
  riskIntensity,
  profitGlow,
}: OfficeModelProps) {
  const levelDef = OFFICE_LEVELS.find(l => l.level === officeLevel) ?? OFFICE_LEVELS[0];
  const floorWidth = levelDef.floorWidth;
  const floorDepth = levelDef.floorDepth;

  return (
    <group>
      {/* Floor */}
      <Floor width={floorWidth} depth={floorDepth} isoState={isoState} />
      {/* ISO decorations */}
      <ISODecorations isoState={isoState} floorWidth={floorWidth} floorDepth={floorDepth} />
      {/* Walls */}
      <Walls width={floorWidth} depth={floorDepth} wallMaterials={wallMaterials} />

      {/* Ambient office light */}
      <pointLight
        position={[0, 4, 0]}
        color={profitGlow.color}
        intensity={profitGlow.intensity}
        distance={15}
      />

      {/* Risk warning light */}
      {riskIntensity > 0.5 && (
        <RiskLight intensity={riskIntensity} />
      )}



      {/* Technology decorations — all on back wall */}
      {TECH_DECORATIONS.filter(d => technologies.includes(d.techId)).map(deco => (
        <TechDecoration key={deco.techId} decoration={deco} floorWidth={floorWidth} floorDepth={floorDepth} />
      ))}
    </group>
  );
}

// --- Floor with tile pattern ---
function Floor({ width, depth, isoState }: { width: number; depth: number; isoState: ISOVisualState }) {
  const floorColor = useMemo(() => {
    switch (isoState) {
      case 'certified': return '#2a2a35';
      case 'in_progress': return '#252530';
      case 'problem': return '#2e2525';
      default: return '#222228';
    }
  }, [isoState]);

  const floorColor2 = useMemo(() => {
    switch (isoState) {
      case 'certified': return '#24242e';
      case 'in_progress': return '#20202a';
      case 'problem': return '#281f1f';
      default: return '#1d1d22';
    }
  }, [isoState]);

  // Generate tile grid
  const tileSize = 1;
  const tilesX = Math.ceil(width / tileSize);
  const tilesZ = Math.ceil(depth / tileSize);

  return (
    <group>
      {/* Base floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>
      {/* Tile pattern overlay */}
      {Array.from({ length: tilesX }, (_, ix) =>
        Array.from({ length: tilesZ }, (_, iz) => {
          const isAlt = (ix + iz) % 2 === 0;
          const x = -width / 2 + ix * tileSize + tileSize / 2;
          const z = -depth / 2 + iz * tileSize + tileSize / 2;
          return (
            <mesh key={`tile-${ix}-${iz}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.01, z]} receiveShadow>
              <planeGeometry args={[tileSize - 0.02, tileSize - 0.02]} />
              <meshStandardMaterial color={isAlt ? floorColor : floorColor2} roughness={0.85} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// --- Single wall panel (concrete or glass) ---
function WallPanel({ position, size, material, rotation }: {
  position: [number, number, number];
  size: [number, number, number];
  material: WallMaterial;
  rotation?: [number, number, number];
}) {
  if (material === 'glass') {
    return (
      <group position={position} rotation={rotation}>
        {/* Glass frame */}
        <mesh>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Glass fill */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[size[0] - 0.08, size[1] - 0.15, size[2] + 0.01]} />
          <meshStandardMaterial
            color="#93c5fd"
            transparent
            opacity={0.18}
            roughness={0.05}
            metalness={0.4}
          />
        </mesh>
      </group>
    );
  }
  // Concrete
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#1a1a22" roughness={0.85} />
    </mesh>
  );
}

// --- Walls with windows and baseboards ---
function Walls({ width, depth, wallMaterials }: { width: number; depth: number; wallMaterials: { back: WallMaterial; left: WallMaterial; right: WallMaterial } }) {
  const wallHeight = 3;
  const windowCount = Math.max(2, Math.floor(width / 3));

  return (
    <group>
      {/* Back wall — spans full width, sits behind floor */}
      <WallPanel position={[0.2, wallHeight / 2, -depth / 2 - 0.05]} size={[width + 0.7, wallHeight, 0.1]} material={wallMaterials.back} />
      {/* Left wall — from back wall inner face to front edge, no overlap */}
      <WallPanel position={[-width / 2 - 0.05, wallHeight / 2, 0.025]} size={[0.1, wallHeight, depth]} material={wallMaterials.left} />
      {/* Right wall — from back wall inner face to front edge, no overlap */}
      <WallPanel position={[width / 2 + 0.5, wallHeight / 2, 0.025]} size={[0.1, wallHeight, depth]} material={wallMaterials.right} />
      

      {/* Baseboard trim — back wall */}
      <mesh position={[0, 0.05, -depth / 2 + 0.01]}>
        <boxGeometry args={[width, 0.1, 0.02]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>
      {/* Baseboard trim — left wall */}
      <mesh position={[-width / 2 + 0.01, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, depth]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>
      {/* Baseboard trim — right wall */}
      <mesh position={[width / 2 - 0.01, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, depth]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>

      {/* Windows on back wall (only if concrete) */}
      {wallMaterials.back === 'concrete' && Array.from({ length: windowCount }, (_, i) => {
        const x = -width / 2 + (i + 0.5) * (width / windowCount);
        return (
          <group key={`win-${i}`} position={[x, 1.8, -depth / 2 + 0.06]}>
            <mesh>
              <boxGeometry args={[1.0, 1.2, 0.02]} />
              <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <boxGeometry args={[0.9, 1.1, 0.005]} />
              <meshStandardMaterial
                color="#60a5fa"
                transparent
                opacity={0.12}
                roughness={0.05}
                metalness={0.3}
              />
            </mesh>
            <mesh position={[0, 0, 0.015]}>
              <boxGeometry args={[0.9, 0.02, 0.01]} />
              <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.015]}>
              <boxGeometry args={[0.02, 1.1, 0.01]} />
              <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, -0.62, 0.04]}>
              <boxGeometry args={[1.05, 0.03, 0.08]} />
              <meshStandardMaterial color="#3f3f46" roughness={0.5} metalness={0.3} />
            </mesh>
            <pointLight position={[0, 0, 0.3]} color="#bfdbfe" intensity={0.12} distance={4} />
          </group>
        );
      })}

      {/* Ceiling lights (fluorescent panels) */}
      {Array.from({ length: Math.max(2, Math.floor(width / 4)) }, (_, i) => {
        const x = -width / 2 + (i + 0.5) * (width / Math.max(2, Math.floor(width / 4)));
        return (
          <group key={`ceil-${i}`} position={[x, wallHeight - 0.05, 0]}>
            <mesh>
              <boxGeometry args={[0.8, 0.04, 0.3]} />
              <meshStandardMaterial color="#d4d4d8" roughness={0.3} metalness={0.2} />
            </mesh>
            <mesh position={[0, -0.025, 0]}>
              <boxGeometry args={[0.75, 0.005, 0.25]} />
              <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.3} roughness={0.1} />
            </mesh>
            <pointLight position={[0, -0.2, 0]} color="#f1f5f9" intensity={0.25} distance={5} />
          </group>
        );
      })}
    </group>
  );
}

// --- Risk warning light (pulsing red) ---
function RiskLight({ intensity }: { intensity: number }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
      lightRef.current.intensity = intensity * pulse * 0.8;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 3.5, -3]}
      color="#ef4444"
      intensity={0}
      distance={12}
    />
  );
}

// --- ISO visual decorations ---
function ISODecorations({
  isoState,
  floorWidth,
  floorDepth,
}: {
  isoState: ISOVisualState;
  floorWidth: number;
  floorDepth: number;
}) {
  const leftWallX = -floorWidth / 2;
  const wallZ = -floorDepth / 2;

  if (isoState === 'absent') {
    return null;
  }

  if (isoState === 'in_progress') {
    return (
      <group>
        {/* Documents on LEFT wall */}
        {Array.from({ length: ISO_IN_PROGRESS.documents }, (_, i) => {
          const z = (i - (ISO_IN_PROGRESS.documents - 1) / 2) * 1.2;
          return (
            <mesh key={`doc-${i}`} position={[leftWallX + 0.06, 1.5, z]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.5, 0.7, 0.02]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.8} />
            </mesh>
          );
        })}
        {/* Diagrams on LEFT wall (higher row) */}
        {Array.from({ length: ISO_IN_PROGRESS.diagrams }, (_, i) => {
          const z = (i - (ISO_IN_PROGRESS.diagrams - 1) / 2) * 1.8;
          return (
            <mesh key={`diag-${i}`} position={[leftWallX + 0.06, 2.2, z]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.8, 0.5, 0.02]} />
              <meshStandardMaterial color="#dbeafe" emissive="#3b82f6" emissiveIntensity={0.05} roughness={0.7} />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (isoState === 'certified') {
    return (
      <group>
        {/* Many documents on LEFT wall — certified = full wall */}
        {Array.from({ length: ISO_CERTIFIED.documents }, (_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const z = (col - 1) * 1.2;
          const y = 1.3 + row * 0.85;
          return (
            <mesh key={`doc-${i}`} position={[leftWallX + 0.06, y, z]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.5, 0.7, 0.02]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.8} />
            </mesh>
          );
        })}
        {/* Diagrams on LEFT wall (top row) */}
        {Array.from({ length: ISO_CERTIFIED.diagrams }, (_, i) => {
          const z = (i - (ISO_CERTIFIED.diagrams - 1) / 2) * 1.4;
          return (
            <mesh key={`diag-${i}`} position={[leftWallX + 0.06, 2.5, z]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.8, 0.5, 0.02]} />
              <meshStandardMaterial color="#d1fae5" emissive="#22c55e" emissiveIntensity={0.08} roughness={0.7} />
            </mesh>
          );
        })}
        {/* Plants along left wall */}
        {Array.from({ length: ISO_CERTIFIED.plants }, (_, i) => {
          const z = (i - 1) * (floorDepth * 0.25);
          return (
            <group key={`plant-${i}`} position={[leftWallX + 0.4, 0, z]}>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.12, 0.1, 0.24, 8]} />
                <meshStandardMaterial color="#78716c" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.35, 0]}>
                <sphereGeometry args={[0.18, 6, 6]} />
                <meshStandardMaterial color="#22c55e" roughness={0.8} />
              </mesh>
            </group>
          );
        })}
        {/* Gold certificate on LEFT wall (center, prominent) */}
        <mesh position={[leftWallX + 0.06, 2.0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.7, 0.5, 0.025]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fbbf24" emissiveIntensity={0.15} roughness={0.4} metalness={0.2} />
        </mesh>
      </group>
    );
  }

  if (isoState === 'problem') {
    return (
      <group>
        {/* Documents on LEFT wall (some crooked) */}
        {Array.from({ length: ISO_PROBLEM.documents }, (_, i) => {
          const z = (i - (ISO_PROBLEM.documents - 1) / 2) * 1.2;
          const tilt = (i % 2 === 0 ? 0.05 : -0.08);
          return (
            <mesh key={`doc-${i}`} position={[leftWallX + 0.06, 1.5, z]} rotation={[tilt, Math.PI / 2, tilt * 0.5]}>
              <boxGeometry args={[0.5, 0.7, 0.02]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.8} />
            </mesh>
          );
        })}
        {/* Diagrams on LEFT wall */}
        {Array.from({ length: ISO_PROBLEM.diagrams }, (_, i) => {
          const z = (i - (ISO_PROBLEM.diagrams - 1) / 2) * 1.8;
          return (
            <mesh key={`diag-${i}`} position={[leftWallX + 0.06, 2.2, z]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.8, 0.5, 0.02]} />
              <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.08} roughness={0.7} />
            </mesh>
          );
        })}
        {/* Inspector near left wall */}
        <group position={[leftWallX + 0.8, 0, 0]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.35, 0.5, 0.25]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#fcd9b6" roughness={0.6} />
          </mesh>
          <mesh position={[0.22, 0.5, 0.05]}>
            <boxGeometry args={[0.12, 0.16, 0.02]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.9} />
          </mesh>
        </group>
        {/* Warning lights on LEFT wall */}
        {Array.from({ length: ISO_PROBLEM.warningLights }, (_, i) => (
          <PulsingLight
            key={`warn-${i}`}
            position={[leftWallX + 0.3, 2.8, (i - 0.5) * 3]}
            color="#f59e0b"
          />
        ))}
      </group>
    );
  }

  return null;
}

// --- Pulsing light ---
function PulsingLight({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.intensity = (Math.sin(state.clock.elapsedTime * 4) * 0.5 + 0.5) * 0.6;
    }
  });

  return <pointLight ref={ref} position={position} color={color} intensity={0} distance={4} />;
}

// --- Technology decorations (all positioned along back wall) ---
function TechDecoration({
  decoration,
  floorWidth,
  floorDepth,
}: {
  decoration: typeof TECH_DECORATIONS[number];
  floorWidth: number;
  floorDepth: number;
}) {
  const wallZ = -floorDepth / 2;

  return (
    <group>
      {decoration.items.map((item, i) => {
        const x = item.xOffset * floorWidth;
        const y = item.yBase + decoration.scale[1] / 2;
        // Wall-mounted: flush against back wall; floor items: slightly in front
        const z = decoration.wallMounted ? wallZ + 0.05 : wallZ + decoration.scale[2] / 2 + 0.15;
        return (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={decoration.scale} />
            <meshStandardMaterial
              color={decoration.color}
              emissive={decoration.emissive}
              emissiveIntensity={decoration.emissiveIntensity}
              roughness={0.6}
              metalness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

