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
  color: '#c4a06a',
  roughness: 0.45,
  metalness: 0.02,
});

export const carrelageMaterial = new THREE.MeshStandardMaterial({
  color: '#c8cdd3',
  roughness: 0.15,
  metalness: 0.08,
});

export const pelouseMaterial = new THREE.MeshStandardMaterial({
  color: '#5a8f4a',
  roughness: 0.95,
  metalness: 0,
});

// Diff comparison materials
export const diffAddedMaterial = new THREE.MeshStandardMaterial({
  color: '#34d399',
  transparent: true,
  opacity: 0.5,
  roughness: 0.5,
});

export const diffRemovedMaterial = new THREE.MeshStandardMaterial({
  color: '#ef4444',
  transparent: true,
  opacity: 0.3,
  roughness: 0.5,
});

export const diffModifiedMaterial = new THREE.MeshStandardMaterial({
  color: '#f59e0b',
  transparent: true,
  opacity: 0.5,
  roughness: 0.5,
});
