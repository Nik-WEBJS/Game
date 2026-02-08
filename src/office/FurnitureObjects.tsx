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

// 3D mesh for each furniture type
function DeskMesh() {
  return (
    <group>
      {/* Table top */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, 0.5]} />
        <meshStandardMaterial color="#8B7355" roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[[-0.35, 0, -0.2], [0.35, 0, -0.2], [-0.35, 0, 0.2], [0.35, 0, 0.2]].map((pos, i) => (
        <mesh key={i} position={[pos[0], 0.22, pos[2]]} castShadow>
          <boxGeometry args={[0.04, 0.44, 0.04]} />
          <meshStandardMaterial color="#5C4033" roughness={0.8} />
        </mesh>
      ))}
      {/* Monitor */}
      <mesh position={[0, 0.62, -0.1]} castShadow>
        <boxGeometry args={[0.35, 0.25, 0.02]} />
        <meshStandardMaterial color="#1e293b" emissive="#3b82f6" emissiveIntensity={0.15} roughness={0.3} />
      </mesh>
    </group>
  );
}

function MeetingRoomMesh() {
  return (
    <group>
      {/* Large table */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.6, 0.06, 1.0]} />
        <meshStandardMaterial color="#4a3728" roughness={0.6} />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.4, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.7} />
      </mesh>
      {/* Chairs */}
      {[[-0.6, 0, -0.6], [0.6, 0, -0.6], [-0.6, 0, 0.6], [0.6, 0, 0.6]].map((pos, i) => (
        <group key={i} position={[pos[0], 0, pos[2]]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.25, 0.04, 0.25]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.24, 6]} />
            <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ServerRoomMesh() {
  return (
    <group>
      {/* Server rack */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.5, 1.2, 0.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* LED strips */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((y, i) => (
        <mesh key={i} position={[0.26, y, 0]}>
          <boxGeometry args={[0.01, 0.02, 0.06]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Second rack */}
      <mesh position={[0.7, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 1.0, 0.35]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

function LoungeMesh() {
  return (
    <group>
      {/* Sofa base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.2, 0.25, 0.5]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.8} />
      </mesh>
      {/* Sofa back */}
      <mesh position={[0, 0.4, -0.2]} castShadow>
        <boxGeometry args={[1.2, 0.3, 0.1]} />
        <meshStandardMaterial color="#6d28d9" roughness={0.8} />
      </mesh>
      {/* Coffee table */}
      <mesh position={[0, 0.18, 0.45]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.3]} />
        <meshStandardMaterial color="#78716c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.09, 0.45]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.18, 6]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
}

function StageMesh() {
  return (
    <group>
      {/* Platform */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.6, 0.2, 1.2]} />
        <meshStandardMaterial color="#292524" roughness={0.5} />
      </mesh>
      {/* Podium */}
      <mesh position={[0, 0.45, -0.3]} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.25]} />
        <meshStandardMaterial color="#44403c" roughness={0.6} />
      </mesh>
      {/* Spotlight */}
      <pointLight position={[0, 1.5, 0]} color="#fbbf24" intensity={0.4} distance={4} />
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
