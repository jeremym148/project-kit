# Skill: Three.js Architectural 3D Rendering

## Purpose
Best practices for rendering architectural floor plans in Three.js with realistic materials, proper lighting, and performant scene management.

## Scene Setup

### Renderer Configuration
```typescript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap at 2x
```

### Lighting for Architecture
Use this 4-light setup for balanced architectural illumination:
1. **Ambient** (0.5-0.6) — base fill, cool tint `#b8c4d8`
2. **Sun directional** (1.2-1.5) — main light, warm `#ffe4c4`, casts shadows, positioned high
3. **Fill directional** (0.3-0.4) — opposite side, cool `#8090c0`, no shadows
4. **Hemisphere** (0.2-0.3) — sky `#87ceeb` to ground `#3a2a1a`

Shadow camera must cover the entire floor plan:
```typescript
sun.shadow.camera.left = -maxDimension;
sun.shadow.camera.right = maxDimension;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.001; // prevent shadow acne
```

### Materials Library (define once, reuse)
```typescript
const materials = {
  wall: new THREE.MeshStandardMaterial({ color: "#e8e0d4", roughness: 0.7, metalness: 0.05 }),
  floor: new THREE.MeshStandardMaterial({ color: "#c4a882", roughness: 0.6 }),
  door: new THREE.MeshStandardMaterial({ color: "#6b4423", roughness: 0.5, metalness: 0.1 }),
  frame: new THREE.MeshStandardMaterial({ color: "#4a3520", roughness: 0.4, metalness: 0.15 }),
  glass: new THREE.MeshStandardMaterial({ color: "#a8d4e6", roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.4 }),
  ceiling: new THREE.MeshStandardMaterial({ color: "#f8f4f0", roughness: 0.9, side: THREE.DoubleSide }),
};
```

## Wall Building with Openings

The key challenge: walls with doors/windows need to be split into segments.

### Algorithm
1. Get all openings for this wall, sorted by position
2. For each opening, calculate start/end along wall length
3. Build solid wall segments between openings
4. Build wall-above-opening segments (lintel area)
5. Build wall-below-window segments (sill area)
6. Build the opening meshes (door panel, glass, frames)

### Key formula:
```typescript
const posAlongWall = opening.position * wallLength;
const openStart = posAlongWall - opening.width / 2;
const openEnd = posAlongWall + opening.width / 2;
```

### Wall mesh positioning:
```typescript
// Wall goes from (x1,y1) to (x2,y2) in floor plan coordinates
// In Three.js: x = floor plan x, y = height, z = floor plan y
const angle = Math.atan2(dy, dx);
mesh.position.set(centerX, height / 2, centerZ);
mesh.rotation.y = -angle; // negative because Three.js Y rotation is opposite
```

## Performance: Scene Diffing

### Tag all building meshes:
```typescript
mesh.userData = { building: true, wallId: wall.id, type: 'wall' };
```

### On data change, diff instead of rebuild:
```typescript
function updateScene(scene: THREE.Scene, oldData: FloorPlan, newData: FloorPlan) {
  const changedWallIds = findChangedWalls(oldData, newData);
  const removedWallIds = findRemovedWalls(oldData, newData);
  
  // Remove meshes for changed/removed walls
  scene.traverse(child => {
    if (child.userData.building && 
        (removedWallIds.has(child.userData.wallId) || changedWallIds.has(child.userData.wallId))) {
      toRemove.push(child);
    }
  });
  toRemove.forEach(c => { scene.remove(c); c.geometry?.dispose(); });
  
  // Rebuild only changed walls
  changedWallIds.forEach(id => buildWall(scene, newData, id));
}
```

### Memory management:
- Always `.dispose()` geometries when removing meshes
- Never create materials in a render loop
- Reuse geometries for identical dimensions (geometry cache)

## Camera Controls (manual orbit)
```typescript
// Spherical coordinates: theta (horizontal), phi (vertical), distance
const x = target.x + distance * Math.sin(phi) * Math.cos(theta);
const y = target.y + distance * Math.cos(phi);
const z = target.z + distance * Math.sin(phi) * Math.sin(theta);
camera.position.set(x, y, z);
camera.lookAt(target);
```

Clamp phi to prevent flipping: `Math.max(0.1, Math.min(PI/2 - 0.05, phi))`

## Common Pitfalls
- Forgetting `mesh.castShadow = true` / `receiveShadow = true`
- Not disposing geometries → memory leak
- Creating materials inside loops
- Using OrbitControls import (not available in CDN builds) — implement manually
- Fog distance too short for large apartments
- Shadow camera bounds too small → shadows cut off
