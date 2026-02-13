import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFloorPlan } from '../store/useFloorPlan';
import { useEditor } from '../store/useEditor';
import { useOrbitControls } from './useOrbitControls';
import { updateScene } from './SceneUpdater';
import { updateDiffScene } from './DiffSceneUpdater';
import { groundMaterial } from './builders/materials';
import { colors } from '../styles/theme';
import type { FloorPlan, FloorPlanDiff } from '../types';

interface Scene3DProps {
  dataOverride?: FloorPlan;
  diffOverlay?: { baselineData: FloorPlan; diff: FloorPlanDiff } | null;
}

export function Scene3D({ dataOverride, diffOverlay }: Scene3DProps = {}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>(0);
  const [ready, setReady] = useState(false);

  const storeData = useFloorPlan((s) => s.data);
  const showCeiling = useEditor((s) => s.showCeiling);

  const data = dataOverride ?? storeData;

  useOrbitControls(cameraRef, rendererRef, ready);

  // Initialize scene once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.bgCanvas);
    scene.fog = new THREE.Fog(colors.bgCanvas, 30, 60);

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    setReady(true);

    // Lighting
    scene.add(new THREE.AmbientLight('#b8c4d8', 0.6));

    const sun = new THREE.DirectionalLight('#ffe4c4', 1.4);
    sun.position.set(10, 15, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const fill = new THREE.DirectionalLight('#8090c0', 0.4);
    fill.position.set(-8, 10, -5);
    scene.add(fill);

    scene.add(new THREE.HemisphereLight('#87ceeb', '#3a2a1a', 0.3));

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const ground = new THREE.Mesh(groundGeo, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Camera initial position
    const ctrl = {
      theta: Math.PI / 5,
      phi: Math.PI / 5,
      distance: 22,
      target: new THREE.Vector3(7, 0, 6.5),
    };
    camera.position.set(
      ctrl.target.x + ctrl.distance * Math.sin(ctrl.phi) * Math.cos(ctrl.theta),
      ctrl.target.y + ctrl.distance * Math.cos(ctrl.phi),
      ctrl.target.z + ctrl.distance * Math.sin(ctrl.phi) * Math.sin(ctrl.theta)
    );
    camera.lookAt(ctrl.target);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update building when data changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (diffOverlay) {
      updateDiffScene(scene, data, diffOverlay.baselineData, diffOverlay.diff, showCeiling);
    } else {
      updateScene(scene, data, showCeiling);
    }
  }, [data, showCeiling, diffOverlay]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
