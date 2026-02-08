'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGameStore } from '@/game/store';
import { OfficeModel } from './OfficeModel';
import { CompanySign } from './CompanySign';
import { Employee } from './Employee';
import { FurnitureObject3D, gridToWorld, getGridDimensions } from './FurnitureObjects';
import { PlacementGrid } from './PlacementGrid';
import {
  getISOVisualState,
  getEmployeePosition,
  getRiskVisualIntensity,
  getProfitGlow,
  getBurnoutVisual,
} from './mappings';
import { OFFICE_LEVELS } from '@/game/types';

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
  const levelDef = OFFICE_LEVELS.find(l => l.level === business.office.level) ?? OFFICE_LEVELS[0];
  const riskIntensity = getRiskVisualIntensity(business.metrics.risk);
  const profitGlow = getProfitGlow(business.metrics.profit);
  const grid = getGridDimensions(levelDef.floorWidth, levelDef.floorDepth);

  const visibleEmployees = business.team.filter(
    (m) => getBurnoutVisual(m.burnout) !== 'removed' && m.status !== 'freelance'
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
            officeLevel={business.office.level}
            wallMaterials={business.office.wallMaterials}
            technologies={business.technologies}
            isoState={isoState}
            riskIntensity={riskIntensity}
            profitGlow={profitGlow}
          />

          {/* Company sign on back wall */}
          <CompanySign
            companyName={business.companyName}
            logoId={business.logoId}
            wallZ={-levelDef.floorDepth / 2}
          />

          {/* Placement grid */}
          <PlacementGrid
            furniture={business.furniture}
            onPlace={(fId, pos) => placeFurniture(fId, pos)}
            gridCols={grid.cols}
            gridRows={grid.rows}
            gridOrigin={grid.origin}
          />

          {/* Placed furniture */}
          {business.furniture.filter(f => f.position).map(f => (
            <FurnitureObject3D key={f.id} item={f} gridOrigin={grid.origin} />
          ))}

          {/* Employees — positioned at assigned desk or fallback grid */}
          {visibleEmployees.map((member, index) => {
            const desk = member.deskId
              ? business.furniture.find(f => f.id === member.deskId && f.position)
              : null;
            const pos: [number, number, number] = desk && desk.position
              ? gridToWorld(desk.position[0], desk.position[1], desk.gridSize[0], desk.gridSize[1], grid.origin)
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
