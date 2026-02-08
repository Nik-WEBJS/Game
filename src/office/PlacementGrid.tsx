'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { FurnitureItem } from '@/game/types';
import { GRID_CELL, GRID_ORIGIN, gridToWorld } from './FurnitureObjects';
import { furniturePlacement, cancelPlacement, subscribePlacement } from './furnitureState';

export const GRID_COLS = 8;
export const GRID_ROWS = 6;

interface PlacementGridProps {
  furniture: FurnitureItem[];
  onPlace: (furnitureId: string, position: [number, number]) => void;
}

function isCellOccupied(
  col: number,
  row: number,
  furniture: FurnitureItem[],
  excludeId?: string
): boolean {
  for (const f of furniture) {
    if (!f.position || f.id === excludeId) continue;
    const [fx, fz] = f.position;
    const [sw, sd] = f.gridSize;
    if (col >= fx && col < fx + sw && row >= fz && row < fz + sd) return true;
  }
  return false;
}

function canPlace(
  col: number,
  row: number,
  sizeX: number,
  sizeZ: number,
  furniture: FurnitureItem[],
  excludeId?: string
): boolean {
  for (let dx = 0; dx < sizeX; dx++) {
    for (let dz = 0; dz < sizeZ; dz++) {
      const cx = col + dx;
      const cz = row + dz;
      if (cx >= GRID_COLS || cz >= GRID_ROWS) return false;
      if (isCellOccupied(cx, cz, furniture, excludeId)) return false;
    }
  }
  return true;
}

export function PlacementGrid({ furniture, onPlace }: PlacementGridProps) {
  const [placementActive, setPlacementActive] = useState(furniturePlacement.active);
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);

  // Subscribe to placement state changes
  useEffect(() => {
    return subscribePlacement(() => {
      setPlacementActive(furniturePlacement.active);
    });
  }, []);

  // Get the selected furniture item
  const selectedItem = useMemo(() => {
    if (!placementActive || !furniturePlacement.selectedId) return null;
    return furniture.find(f => f.id === furniturePlacement.selectedId) ?? null;
  }, [placementActive, furniture]);

  const handleCellClick = useCallback((col: number, row: number) => {
    if (!selectedItem) return;
    const [sx, sz] = selectedItem.gridSize;
    if (!canPlace(col, row, sx, sz, furniture, selectedItem.id)) return;
    onPlace(selectedItem.id, [col, row]);
    cancelPlacement();
  }, [selectedItem, furniture, onPlace]);

  if (!placementActive) {
    // Show subtle grid lines always (very faint)
    return (
      <group>
        {Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
          const col = i % GRID_COLS;
          const row = Math.floor(i / GRID_COLS);
          const wx = GRID_ORIGIN[0] + col * GRID_CELL + GRID_CELL / 2;
          const wz = GRID_ORIGIN[1] + row * GRID_CELL + GRID_CELL / 2;
          return (
            <mesh key={i} position={[wx, 0.005, wz]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[GRID_CELL * 0.95, GRID_CELL * 0.95]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.02} />
            </mesh>
          );
        })}
      </group>
    );
  }

  // Active placement mode — show interactive grid
  const sizeX = selectedItem?.gridSize[0] ?? 1;
  const sizeZ = selectedItem?.gridSize[1] ?? 1;

  return (
    <group>
      {Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const wx = GRID_ORIGIN[0] + col * GRID_CELL + GRID_CELL / 2;
        const wz = GRID_ORIGIN[1] + row * GRID_CELL + GRID_CELL / 2;
        const occupied = isCellOccupied(col, row, furniture, selectedItem?.id);

        const isHovered = hoveredCell !== null &&
          col >= hoveredCell[0] && col < hoveredCell[0] + sizeX &&
          row >= hoveredCell[1] && row < hoveredCell[1] + sizeZ;

        const canPlaceHere = hoveredCell !== null &&
          canPlace(hoveredCell[0], hoveredCell[1], sizeX, sizeZ, furniture, selectedItem?.id);

        let color = '#94a3b8';
        let opacity = 0.08;

        if (occupied) {
          color = '#ef4444';
          opacity = 0.12;
        } else if (isHovered) {
          color = canPlaceHere ? '#22c55e' : '#ef4444';
          opacity = 0.3;
        }

        return (
          <mesh
            key={i}
            position={[wx, 0.01, wz]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHoveredCell([col, row]);
            }}
            onPointerOut={() => setHoveredCell(null)}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              handleCellClick(col, row);
            }}
          >
            <planeGeometry args={[GRID_CELL * 0.95, GRID_CELL * 0.95]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}
