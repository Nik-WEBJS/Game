'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TeamMember, TeamRole } from '@/game/types';
import { getBurnoutVisual, getMoraleSpeedFactor, ROLE_COLORS } from './mappings';
import { getAnimationParams, ROLE_ANIMATIONS } from './animations';

interface EmployeeProps {
  member: TeamMember;
  position: [number, number, number];
}

// Low-poly character: body (box) + head (sphere) + desk
export function Employee({ member, position }: EmployeeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const burnoutState = getBurnoutVisual(member.burnout);
  const moraleSpeed = getMoraleSpeedFactor(member.morale);
  const animParams = getAnimationParams(member.role, burnoutState, moraleSpeed);
  const roleColor = ROLE_COLORS[member.role];
  const animType = ROLE_ANIMATIONS[member.role];

  // Random phase offset so characters aren't in sync
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  // Walking path for managers
  const walkOrigin = useMemo(() => [...position] as [number, number, number], [position]);

  useFrame((state) => {
    if (!groupRef.current || burnoutState === 'removed') return;
    const t = state.clock.elapsedTime + phaseOffset;

    // Vertical bob
    const bob = Math.sin(t * animParams.bobSpeed) * animParams.bobAmount;
    groupRef.current.position.y = position[1] + bob;

    // Horizontal sway (walking managers move around)
    if (animParams.swayAmount > 0) {
      groupRef.current.position.x = walkOrigin[0] + Math.sin(t * animParams.swaySpeed) * animParams.swayAmount;
      groupRef.current.position.z = walkOrigin[2] + Math.cos(t * animParams.swaySpeed * 0.7) * animParams.swayAmount * 0.5;
    }

    // Rotation
    if (animParams.rotateAmount > 0) {
      groupRef.current.rotation.y = Math.sin(t * animParams.rotateSpeed) * animParams.rotateAmount;
    }

    // Slouch effect for high burnout
    if (burnoutState === 'slouched' && bodyRef.current) {
      bodyRef.current.rotation.x = 0.15 + Math.sin(t * 0.5) * 0.05;
    }
  });

  if (burnoutState === 'removed') return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.35, 0.5, 0.25]} />
        <meshStandardMaterial color={roleColor} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#fcd9b6" roughness={0.6} />
      </mesh>

      {/* Role-specific accessory */}
      <RoleAccessory role={member.role} />

      {/* Burnout indicator (red aura when high) */}
      {member.burnout > 60 && (
        <pointLight
          position={[0, 1.2, 0]}
          color="#ef4444"
          intensity={((member.burnout - 60) / 40) * 0.5}
          distance={1.5}
        />
      )}

      {/* Morale indicator (green sparkle when high) */}
      {member.morale > 80 && (
        <pointLight
          position={[0, 1.3, 0]}
          color="#34d399"
          intensity={0.2}
          distance={1}
        />
      )}
    </group>
  );
}

// --- Role-specific visual accessories ---
function RoleAccessory({ role }: { role: TeamRole }) {
  switch (role) {
    case 'security':
      // Badge
      return (
        <mesh position={[0.15, 0.65, 0.13]}>
          <boxGeometry args={[0.08, 0.06, 0.01]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </mesh>
      );
    case 'manager':
      // Clipboard
      return (
        <mesh position={[0.22, 0.5, 0.05]}>
          <boxGeometry args={[0.12, 0.16, 0.02]} />
          <meshStandardMaterial color="#d6d3d1" roughness={0.9} />
        </mesh>
      );
    default:
      return null;
  }
}
