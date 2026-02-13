import * as THREE from 'three';
import { colors } from '../../styles/theme';

// Define materials once, reuse everywhere
export const wallMaterial = new THREE.MeshStandardMaterial({
  color: colors.wall3d,
  roughness: 0.7,
  metalness: 0.05,
});

export const floorMaterial = new THREE.MeshStandardMaterial({
  color: colors.floor3d,
  roughness: 0.6,
});

export const doorMaterial = new THREE.MeshStandardMaterial({
  color: colors.door3d,
  roughness: 0.5,
  metalness: 0.1,
});

export const frameMaterial = new THREE.MeshStandardMaterial({
  color: colors.frame3d,
  roughness: 0.4,
  metalness: 0.15,
});

export const glassMaterial = new THREE.MeshStandardMaterial({
  color: colors.glass3d,
  roughness: 0.1,
  metalness: 0.3,
  transparent: true,
  opacity: 0.4,
});

export const ceilingMaterial = new THREE.MeshStandardMaterial({
  color: colors.ceiling3d,
  roughness: 0.9,
  side: THREE.DoubleSide,
});

export const groundMaterial = new THREE.MeshStandardMaterial({
  color: colors.ground3d,
  roughness: 0.9,
});

export const barrierMaterial = new THREE.MeshStandardMaterial({
  color: '#9ca3af',
  roughness: 0.5,
  metalness: 0.3,
});

export const parquetMaterial = new THREE.MeshStandardMaterial({
  color: '#b5834a',
  roughness: 0.55,
  metalness: 0.02,
});

export const carrelageMaterial = new THREE.MeshStandardMaterial({
  color: '#d1d5db',
  roughness: 0.3,
  metalness: 0.05,
});

export const pelouseMaterial = new THREE.MeshStandardMaterial({
  color: '#4ade80',
  roughness: 0.9,
  metalness: 0,
});
