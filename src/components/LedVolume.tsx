import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ATTRACTOR_SYSTEMS, type AttractorType, type Vec3 } from '../attractors/systems';

const GRID = 32;
const LED_COUNT = GRID * GRID * GRID;
const CUBE_SIZE = 36;
const HALF = CUBE_SIZE / 2;
const CELL = CUBE_SIZE / GRID;
const LED_SIZE = CELL * 0.38;
const FADE = 0.955;
const HIT_BOOST = 1.2;
const OFF_THRESHOLD = 0.02;

function voxelIndex(ix: number, iy: number, iz: number) {
  return iz * GRID * GRID + iy * GRID + ix;
}

function indexToCoords(i: number) {
  const iz = Math.floor(i / (GRID * GRID));
  const rem = i - iz * GRID * GRID;
  const iy = Math.floor(rem / GRID);
  const ix = rem - iy * GRID;
  return { ix, iy, iz };
}

interface LedVolumeProps {
  readonly type: AttractorType;
}

export function LedVolume({ type }: LedVolumeProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const config = ATTRACTOR_SYSTEMS[type];

  const sim = useMemo(() => {
    const pos: Vec3 = config.init();
    const brightness = new Float32Array(LED_COUNT);
    const active = new Set<number>();
    const bounds = {
      minX: Infinity,
      minY: Infinity,
      minZ: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
      maxZ: -Infinity,
      samples: 0,
    };
    return { pos, brightness, active, bounds };
  }, [config]);

  const baseColor = useMemo(() => new THREE.Color(config.color), [config.color]);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const edgeGeo = useMemo(
    () => new THREE.BoxGeometry(CUBE_SIZE + CELL * 0.2, CUBE_SIZE + CELL * 0.2, CUBE_SIZE + CELL * 0.2),
    [],
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < LED_COUNT; i++) {
      const { ix, iy, iz } = indexToCoords(i);
      dummy.position.set(
        -HALF + CELL * (ix + 0.5),
        -HALF + CELL * (iy + 0.5),
        -HALF + CELL * (iz + 0.5),
      );
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tempColor.setRGB(0, 0, 0));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [type, dummy, tempColor]);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { pos, brightness, active, bounds } = sim;
    const dt = Math.min(delta, 0.016) * config.dtScale;

    const light = (i: number, amount: number) => {
      brightness[i] = Math.min(1, brightness[i] + amount);
      active.add(i);
    };

    for (let s = 0; s < config.speed; s++) {
      config.step(pos, dt);
      const d = config.toDisplay(pos);

      bounds.minX = Math.min(bounds.minX, d.x);
      bounds.minY = Math.min(bounds.minY, d.y);
      bounds.minZ = Math.min(bounds.minZ, d.z);
      bounds.maxX = Math.max(bounds.maxX, d.x);
      bounds.maxY = Math.max(bounds.maxY, d.y);
      bounds.maxZ = Math.max(bounds.maxZ, d.z);
      bounds.samples++;

      if (bounds.samples < 40) continue;

      const pad = 0.06;
      const spanX = Math.max(bounds.maxX - bounds.minX, 1e-3);
      const spanY = Math.max(bounds.maxY - bounds.minY, 1e-3);
      const spanZ = Math.max(bounds.maxZ - bounds.minZ, 1e-3);

      const nx = Math.min(0.999, Math.max(0, ((d.x - bounds.minX) / spanX) * (1 - 2 * pad) + pad));
      const ny = Math.min(0.999, Math.max(0, ((d.y - bounds.minY) / spanY) * (1 - 2 * pad) + pad));
      const nz = Math.min(0.999, Math.max(0, ((d.z - bounds.minZ) / spanZ) * (1 - 2 * pad) + pad));

      const ix = Math.floor(nx * GRID);
      const iy = Math.floor(ny * GRID);
      const iz = Math.floor(nz * GRID);
      light(voxelIndex(ix, iy, iz), HIT_BOOST);

      const neighbors = [
        [ix + 1, iy, iz],
        [ix - 1, iy, iz],
        [ix, iy + 1, iz],
        [ix, iy - 1, iz],
        [ix, iy, iz + 1],
        [ix, iy, iz - 1],
      ] as const;
      for (const [cx, cy, cz] of neighbors) {
        if (cx < 0 || cy < 0 || cz < 0 || cx >= GRID || cy >= GRID || cz >= GRID) continue;
        light(voxelIndex(cx, cy, cz), HIT_BOOST * 0.25);
      }
    }

    const toRemove: number[] = [];
    for (const i of active) {
      brightness[i] *= FADE;
      const b = brightness[i];
      const { ix, iy, iz } = indexToCoords(i);

      dummy.position.set(
        -HALF + CELL * (ix + 0.5),
        -HALF + CELL * (iy + 0.5),
        -HALF + CELL * (iz + 0.5),
      );

      if (b < OFF_THRESHOLD) {
        brightness[i] = 0;
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        toRemove.push(i);
        continue;
      }

      const g = Math.pow(b, 0.6);
      dummy.scale.setScalar(0.55 + g * 0.7);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      tempColor.copy(baseColor).multiplyScalar(0.2 + g * 0.9);
      mesh.setColorAt(i, tempColor);
    }

    for (const i of toRemove) active.delete(i);

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Sonar does not recognize React Three Fiber intrinsic-element props. */}
      <lineSegments>
        <edgesGeometry args={[edgeGeo]} /> {/* NOSONAR */}
        <lineBasicMaterial color="#22222c" transparent opacity={0.85} /> {/* NOSONAR */}
      </lineSegments>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, LED_COUNT]} /* NOSONAR */
        frustumCulled={false} /* NOSONAR */
      >
        <sphereGeometry args={[LED_SIZE * 0.5, 6, 4]} /> {/* NOSONAR */}
        <meshBasicMaterial toneMapped={false} /> {/* NOSONAR */}
      </instancedMesh>
    </group>
  );
}
