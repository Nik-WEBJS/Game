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
  rotationY?: number;
  seated?: boolean;
}

const SKIN = '#f0c8a0';
const SKIN_DARK = '#d4a574';
const SHOE_COLOR = '#1a1a2e';
const HAIR_COLORS: Record<TeamRole, string> = {
  developer: '#2d1b0e',
  manager: '#4a3728',
  qa: '#1a1a2e',
  security: '#0f0f0f',
  marketing: '#8b4513',
};

export function Employee({ member, position, rotationY = 0, seated = false }: EmployeeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const upperBodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const progressFillRef = useRef<THREE.Mesh>(null);
  const laptopLedRef = useRef<THREE.Mesh>(null);
  const workFillRef = useRef<THREE.Mesh>(null);

  const isFreelance = member.status === 'freelance';
  const freelanceProgress = member.freelanceTask?.progress ?? 0;
  const isWorking = !isFreelance && !!member.deskId;
  const workProgress = member.workProgress ?? 0;

  const burnoutState = getBurnoutVisual(member.burnout);
  const moraleSpeed = getMoraleSpeedFactor(member.morale);
  const animParams = getAnimationParams(member.role, burnoutState, moraleSpeed);
  const roleColor = ROLE_COLORS[member.role];
  const animType = ROLE_ANIMATIONS[member.role];
  const hairColor = HAIR_COLORS[member.role];

  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const walkOrigin = useMemo(() => [...position] as [number, number, number], [position]);

  useFrame((state) => {
    if (!groupRef.current || burnoutState === 'removed') return;
    const t = state.clock.elapsedTime + phaseOffset;

    if (isFreelance) {
      groupRef.current.rotation.y = rotationY;
      // Freelancers: gentle float + no walk
      const float = Math.sin(t * 1.5) * 0.02;
      groupRef.current.position.y = position[1] + float;
      // Animate progress bar fill
      if (progressFillRef.current) {
        const BAR_W = 0.5;
        const fillW = Math.max(0.001, freelanceProgress * BAR_W);
        progressFillRef.current.scale.x = fillW / BAR_W;
        progressFillRef.current.position.x = -(BAR_W - fillW) / 2;
      }
      // Blink laptop LED
      if (laptopLedRef.current) {
        const blink = Math.sin(t * 3) > 0 ? 0.8 : 0.2;
        (laptopLedRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blink;
      }
      return;
    }

    if (seated) {
      groupRef.current.rotation.y = rotationY;
      const idle = Math.sin(t * 2.2) * 0.01;
      groupRef.current.position.y = position[1] - 0.05 + idle;

      if (upperBodyRef.current) {
        upperBodyRef.current.position.y = 0;
        upperBodyRef.current.rotation.x = 0.22 + Math.sin(t * 2.5) * 0.02;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = -1.36 + Math.sin(t * 5.5) * 0.06;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -1.46 + Math.sin(t * 5.2 + 0.6) * 0.06;
      return;
    }

    if (upperBodyRef.current) {
      upperBodyRef.current.position.y = 0;
    }
    // Work progress bar for office employees at desks
    if (workFillRef.current && isWorking) {
      const BAR_W = 0.4;
      const fillW = Math.max(0.001, workProgress * BAR_W);
      workFillRef.current.scale.x = fillW / BAR_W;
      workFillRef.current.position.x = -(BAR_W - fillW) / 2;
    }

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

    // Arm swing animation
    const armSwing = Math.sin(t * animParams.bobSpeed * 1.2) * 0.3;
    if (leftArmRef.current) leftArmRef.current.rotation.x = armSwing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -armSwing;

    // Leg walk animation (only when moving)
    if (animParams.swayAmount > 0) {
      const legSwing = Math.sin(t * animParams.swaySpeed * 2) * 0.4;
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
    }

    // Slouch effect for high burnout
    if (burnoutState === 'slouched' && upperBodyRef.current) {
      upperBodyRef.current.rotation.x = 0.15 + Math.sin(t * 0.5) * 0.05;
    }
  });

  if (burnoutState === 'removed') return null;

  // Opacity for freelance ghost effect
  const bodyOpacity = isFreelance ? 0.35 : 1;
  const isTransparent = isFreelance;

  return (
    <group ref={groupRef} position={position}>
      {/* --- Lower body --- */}
      {!(seated && !isFreelance) && (
        <>
          {/* Left leg */}
          <group ref={leftLegRef} position={[-0.08, 0.28, 0]}>
            <mesh position={[0, -0.02, 0]} castShadow>
              <boxGeometry args={[0.1, 0.22, 0.1]} />
              <meshStandardMaterial color={roleColor} roughness={0.7} transparent={isTransparent} opacity={bodyOpacity} />
            </mesh>
            <mesh position={[0, -0.2, 0]} castShadow>
              <boxGeometry args={[0.09, 0.18, 0.09]} />
              <meshStandardMaterial color={roleColor} roughness={0.7} transparent={isTransparent} opacity={bodyOpacity} />
            </mesh>
            <mesh position={[0, -0.32, 0.02]} castShadow>
              <boxGeometry args={[0.1, 0.06, 0.14]} />
              <meshStandardMaterial color={SHOE_COLOR} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
            </mesh>
          </group>
          {/* Right leg */}
          <group ref={rightLegRef} position={[0.08, 0.28, 0]}>
            <mesh position={[0, -0.02, 0]} castShadow>
              <boxGeometry args={[0.1, 0.22, 0.1]} />
              <meshStandardMaterial color={roleColor} roughness={0.7} transparent={isTransparent} opacity={bodyOpacity} />
            </mesh>
            <mesh position={[0, -0.2, 0]} castShadow>
              <boxGeometry args={[0.09, 0.18, 0.09]} />
              <meshStandardMaterial color={roleColor} roughness={0.7} transparent={isTransparent} opacity={bodyOpacity} />
            </mesh>
            <mesh position={[0, -0.32, 0.02]} castShadow>
              <boxGeometry args={[0.1, 0.06, 0.14]} />
              <meshStandardMaterial color={SHOE_COLOR} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
            </mesh>
          </group>
        </>
      )}

      {/* --- Upper body (affected by slouch) --- */}
      <group ref={upperBodyRef}>
        {/* Torso */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[0.3, 0.32, 0.18]} />
          <meshStandardMaterial color={roleColor} roughness={0.7} transparent={isTransparent} opacity={bodyOpacity} />
        </mesh>
        {/* Collar / shirt detail */}
        <mesh position={[0, 0.66, 0.08]} castShadow>
          <boxGeometry args={[0.14, 0.04, 0.04]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} transparent={isTransparent} opacity={bodyOpacity} />
        </mesh>
        {!seated && (
          <>
            {/* Belt */}
            <mesh position={[0, 0.37, 0]} castShadow>
              <boxGeometry args={[0.31, 0.03, 0.19]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} transparent={isTransparent} opacity={bodyOpacity} />
            </mesh>
            {/* Belt buckle */}
            <mesh position={[0, 0.37, 0.1]} castShadow>
              <boxGeometry args={[0.04, 0.03, 0.01]} />
              <meshStandardMaterial color="#c0a060" metalness={0.8} roughness={0.2} transparent={isTransparent} opacity={bodyOpacity} />
            </mesh>
          </>
        )}

        {/* --- Arms --- */}
        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.2, 0.6, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.08, 0]} castShadow>
            <boxGeometry args={[0.09, 0.2, 0.09]} />
            <meshStandardMaterial color={roleColor} roughness={0.7} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          {/* Forearm (skin) */}
          <mesh position={[0, -0.24, 0]} castShadow>
            <boxGeometry args={[0.08, 0.14, 0.08]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.34, 0]} castShadow>
            <boxGeometry args={[0.06, 0.06, 0.04]} />
            <meshStandardMaterial color={SKIN_DARK} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
        </group>
        {/* Right arm */}
        <group ref={rightArmRef} position={[0.2, 0.6, 0]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <boxGeometry args={[0.09, 0.2, 0.09]} />
            <meshStandardMaterial color={roleColor} roughness={0.7} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          <mesh position={[0, -0.24, 0]} castShadow>
            <boxGeometry args={[0.08, 0.14, 0.08]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          <mesh position={[0, -0.34, 0]} castShadow>
            <boxGeometry args={[0.06, 0.06, 0.04]} />
            <meshStandardMaterial color={SKIN_DARK} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
        </group>

        {/* --- Neck --- */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.06, 6]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
        </mesh>

        {/* --- Head --- */}
        <group position={[0, 0.85, 0]}>
          {/* Head base */}
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.2, 0.18]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.04, 0.02, 0.09]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.3} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          <mesh position={[0.04, 0.02, 0.09]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.3} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.01, 0.1]}>
            <boxGeometry args={[0.03, 0.04, 0.03]} />
            <meshStandardMaterial color={SKIN_DARK} roughness={0.6} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          {/* Hair */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.2, 0.06, 0.2]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          {/* Hair sides */}
          <mesh position={[-0.1, 0.04, 0]} castShadow>
            <boxGeometry args={[0.03, 0.12, 0.19]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          <mesh position={[0.1, 0.04, 0]} castShadow>
            <boxGeometry args={[0.03, 0.12, 0.19]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
          {/* Hair back */}
          <mesh position={[0, 0.02, -0.1]} castShadow>
            <boxGeometry args={[0.2, 0.16, 0.03]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} transparent={isTransparent} opacity={bodyOpacity} />
          </mesh>
        </group>

        {/* Role-specific accessory */}
        <RoleAccessory role={member.role} />
      </group>

      {/* Burnout indicator (red aura when high) */}
      {!isFreelance && member.burnout > 60 && (
        <pointLight
          position={[0, 1.2, 0]}
          color="#ef4444"
          intensity={((member.burnout - 60) / 40) * 0.5}
          distance={1.5}
        />
      )}

      {/* Morale indicator (green sparkle when high) */}
      {!isFreelance && member.morale > 80 && (
        <pointLight
          position={[0, 1.3, 0]}
          color="#34d399"
          intensity={0.2}
          distance={1}
        />
      )}

      {/* --- Work progress bar (office employees at desks) --- */}
      {isWorking && !isFreelance && (
        <group position={[0, 1.25, 0]}>
          {/* Background bar */}
          <mesh>
            <boxGeometry args={[0.4, 0.045, 0.015]} />
            <meshStandardMaterial color="#27272a" roughness={0.5} opacity={0.85} transparent />
          </mesh>
          {/* Fill bar */}
          <mesh ref={workFillRef} position={[0, 0, 0.004]}>
            <boxGeometry args={[0.4, 0.035, 0.01]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={0.25}
              roughness={0.3}
            />
          </mesh>
        </group>
      )}

      {/* --- Freelance overlay --- */}
      {isFreelance && (
        <group>
          {/* Laptop on desk */}
          <group position={[0.2, 0.02, 0.15]}>
            {/* Base */}
            <mesh>
              <boxGeometry args={[0.22, 0.015, 0.16]} />
              <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.6} />
            </mesh>
            {/* Screen (tilted) */}
            <mesh position={[0, 0.08, -0.07]} rotation={[-0.3, 0, 0]}>
              <boxGeometry args={[0.2, 0.14, 0.008]} />
              <meshStandardMaterial color="#1e1e2e" emissive="#818cf8" emissiveIntensity={0.4} roughness={0.2} />
            </mesh>
            {/* LED indicator */}
            <mesh ref={laptopLedRef} position={[0, 0.01, 0.06]}>
              <boxGeometry args={[0.02, 0.005, 0.005]} />
              <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
            </mesh>
          </group>

          {/* Floating progress bar above head */}
          <group position={[0, 1.35, 0]}>
            {/* Background bar */}
            <mesh>
              <boxGeometry args={[0.5, 0.06, 0.02]} />
              <meshStandardMaterial color="#27272a" roughness={0.5} opacity={0.9} transparent />
            </mesh>
            {/* Fill bar */}
            <mesh ref={progressFillRef} position={[0, 0, 0.005]}>
              <boxGeometry args={[0.5, 0.045, 0.015]} />
              <meshStandardMaterial
                color={member.freelanceTask?.type === 'outsourcing' ? '#f59e0b' : '#06b6d4'}
                emissive={member.freelanceTask?.type === 'outsourcing' ? '#f59e0b' : '#06b6d4'}
                emissiveIntensity={0.3}
                roughness={0.3}
              />
            </mesh>
            {/* Glow */}
            <pointLight
              position={[0, 0.1, 0.1]}
              color={member.freelanceTask?.type === 'outsourcing' ? '#f59e0b' : '#06b6d4'}
              intensity={0.15}
              distance={1}
            />
          </group>
        </group>
      )}
    </group>
  );
}

