'use client';

import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MOVE_SPEED = 5;
const DRAG_SPEED = 0.008;

// Shared mutable state — written by OfficeScene DOM handlers, read by useFrame
export const cameraInput = {
  active: false,
  keys: new Set<string>(),
  euler: new THREE.Euler(0, 0, 0, 'YXZ'),
  needsInit: true,
};

export function CameraController() {
  const { camera } = useThree();
  const lastActive = useRef(false);

  useFrame((_, delta) => {
    if (!cameraInput.active) {
      lastActive.current = false;
      return;
    }

    // Init euler from camera on first active frame
    if (!lastActive.current) {
      cameraInput.euler.setFromQuaternion(camera.quaternion, 'YXZ');
      lastActive.current = true;
    }

    // Apply look rotation
    camera.quaternion.setFromEuler(cameraInput.euler);

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const speed = MOVE_SPEED * delta;
    const k = cameraInput.keys;

    if (k.has('w')) camera.position.addScaledVector(forward, speed);
    if (k.has('s')) camera.position.addScaledVector(forward, -speed);
    if (k.has('a')) camera.position.addScaledVector(right, -speed);
    if (k.has('d')) camera.position.addScaledVector(right, speed);
    if (k.has(' ')) camera.position.y += speed;
    if (k.has('shift')) camera.position.y -= speed;
  });

  return null;
}

export { DRAG_SPEED };
