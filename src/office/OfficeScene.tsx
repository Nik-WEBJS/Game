'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGameStore } from '@/game/store';
import { OfficeModel } from './OfficeModel';
import { CompanySign } from './CompanySign';
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

const ZOOM_MIN = 25;
const ZOOM_MAX = 120;
const ZOOM_SPEED = 5;

// Static camera that looks at the office from a fixed isometric angle, with scroll zoom
function StaticCamera() {
  const { camera, gl } = useThree();
  const zoomRef = useRef(55);

  useEffect(() => {
    camera.position.set(...ISO_CAM);
    camera.lookAt(...ISO_TARGET);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
      zoomRef.current = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomRef.current + delta));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [gl]);

  useFrame(() => {
    if (camera.zoom !== zoomRef.current) {
      camera.zoom += (zoomRef.current - camera.zoom) * 0.15;
      camera.updateProjectionMatrix();
    }
  });

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
    <div className="w-full h-full overflow-hidden relative">
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
        style={{ background: '#c8d6e5' }}
      >
        <Suspense fallback={null}>
          <StaticCamera />

          {/* Lighting — bright daylight */}
          <ambientLight intensity={0.7} color="#ffffff" />
          <hemisphereLight args={['#87ceeb', '#b0c4a8', 0.5]} />
          <directionalLight
            position={[10, 15, 8]}
            intensity={1.2}
            color="#fff5e6"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
          />
          <directionalLight
            position={[-6, 8, -4]}
            intensity={0.4}
            color="#e0e7ff"
          />

          {/* Office structure */}
          <OfficeModel
            activeZones={activeZones}
            technologies={business.technologies}
            isoState={isoState}
            riskIntensity={riskIntensity}
            profitGlow={profitGlow}
          />

          {/* Company sign on back wall */}
          <CompanySign
            companyName={business.companyName}
            logoId={business.logoId}
            wallZ={-(8 + activeZones * 1.5) / 2}
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
