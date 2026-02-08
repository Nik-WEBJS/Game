'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISOVisualState } from './mappings';
import { TECH_DECORATIONS, ISO_ABSENT, ISO_IN_PROGRESS, ISO_CERTIFIED, ISO_PROBLEM } from './decorations';

interface OfficeModelProps {
  activeZones: number;
  technologies: string[];
  isoState: ISOVisualState;
  riskIntensity: number;
  profitGlow: { color: string; intensity: number };
}

export function OfficeModel({
  activeZones,
  technologies,
  isoState,
  riskIntensity,
  profitGlow,
}: OfficeModelProps) {
  const floorWidth = 6 + activeZones * 2.5;
  const floorDepth = 8 + activeZones * 1.5;

  return (
    <group>
      {/* Floor */}
      <Floor width={floorWidth} depth={floorDepth} isoState={isoState} />

      {/* Walls */}
      <Walls width={floorWidth} depth={floorDepth} />

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

      {/* ISO decorations */}
      <ISODecorations isoState={isoState} floorWidth={floorWidth} floorDepth={floorDepth} />

      {/* Technology decorations */}
      {TECH_DECORATIONS.filter(d => technologies.includes(d.techId)).map(deco => (
        <TechDecoration key={deco.techId} decoration={deco} />
      ))}

      {/* Zone dividers */}
      {activeZones >= 2 && <ZoneDivider position={[0, 0, -1]} width={floorWidth * 0.6} />}
      {activeZones >= 3 && <ZoneDivider position={[-floorWidth * 0.25, 0, 2]} width={floorDepth * 0.3} vertical />}
      {activeZones >= 4 && <ZoneDivider position={[floorWidth * 0.25, 0, 2]} width={floorDepth * 0.3} vertical />}
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

// --- Walls with windows and baseboards ---
function Walls({ width, depth }: { width: number; depth: number }) {
  const wallHeight = 3;
  const wallColor = '#1a1a22';
  const windowCount = Math.max(2, Math.floor(width / 3));

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, wallHeight / 2, -depth / 2]}>
        <boxGeometry args={[width, wallHeight, 0.1]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[0.1, wallHeight, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[0.1, wallHeight, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* Baseboard trim — back wall */}
      <mesh position={[0, 0.05, -depth / 2 + 0.06]}>
        <boxGeometry args={[width, 0.1, 0.02]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>
      {/* Baseboard trim — left wall */}
      <mesh position={[-width / 2 + 0.06, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, depth]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>
      {/* Baseboard trim — right wall */}
      <mesh position={[width / 2 - 0.06, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, depth]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>

      {/* Windows on back wall */}
      {Array.from({ length: windowCount }, (_, i) => {
        const x = -width / 2 + (i + 0.5) * (width / windowCount);
        return (
          <group key={`win-${i}`} position={[x, 1.8, -depth / 2 + 0.06]}>
            {/* Window frame */}
            <mesh>
              <boxGeometry args={[1.0, 1.2, 0.02]} />
              <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Glass pane */}
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
            {/* Window cross divider — horizontal */}
            <mesh position={[0, 0, 0.015]}>
              <boxGeometry args={[0.9, 0.02, 0.01]} />
              <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Window cross divider — vertical */}
            <mesh position={[0, 0, 0.015]}>
              <boxGeometry args={[0.02, 1.1, 0.01]} />
              <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* Window sill */}
            <mesh position={[0, -0.62, 0.04]}>
              <boxGeometry args={[1.05, 0.03, 0.08]} />
              <meshStandardMaterial color="#3f3f46" roughness={0.5} metalness={0.3} />
            </mesh>
            {/* Daylight glow from window */}
            <pointLight position={[0, 0, 0.3]} color="#bfdbfe" intensity={0.12} distance={4} />
          </group>
        );
      })}

      {/* Ceiling lights (fluorescent panels) */}
      {Array.from({ length: Math.max(2, Math.floor(width / 4)) }, (_, i) => {
        const x = -width / 2 + (i + 0.5) * (width / Math.max(2, Math.floor(width / 4)));
        return (
          <group key={`ceil-${i}`} position={[x, wallHeight - 0.05, 0]}>
            {/* Light panel housing */}
            <mesh>
              <boxGeometry args={[0.8, 0.04, 0.3]} />
              <meshStandardMaterial color="#d4d4d8" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Light surface */}
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
  if (isoState === 'absent') {
    return (
      <group>
        {Array.from({ length: ISO_ABSENT.clutter }, (_, i) => {
          const x = (Math.sin(i * 2.3) * floorWidth * 0.35);
          const z = (Math.cos(i * 1.7) * floorDepth * 0.3);
          return (
            <mesh key={`clutter-${i}`} position={[x, 0.06, z]} rotation={[0, i * 0.8, 0]}>
              <boxGeometry args={[0.2, 0.12, 0.15]} />
              <meshStandardMaterial color="#78716c" roughness={0.95} />
            </mesh>
          );
        })}
        {Array.from({ length: ISO_ABSENT.paperStacks }, (_, i) => {
          const x = (Math.sin(i * 3.1 + 1) * floorWidth * 0.25);
          const z = (Math.cos(i * 2.1 + 1) * floorDepth * 0.2);
          return (
            <mesh key={`paper-${i}`} position={[x, 0.08, z]}>
              <boxGeometry args={[0.15, 0.16, 0.1]} />
              <meshStandardMaterial color="#d6d3d1" roughness={0.9} />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (isoState === 'in_progress') {
    return (
      <group>
        {Array.from({ length: ISO_IN_PROGRESS.documents }, (_, i) => (
          <mesh key={`doc-${i}`} position={[(i - 1.5) * 1.5, 1.5, -floorDepth / 2 + 0.1]}>
            <boxGeometry args={[0.5, 0.7, 0.02]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.8} />
          </mesh>
        ))}
        {Array.from({ length: ISO_IN_PROGRESS.diagrams }, (_, i) => (
          <mesh key={`diag-${i}`} position={[(i - 0.5) * 2, 1.8, -floorDepth / 2 + 0.1]}>
            <boxGeometry args={[0.8, 0.5, 0.02]} />
            <meshStandardMaterial color="#dbeafe" emissive="#3b82f6" emissiveIntensity={0.05} roughness={0.7} />
          </mesh>
        ))}
      </group>
    );
  }

  if (isoState === 'certified') {
    return (
      <group>
        {Array.from({ length: ISO_CERTIFIED.plants }, (_, i) => {
          const x = (i - 1) * (floorWidth * 0.3);
          return (
            <group key={`plant-${i}`} position={[x, 0, floorDepth * 0.35]}>
              {/* Pot */}
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.12, 0.1, 0.24, 8]} />
                <meshStandardMaterial color="#78716c" roughness={0.9} />
              </mesh>
              {/* Plant */}
              <mesh position={[0, 0.35, 0]}>
                <sphereGeometry args={[0.18, 6, 6]} />
                <meshStandardMaterial color="#22c55e" roughness={0.8} />
              </mesh>
            </group>
          );
        })}
        {/* Certificate on wall */}
        <mesh position={[0, 2, -floorDepth / 2 + 0.1]}>
          <boxGeometry args={[0.6, 0.45, 0.02]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fbbf24" emissiveIntensity={0.1} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (isoState === 'problem') {
    return (
      <group>
        {/* Inspector */}
        <group position={[2, 0, -2]}>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.35, 0.5, 0.25]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#fcd9b6" roughness={0.6} />
          </mesh>
          {/* Clipboard */}
          <mesh position={[0.22, 0.5, 0.05]}>
            <boxGeometry args={[0.12, 0.16, 0.02]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.9} />
          </mesh>
        </group>
        {/* Warning lights */}
        {Array.from({ length: ISO_PROBLEM.warningLights }, (_, i) => (
          <PulsingLight
            key={`warn-${i}`}
            position={[(i - 0.5) * 3, 2.8, -floorDepth / 2 + 0.3]}
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

// --- Technology decorations ---
function TechDecoration({ decoration }: { decoration: typeof TECH_DECORATIONS[number] }) {
  return (
    <group>
      {decoration.positions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={decoration.scale} />
          <meshStandardMaterial
            color={decoration.color}
            emissive={decoration.emissive}
            emissiveIntensity={decoration.emissiveIntensity}
            roughness={0.6}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// --- Zone divider (glass partition) ---
function ZoneDivider({ position, width, vertical }: { position: [number, number, number]; width: number; vertical?: boolean }) {
  return (
    <mesh position={[position[0], 1, position[2]]} rotation={[0, vertical ? Math.PI / 2 : 0, 0]}>
      <boxGeometry args={[width, 2, 0.05]} />
      <meshStandardMaterial
        color="#94a3b8"
        transparent
        opacity={0.15}
        roughness={0.1}
        metalness={0.5}
      />
    </mesh>
  );
}
