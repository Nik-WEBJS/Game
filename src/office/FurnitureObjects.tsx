'use client';

import { useRef, useState, useCallback } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { FurnitureItem, FurnitureType } from '@/game/types';
import { startPlacement } from './furnitureState';

// Grid constants — shared with PlacementGrid
export const GRID_CELL = 1; // 1 unit per cell
export const GRID_ORIGIN: [number, number] = [-4, -3]; // world x,z of grid [0,0]

// Convert grid position to world position (center of the item)
export function gridToWorld(gx: number, gz: number, sizeX: number, sizeZ: number): [number, number, number] {
  const wx = GRID_ORIGIN[0] + gx * GRID_CELL + (sizeX * GRID_CELL) / 2;
  const wz = GRID_ORIGIN[1] + gz * GRID_CELL + (sizeZ * GRID_CELL) / 2;
  return [wx, 0, wz];
}

// =====================================================
// Detailed 3D furniture meshes
// =====================================================

function DeskMesh() {
  return (
    <group>
      {/* Desk surface — wooden top with rounded edge feel */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.04, 0.55]} />
        <meshStandardMaterial color="#a0845c" roughness={0.5} />
      </mesh>
      {/* Desk edge trim */}
      <mesh position={[0, 0.42, 0.275]}>
        <boxGeometry args={[0.85, 0.02, 0.02]} />
        <meshStandardMaterial color="#8b7040" roughness={0.4} />
      </mesh>
      {/* Metal frame legs — L-shaped */}
      {[[-0.38, -0.22], [0.38, -0.22], [-0.38, 0.22], [0.38, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.21, z]} castShadow>
          <boxGeometry args={[0.03, 0.42, 0.03]} />
          <meshStandardMaterial color="#71717a" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      {/* Cross-bar under desk */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.76, 0.02, 0.02]} />
        <meshStandardMaterial color="#71717a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Monitor */}
      <group position={[0, 0.46, -0.12]}>
        {/* Screen bezel */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.38, 0.26, 0.015]} />
          <meshStandardMaterial color="#18181b" roughness={0.2} />
        </mesh>
        {/* Screen display */}
        <mesh position={[0, 0.2, 0.008]}>
          <boxGeometry args={[0.34, 0.22, 0.002]} />
          <meshStandardMaterial color="#0f172a" emissive="#60a5fa" emissiveIntensity={0.2} roughness={0.1} />
        </mesh>
        {/* Monitor stand neck */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.03, 0.1, 0.03]} />
          <meshStandardMaterial color="#52525b" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Monitor stand base */}
        <mesh position={[0, 0.0, 0.02]}>
          <boxGeometry args={[0.14, 0.01, 0.1]} />
          <meshStandardMaterial color="#52525b" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Keyboard */}
      <mesh position={[0, 0.465, 0.08]}>
        <boxGeometry args={[0.28, 0.01, 0.09]} />
        <meshStandardMaterial color="#27272a" roughness={0.4} />
      </mesh>
      {/* Keyboard keys (subtle detail) */}
      <mesh position={[0, 0.472, 0.08]}>
        <boxGeometry args={[0.26, 0.003, 0.07]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.5} />
      </mesh>

      {/* Mouse */}
      <mesh position={[0.22, 0.465, 0.1]}>
        <boxGeometry args={[0.04, 0.015, 0.06]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} />
      </mesh>

      {/* Mouse pad */}
      <mesh position={[0.22, 0.46, 0.1]}>
        <boxGeometry args={[0.08, 0.003, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Desk lamp */}
      <group position={[-0.32, 0.46, -0.15]}>
        {/* Base */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.02, 8]} />
          <meshStandardMaterial color="#52525b" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Arm */}
        <mesh position={[0, 0.15, 0]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.26, 4]} />
          <meshStandardMaterial color="#71717a" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Shade */}
        <mesh position={[0.02, 0.27, 0.03]}>
          <coneGeometry args={[0.04, 0.05, 6]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.5} />
        </mesh>
        <pointLight position={[0.02, 0.24, 0.03]} color="#fef3c7" intensity={0.15} distance={1} />
      </group>

      {/* Pen holder */}
      <group position={[0.32, 0.46, -0.1]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.06, 6]} />
          <meshStandardMaterial color="#44403c" roughness={0.6} />
        </mesh>
        {/* Pens */}
        <mesh position={[0.005, 0.07, 0]} rotation={[0.05, 0, 0.1]}>
          <cylinderGeometry args={[0.003, 0.003, 0.06, 4]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.5} />
        </mesh>
        <mesh position={[-0.005, 0.07, 0]} rotation={[-0.05, 0, -0.08]}>
          <cylinderGeometry args={[0.003, 0.003, 0.06, 4]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
      </group>

      {/* Small drawer unit under desk */}
      <group position={[0.25, 0.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.25, 0.3, 0.4]} />
          <meshStandardMaterial color="#d4d4d8" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Drawer handles */}
        {[0.08, -0.02, -0.12].map((y, i) => (
          <mesh key={i} position={[0, y, 0.21]}>
            <boxGeometry args={[0.06, 0.01, 0.01]} />
            <meshStandardMaterial color="#a1a1aa" roughness={0.3} metalness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function MeetingRoomMesh() {
  return (
    <group>
      {/* Large oval-ish table */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.05, 0.9]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.5} />
      </mesh>
      {/* Table edge trim */}
      <mesh position={[0, 0.40, 0]}>
        <boxGeometry args={[1.52, 0.02, 0.92]} />
        <meshStandardMaterial color="#4a2f20" roughness={0.4} />
      </mesh>
      {/* Central table pedestal */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.38, 8]} />
        <meshStandardMaterial color="#71717a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 8]} />
        <meshStandardMaterial color="#52525b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 6 Office chairs around the table */}
      {[
        [-0.55, -0.55, 0], [0.55, -0.55, Math.PI],
        [-0.55, 0.55, 0], [0.55, 0.55, Math.PI],
        [0, -0.6, Math.PI / 2], [0, 0.6, -Math.PI / 2],
      ].map(([x, z, rot], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, rot, 0]}>
          {/* Seat */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.22, 0.03, 0.22]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          {/* Seat cushion */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.2, 0.02, 0.2]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          {/* Backrest */}
          <mesh position={[0, 0.44, -0.1]} castShadow>
            <boxGeometry args={[0.2, 0.26, 0.03]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          {/* Backrest cushion */}
          <mesh position={[0, 0.44, -0.08]}>
            <boxGeometry args={[0.18, 0.22, 0.02]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          {/* Chair stem */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.26, 4]} />
            <meshStandardMaterial color="#71717a" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Chair base star (5 legs) */}
          {[0, 1.26, 2.51, 3.77, 5.03].map((angle, j) => (
            <mesh key={j} position={[Math.sin(angle) * 0.08, 0.02, Math.cos(angle) * 0.08]} rotation={[0, angle, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 0.16, 3]} />
              <meshStandardMaterial color="#52525b" roughness={0.3} metalness={0.6} />
            </mesh>
          ))}
          {/* Armrests */}
          <mesh position={[-0.12, 0.38, -0.02]}>
            <boxGeometry args={[0.02, 0.02, 0.14]} />
            <meshStandardMaterial color="#52525b" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0.12, 0.38, -0.02]}>
            <boxGeometry args={[0.02, 0.02, 0.14]} />
            <meshStandardMaterial color="#52525b" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Whiteboard on invisible wall */}
      <group position={[0, 0.5, -0.55]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.5, 0.02]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        {/* Frame */}
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[0.84, 0.54, 0.01]} />
          <meshStandardMaterial color="#a1a1aa" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Marker tray */}
        <mesh position={[0, -0.28, 0.02]}>
          <boxGeometry args={[0.3, 0.02, 0.03]} />
          <meshStandardMaterial color="#a1a1aa" roughness={0.3} metalness={0.4} />
        </mesh>
      </group>

      {/* Table center decoration — small plant */}
      <group position={[0, 0.45, 0]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.03, 0.025, 0.04, 6]} />
          <meshStandardMaterial color="#78716c" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.035, 5, 5]} />
          <meshStandardMaterial color="#22c55e" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function ServerRoomMesh() {
  return (
    <group>
      {/* Main server rack */}
      <group position={[-0.2, 0, 0]}>
        {/* Rack frame */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.45, 1.2, 0.4]} />
          <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Front panel */}
        <mesh position={[0, 0.6, 0.2]}>
          <boxGeometry args={[0.43, 1.18, 0.01]} />
          <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Server blades (horizontal slots) */}
        {[0.2, 0.35, 0.5, 0.65, 0.8, 0.95].map((y, i) => (
          <group key={i}>
            <mesh position={[0, y, 0.21]}>
              <boxGeometry args={[0.38, 0.1, 0.005]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.4} />
            </mesh>
            {/* LED indicators per blade */}
            <mesh position={[0.17, y, 0.215]}>
              <boxGeometry args={[0.01, 0.01, 0.005]} />
              <meshStandardMaterial color={i % 3 === 0 ? '#f59e0b' : '#22c55e'} emissive={i % 3 === 0 ? '#f59e0b' : '#22c55e'} emissiveIntensity={0.9} />
            </mesh>
            <mesh position={[0.15, y, 0.215]}>
              <boxGeometry args={[0.01, 0.01, 0.005]} />
              <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.7} />
            </mesh>
          </group>
        ))}
        {/* Ventilation grille on top */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.43, 0.01, 0.38]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>

      {/* Second rack */}
      <group position={[0.3, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.4, 1.0, 0.35]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.5, 0.175]}>
          <boxGeometry args={[0.38, 0.98, 0.01]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
        </mesh>
        {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
          <mesh key={i} position={[0.16, y, 0.185]}>
            <boxGeometry args={[0.01, 0.01, 0.005]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>

      {/* Cable bundle between racks */}
      <mesh position={[0.05, 0.9, -0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#1e40af" roughness={0.6} />
      </mesh>
      <mesh position={[0.05, 0.7, -0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>

      {/* Ambient server glow */}
      <pointLight position={[0, 0.6, 0.3]} color="#22c55e" intensity={0.15} distance={2} />
    </group>
  );
}

function LoungeMesh() {
  return (
    <group>
      {/* L-shaped sofa — main section */}
      <group position={[-0.15, 0, 0]}>
        {/* Seat base */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.9, 0.18, 0.45]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.75} />
        </mesh>
        {/* Seat cushion */}
        <mesh position={[0, 0.26, 0.02]}>
          <boxGeometry args={[0.85, 0.04, 0.4]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.8} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.38, -0.2]} castShadow>
          <boxGeometry args={[0.9, 0.28, 0.08]} />
          <meshStandardMaterial color="#6d28d9" roughness={0.75} />
        </mesh>
        {/* Backrest cushion */}
        <mesh position={[0, 0.38, -0.15]}>
          <boxGeometry args={[0.85, 0.22, 0.04]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.8} />
        </mesh>
        {/* Left armrest */}
        <mesh position={[-0.47, 0.28, 0]} castShadow>
          <boxGeometry args={[0.06, 0.14, 0.45]} />
          <meshStandardMaterial color="#6d28d9" roughness={0.75} />
        </mesh>
      </group>

      {/* L-extension */}
      <group position={[0.4, 0, -0.1]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.35, 0.18, 0.35]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[0.32, 0.04, 0.32]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.8} />
        </mesh>
      </group>

      {/* Throw pillow */}
      <mesh position={[-0.25, 0.32, -0.08]} rotation={[0.2, 0.3, 0.1]}>
        <boxGeometry args={[0.12, 0.12, 0.04]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.8} />
      </mesh>

      {/* Round coffee table */}
      <group position={[0, 0, 0.45]}>
        {/* Table top */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.03, 12]} />
          <meshStandardMaterial color="#78716c" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Table leg */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.2, 6]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Coffee cup on table */}
        <mesh position={[0.06, 0.26, 0.02]}>
          <cylinderGeometry args={[0.02, 0.018, 0.04, 6]} />
          <meshStandardMaterial color="#f5f5f4" roughness={0.5} />
        </mesh>
        {/* Magazine */}
        <mesh position={[-0.05, 0.245, -0.03]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.08, 0.005, 0.1]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.6} />
        </mesh>
      </group>

      {/* Small potted plant */}
      <group position={[0.5, 0, 0.35]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.04, 0.035, 0.12, 6]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.06, 5, 5]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>
        <mesh position={[0.03, 0.2, 0.01]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial color="#22c55e" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function StageMesh() {
  return (
    <group>
      {/* Platform — layered for depth */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.1, 1.2]} />
        <meshStandardMaterial color="#1c1917" roughness={0.4} />
      </mesh>
      {/* Platform top surface */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[1.58, 0.02, 1.18]} />
        <meshStandardMaterial color="#292524" roughness={0.5} />
      </mesh>
      {/* Platform edge strip (gold) */}
      <mesh position={[0, 0.06, 0.6]}>
        <boxGeometry args={[1.6, 0.04, 0.02]} />
        <meshStandardMaterial color="#b45309" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Podium */}
      <group position={[0, 0.12, -0.25]}>
        {/* Podium body */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.3, 0.5, 0.22]} />
          <meshStandardMaterial color="#44403c" roughness={0.5} />
        </mesh>
        {/* Podium top surface (angled) */}
        <mesh position={[0, 0.51, 0.02]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.28, 0.02, 0.2]} />
          <meshStandardMaterial color="#57534e" roughness={0.4} />
        </mesh>
        {/* Podium logo/emblem */}
        <mesh position={[0, 0.3, 0.115]}>
          <boxGeometry args={[0.1, 0.1, 0.005]} />
          <meshStandardMaterial color="#b45309" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Microphone */}
        <group position={[0.08, 0.52, 0.08]}>
          <mesh position={[0, 0.08, 0]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.16, 4]} />
            <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.17, 0.02]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} metalness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Presentation screen behind */}
      <group position={[0, 0.12, -0.5]}>
        {/* Screen frame */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.0, 0.6, 0.02]} />
          <meshStandardMaterial color="#18181b" roughness={0.2} />
        </mesh>
        {/* Screen display */}
        <mesh position={[0, 0.55, 0.011]}>
          <boxGeometry args={[0.94, 0.54, 0.002]} />
          <meshStandardMaterial color="#0c0a09" emissive="#3b82f6" emissiveIntensity={0.12} roughness={0.1} />
        </mesh>
        {/* Screen stand */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.3, 6]} />
          <meshStandardMaterial color="#52525b" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Spotlights */}
      <pointLight position={[-0.5, 1.8, 0.3]} color="#fbbf24" intensity={0.3} distance={4} />
      <pointLight position={[0.5, 1.8, 0.3]} color="#fbbf24" intensity={0.3} distance={4} />
      {/* Spot light housings */}
      <mesh position={[-0.5, 1.8, 0.3]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0.5, 1.8, 0.3]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

const MESH_MAP: Record<FurnitureType, React.FC> = {
  desk: DeskMesh,
  meeting_room: MeetingRoomMesh,
  server_room: ServerRoomMesh,
  lounge: LoungeMesh,
  stage: StageMesh,
};

interface FurnitureObject3DProps {
  item: FurnitureItem;
}

export function FurnitureObject3D({ item }: FurnitureObject3DProps) {
  const [hovered, setHovered] = useState(false);
  const Mesh = MESH_MAP[item.type];
  if (!item.position) return null;

  const [wx, wy, wz] = gridToWorld(item.position[0], item.position[1], item.gridSize[0], item.gridSize[1]);

  return (
    <group
      position={[wx, wy, wz]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        // Click on placed furniture → enter move mode
        startPlacement(item.id);
      }}
    >
      <Mesh />
      {/* Hover highlight */}
      {hovered && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[item.gridSize[0] * GRID_CELL, item.gridSize[1] * GRID_CELL]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}
