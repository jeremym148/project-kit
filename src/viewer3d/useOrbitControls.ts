import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface OrbitState {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  theta: number;
  phi: number;
  distance: number;
  target: THREE.Vector3;
}

export function useOrbitControls(
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>,
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>,
  ready: boolean
) {
  const ctrlRef = useRef<OrbitState>({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    theta: Math.PI / 5,
    phi: Math.PI / 5,
    distance: 22,
    target: new THREE.Vector3(7, 0, 6.5),
  });

  useEffect(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer) return;
    const el = renderer.domElement;
    const ctrl = ctrlRef.current;

    const updateCam = () => {
      camera.position.set(
        ctrl.target.x + ctrl.distance * Math.sin(ctrl.phi) * Math.cos(ctrl.theta),
        ctrl.target.y + ctrl.distance * Math.cos(ctrl.phi),
        ctrl.target.z + ctrl.distance * Math.sin(ctrl.phi) * Math.sin(ctrl.theta)
      );
      camera.lookAt(ctrl.target);
    };
    updateCam();

    const onDown = (e: MouseEvent) => {
      ctrl.isDragging = true;
      ctrl.lastX = e.clientX;
      ctrl.lastY = e.clientY;
    };

    const onMove = (e: MouseEvent) => {
      if (!ctrl.isDragging) return;
      const dx = e.clientX - ctrl.lastX;
      const dy = e.clientY - ctrl.lastY;

      if (e.shiftKey) {
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.getWorldDirection(up);
        right.crossVectors(up, camera.up).normalize();
        up.copy(camera.up).normalize();
        ctrl.target.add(right.multiplyScalar(-dx * 0.02));
        ctrl.target.add(up.multiplyScalar(dy * 0.02));
      } else {
        ctrl.theta -= dx * 0.005;
        ctrl.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.05, ctrl.phi + dy * 0.005)
        );
      }

      ctrl.lastX = e.clientX;
      ctrl.lastY = e.clientY;
      updateCam();
    };

    const onUp = () => {
      ctrl.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      ctrl.distance = Math.max(3, Math.min(45, ctrl.distance + e.deltaY * 0.01));
      updateCam();
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('wheel', onWheel);

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [cameraRef, rendererRef, ready]);
}
