'use client';

import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGameStore } from '@/game/store';
import { OfficeModel } from './OfficeModel';
import { Employee } from './Employee';
import { FurnitureObject3D, gridToWorld } from './FurnitureObjects';
import { PlacementGrid } from './PlacementGrid';
import {
  getISOVisualState,
  getActiveZones,
  getEmployeePosition,
  getRiskVisualIntensity,
  getProfitGlow,
  getBurnoutVisual,
} from './mappings';

// Fixed isometric camera position (Game Dev Tycoon style — top-down angled)
const ISO_CAM: [number, number, number] = [10, 10, 10];
const ISO_TARGET: [number, number, number] = [0, 0, 0];

// Static camera that looks at the office from a fixed isometric angle
function StaticCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...ISO_CAM);
    camera.lookAt(...ISO_TARGET);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

export function OfficeScene() {
  const { business, placeFurniture } = useGameStore();

  const isoState = getISOVisualState(business.isoStandards);
  const activeZones = getActiveZones(business.team.length);
  const riskIntensity = getRiskVisualIntensity(business.metrics.risk);
  const profitGlow = getProfitGlow(business.metrics.profit);

  const visibleEmployees = business.team.filter(
    (m) => getBurnoutVisual(m.burnout) !== 'removed'
  );

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-900/50 relative">
      <Canvas
        shadows
        orthographic
        camera={{
          position: ISO_CAM,
          zoom: 55,
          near: 0.1,
          far: 200,
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <Suspense fallback={null}>
          <StaticCamera />

          {/* Lighting */}
          <ambientLight intensity={0.35} color="#94a3b8" />
          <directionalLight
            position={[8, 12, 8]}
            intensity={0.7}
            color="#e2e8f0"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
          />
          <directionalLight
            position={[-4, 6, -4]}
            intensity={0.15}
            color="#818cf8"
          />

          {/* Office structure */}
          <OfficeModel
            activeZones={activeZones}
            technologies={business.technologies}
            isoState={isoState}
            riskIntensity={riskIntensity}
            profitGlow={profitGlow}
          />

          {/* Placement grid */}
          <PlacementGrid
            furniture={business.furniture}
            onPlace={(fId, pos) => placeFurniture(fId, pos)}
          />

          {/* Placed furniture */}
          {business.furniture.filter(f => f.position).map(f => (
            <FurnitureObject3D key={f.id} item={f} />
          ))}

          {/* Employees — positioned at assigned desk or fallback grid */}
          {visibleEmployees.map((member, index) => {
            const desk = member.deskId
              ? business.furniture.find(f => f.id === member.deskId && f.position)
              : null;
            const pos: [number, number, number] = desk && desk.position
              ? gridToWorld(desk.position[0], desk.position[1], desk.gridSize[0], desk.gridSize[1])
              : getEmployeePosition(index);
            return (
              <Employee
                key={member.id}
                member={member}
                position={pos}
              />
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
}
