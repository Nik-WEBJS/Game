'use client';

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { LogoId } from '@/game/types';

// Logo color map matching the SetupScreen presets
const LOGO_COLORS: Record<LogoId, string> = {
  rocket: '#f43f5e',
  zap: '#eab308',
  shield: '#3b82f6',
  diamond: '#8b5cf6',
  flame: '#f97316',
  globe: '#06b6d4',
  star: '#fbbf24',
  crown: '#a855f7',
  target: '#ef4444',
  hexagon: '#14b8a6',
  atom: '#6366f1',
  leaf: '#22c55e',
};

interface CompanySignProps {
  companyName: string;
  logoId: LogoId;
  wallZ: number; // z position of the back wall
}

// 3D logo shapes built from primitives
function Logo3D({ logoId, color }: { logoId: LogoId; color: string }) {
  const emissive = color;

  switch (logoId) {
    case 'rocket':
      return (
        <group>
          <mesh>
            <coneGeometry args={[0.18, 0.5, 6]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 0.15, 6]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} metalness={0.3} roughness={0.5} />
          </mesh>
        </group>
      );
    case 'zap':
      return (
        <mesh rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.12, 0.5, 0.06]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
        </mesh>
      );
    case 'shield':
      return (
        <mesh>
          <cylinderGeometry args={[0.25, 0.2, 0.08, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
        </mesh>
      );
    case 'diamond':
      return (
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.3, 0.3, 0.08]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.6} roughness={0.2} />
        </mesh>
      );
    case 'flame':
      return (
        <group>
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <coneGeometry args={[0.12, 0.2, 6]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} roughness={0.4} />
          </mesh>
        </group>
      );
    case 'globe':
      return (
        <mesh>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} metalness={0.3} roughness={0.4} wireframe />
        </mesh>
      );
    case 'star':
      return (
        <mesh rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.06, 5]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
        </mesh>
      );
    case 'crown':
      return (
        <group>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.4, 0.2, 0.08]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
          </mesh>
          {[-0.12, 0, 0.12].map((x, i) => (
            <mesh key={i} position={[x, 0.15, 0]}>
              <coneGeometry args={[0.05, 0.15, 4]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'target':
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} roughness={0.4} />
          </mesh>
        </group>
      );
    case 'hexagon':
      return (
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.08, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} metalness={0.4} roughness={0.3} />
        </mesh>
      );
    case 'atom':
      return (
        <group>
          <mesh>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} roughness={0.3} />
          </mesh>
          {[0, Math.PI / 3, -Math.PI / 3].map((rot, i) => (
            <mesh key={i} rotation={[rot, 0, 0]}>
              <torusGeometry args={[0.22, 0.015, 8, 24]} />
              <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'leaf':
      return (
        <group rotation={[0, 0, Math.PI / 6]}>
          <mesh>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} roughness={0.5} />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} roughness={0.4} />
        </mesh>
      );
  }
}

export function CompanySign({ companyName, logoId, wallZ }: CompanySignProps) {
  const color = LOGO_COLORS[logoId] || '#ffffff';
  const displayName = companyName.trim() || 'Company';

  // Scale text based on name length
  const fontSize = useMemo(() => {
    const len = displayName.length;
    if (len <= 6) return 0.35;
    if (len <= 12) return 0.28;
    if (len <= 18) return 0.22;
    return 0.18;
  }, [displayName]);

  return (
    <group position={[0, 2.2, wallZ + 0.12]}>
      {/* Backplate */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[Math.max(displayName.length * fontSize * 0.65 + 1.2, 2.5), 0.9, 0.04]} />
        <meshStandardMaterial color="#1e1e2e" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Logo */}
      <group position={[-(displayName.length * fontSize * 0.65 + 1.2) / 2 + 0.45, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <Logo3D logoId={logoId} color={color} />
      </group>

      {/* Company name text */}
      <Text
        position={[0.3, 0, 0.02]}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={6}
      >
        {displayName}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.5}
        />
      </Text>

      {/* Accent light */}
      <pointLight position={[0, 0.5, 0.5]} color={color} intensity={0.3} distance={3} />
    </group>
  );
}
