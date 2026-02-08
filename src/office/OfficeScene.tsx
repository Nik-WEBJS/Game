'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '@/game/store';
import { OfficeModel } from './OfficeModel';
import { Employee } from './Employee';
import { CameraController, cameraInput, DRAG_SPEED } from './CameraController';
import {
  getISOVisualState,
  getActiveZones,
  getEmployeePosition,
  getRiskVisualIntensity,
  getProfitGlow,
  getBurnoutVisual,
} from './mappings';

const DEFAULT_CAM: [number, number, number] = [8, 8, 8];

const CODE_MAP: Record<string, string> = {
  KeyW: 'w',
  KeyA: 'a',
  KeyS: 's',
  KeyD: 'd',
  Space: ' ',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
};

export function OfficeScene() {
  const { business } = useGameStore();
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const isoState = getISOVisualState(business.isoStandards);
  const activeZones = getActiveZones(business.team.length);
  const riskIntensity = getRiskVisualIntensity(business.metrics.risk);
  const profitGlow = getProfitGlow(business.metrics.profit);

  const visibleEmployees = business.team.filter(
    (m) => getBurnoutVisual(m.burnout) !== 'removed'
  );

  // Sync active flag to shared mutable object
  useEffect(() => {
    cameraInput.active = active;
    if (!active) {
      cameraInput.keys.clear();
    }
  }, [active]);

  // Keyboard: attach to window when active
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        cameraInput.keys.clear();
        setActive(false);
        return;
      }
      const mapped = CODE_MAP[e.code];
      if (mapped) {
        e.preventDefault();
        e.stopPropagation();
        cameraInput.keys.add(mapped);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const mapped = CODE_MAP[e.code];
      if (mapped) cameraInput.keys.delete(mapped);
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      cameraInput.keys.clear();
    };
  }, [active]);

  // Mouse drag for look-around: attach to container
  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      cameraInput.euler.y -= dx * DRAG_SPEED;
      cameraInput.euler.x -= dy * DRAG_SPEED;
      cameraInput.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, cameraInput.euler.x));
    };
    const onUp = () => {
      dragging.current = false;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      dragging.current = false;
    };
  }, [active]);

  // Click outside to deactivate
  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [active]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-[320px] rounded-xl overflow-hidden border bg-zinc-900/50 relative transition-colors group ${
        active
          ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
          : 'border-zinc-700/50 hover:border-zinc-600/60 cursor-pointer'
      }`}
      onClick={() => { if (!active) setActive(true); }}
      tabIndex={0}
    >
      {/* Hint overlay */}
      {!active && (
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
          <span className="text-xs text-zinc-300 bg-zinc-800/90 px-3 py-1.5 rounded-lg border border-zinc-600/50">
            Click to explore · WASD move · Drag to look · ESC exit
          </span>
        </div>
      )}
      {active && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="text-[10px] text-emerald-400 bg-zinc-900/90 px-2 py-1 rounded border border-emerald-500/30">
            WASD move · Drag look · Space↑ Shift↓ · ESC exit
          </span>
        </div>
      )}

      <Canvas
        shadows
        camera={{
          position: DEFAULT_CAM,
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <Suspense fallback={null}>
          <CameraController />

          {/* Lighting */}
          <ambientLight intensity={0.3} color="#94a3b8" />
          <directionalLight
            position={[5, 8, 5]}
            intensity={0.6}
            color="#e2e8f0"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight
            position={[-3, 5, -3]}
            intensity={0.2}
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

          {/* Employees */}
          {visibleEmployees.map((member, index) => (
            <Employee
              key={member.id}
              member={member}
              position={getEmployeePosition(index)}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