// --- Role-specific visual accessories ---
function RoleAccessory({ role }: { role: TeamRole }) {
  switch (role) {
    case 'security':
      return (
        <group>
          {/* Badge on chest */}
          <mesh position={[0.12, 0.6, 0.1]}>
            <boxGeometry args={[0.06, 0.06, 0.01]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Earpiece */}
          <mesh position={[-0.1, 0.88, 0.04]}>
            <boxGeometry args={[0.02, 0.06, 0.02]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
          {/* Sunglasses */}
          <mesh position={[0, 0.87, 0.1]}>
            <boxGeometry args={[0.18, 0.04, 0.01]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.8} />
          </mesh>
        </group>
      );
    case 'manager':
      return (
        <group>
          {/* Clipboard in right hand */}
          <mesh position={[0.22, 0.35, 0.05]}>
            <boxGeometry args={[0.1, 0.14, 0.02]} />
            <meshStandardMaterial color="#d6d3d1" roughness={0.9} />
          </mesh>
          {/* Tie */}
          <mesh position={[0, 0.55, 0.1]}>
            <boxGeometry args={[0.05, 0.18, 0.01]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        </group>
      );
    case 'developer':
      return (
        <group>
          {/* Glasses */}
          <mesh position={[-0.04, 0.87, 0.1]}>
            <torusGeometry args={[0.025, 0.005, 4, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.04, 0.87, 0.1]}>
            <torusGeometry args={[0.025, 0.005, 4, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Bridge */}
          <mesh position={[0, 0.87, 0.1]}>
            <boxGeometry args={[0.03, 0.005, 0.005]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Coffee cup in hand */}
          <mesh position={[-0.22, 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.02, 0.06, 6]} />
            <meshStandardMaterial color="#f5f5f4" roughness={0.5} />
          </mesh>
        </group>
      );
    case 'qa':
      return (
        <group>
          {/* Magnifying glass in hand */}
          <mesh position={[0.24, 0.32, 0.04]}>
            <torusGeometry args={[0.035, 0.005, 4, 8]} />
            <meshStandardMaterial color="#a8a29e" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0.24, 0.26, 0.04]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0.005, 0.005, 0.06, 4]} />
            <meshStandardMaterial color="#78716c" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Checklist badge */}
          <mesh position={[-0.12, 0.58, 0.1]}>
            <boxGeometry args={[0.05, 0.06, 0.01]} />
            <meshStandardMaterial color="#22c55e" roughness={0.5} />
          </mesh>
        </group>
      );
    case 'marketing':
      return (
        <group>
          {/* Phone in hand */}
          <mesh position={[-0.22, 0.35, 0.03]}>
            <boxGeometry args={[0.04, 0.07, 0.01]} />
            <meshStandardMaterial color="#1e293b" emissive="#818cf8" emissiveIntensity={0.3} roughness={0.2} />
          </mesh>
          {/* Headset */}
          <mesh position={[0, 0.96, 0]}>
            <torusGeometry args={[0.1, 0.008, 4, 8]} />
            <meshStandardMaterial color="#333" roughness={0.3} />
          </mesh>
          <mesh position={[-0.1, 0.85, 0.06]}>
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshStandardMaterial color="#333" roughness={0.3} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}
