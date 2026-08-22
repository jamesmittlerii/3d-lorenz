import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ATTRACTOR_SYSTEMS, type AttractorType } from '../attractors/systems';
import { createRunningBounds, includePoint, normalizePoint } from '../attractors/runningBounds';
import { LedShell } from './LedShell';

const GRID = 32;
const FACES = 6;
const LED_COUNT = GRID * GRID * FACES;
const CUBE_SIZE = 36;
const HALF = CUBE_SIZE / 2;
const LED_SIZE = CUBE_SIZE / GRID * 0.72;
const FADE = 0.965;
const HIT_BOOST = 1.15;

type FaceUV = { u: number; v: number };

/** Orthographic projection of a unit-cube point onto each face (u,v in [0,1]). */
function projectToFaces(nx: number, ny: number, nz: number): FaceUV[] {
  // nx,ny,nz in [-1, 1]
  return [
    { u: (ny + 1) * 0.5, v: (nz + 1) * 0.5 }, // +X
    { u: (1 - ny) * 0.5, v: (nz + 1) * 0.5 }, // -X
    { u: (nx + 1) * 0.5, v: (nz + 1) * 0.5 }, // +Y
    { u: (1 - nx) * 0.5, v: (nz + 1) * 0.5 }, // -Y
    { u: (nx + 1) * 0.5, v: (ny + 1) * 0.5 }, // +Z
    { u: (1 - nx) * 0.5, v: (ny + 1) * 0.5 }, // -Z
  ];
}

/** Place an LED so its thin axis points along the face normal. */
function placeLed(face: number, ix: number, iy: number, obj: THREE.Object3D) {
  const cell = CUBE_SIZE / GRID;
  const u = -HALF + cell * (ix + 0.5);
  const v = -HALF + cell * (iy + 0.5);
  const inset = HALF + LED_SIZE * 0.2;

  obj.rotation.set(0, 0, 0);

  switch (face) {
    case 0: // +X
      obj.position.set(inset, u, v);
      obj.rotation.y = Math.PI * 0.5;
      break;
    case 1: // -X
      obj.position.set(-inset, -u, v);
      obj.rotation.y = -Math.PI * 0.5;
      break;
    case 2: // +Y
      obj.position.set(u, inset, v);
      obj.rotation.x = -Math.PI * 0.5;
      break;
    case 3: // -Y
      obj.position.set(-u, -inset, v);
      obj.rotation.x = Math.PI * 0.5;
      break;
    case 4: // +Z
      obj.position.set(u, v, inset);
      break;
    default: // -Z
      obj.position.set(-u, v, -inset);
      obj.rotation.y = Math.PI;
      break;
  }
}

interface LedCubeProps {
  readonly type: AttractorType;
}

export function LedCube({ type }: LedCubeProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const config = ATTRACTOR_SYSTEMS[type];

  const sim = useMemo(() => {
    const pos = config.init();
    const brightness = new Float32Array(LED_COUNT);
    const bounds = createRunningBounds();
    return { pos, brightness, bounds };
  }, [config]);

  const baseColor = useMemo(() => new THREE.Color(config.color), [config.color]);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const edgeGeo = useMemo(
    () => new THREE.BoxGeometry(CUBE_SIZE * 0.98, CUBE_SIZE * 0.98, CUBE_SIZE * 0.98),
    [],
  );

  // Place LED instances once.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let face = 0; face < FACES; face++) {
      for (let iy = 0; iy < GRID; iy++) {
        for (let ix = 0; ix < GRID; ix++) {
          const i = face * GRID * GRID + iy * GRID + ix;
          placeLed(face, ix, iy, dummy);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          mesh.setColorAt(i, tempColor.setRGB(0.02, 0.02, 0.025));
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dummy, tempColor]);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { pos, brightness, bounds } = sim;
    const dt = Math.min(delta, 0.016) * config.dtScale;
    const steps = config.speed;

    // Fade trail
    for (let i = 0; i < LED_COUNT; i++) {
      brightness[i] *= FADE;
    }

    for (let s = 0; s < steps; s++) {
      config.step(pos, dt);
      const d = config.toDisplay(pos);

      includePoint(bounds, d);

      // Warm up a bit so bounds aren't a single point
      if (bounds.samples < 40) continue;

      const pad = 0.08;
      const normalized = normalizePoint(bounds, d);

      // Soft pad so the plot doesn't hug the LED edges only
      const sx = (normalized.x * 2 - 1) * (1 - pad);
      const sy = (normalized.y * 2 - 1) * (1 - pad);
      const sz = (normalized.z * 2 - 1) * (1 - pad);

      const faces = projectToFaces(sx, sy, sz);
      for (let face = 0; face < FACES; face++) {
        const { u, v } = faces[face];
        const ix = Math.min(GRID - 1, Math.max(0, Math.floor(u * GRID)));
        const iy = Math.min(GRID - 1, Math.max(0, Math.floor(v * GRID)));
        const i = face * GRID * GRID + iy * GRID + ix;
        brightness[i] = Math.min(1, brightness[i] + HIT_BOOST);
      }
    }

    // Push colors to instances
    for (let i = 0; i < LED_COUNT; i++) {
      const b = brightness[i];
      if (b < 0.01) {
        tempColor.setRGB(0.015, 0.015, 0.02);
      } else {
        // Soft gamma so dim trail LEDs still read
        const g = Math.pow(b, 0.65);
        tempColor.copy(baseColor).multiplyScalar(0.15 + g * 0.85);
      }
      mesh.setColorAt(i, tempColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Dark PCB body */}
      <mesh>
        <boxGeometry args={[CUBE_SIZE * 0.96, CUBE_SIZE * 0.96, CUBE_SIZE * 0.96]} /> {/* NOSONAR */}
        <meshStandardMaterial color="#08080c" roughness={0.85} metalness={0.35} /> {/* NOSONAR */}
      </mesh>

      <LedShell
        meshRef={meshRef}
        count={LED_COUNT}
        edgeGeometry={edgeGeo}
        edgeColor="#1a1a22"
        edgeOpacity={0.7}
      >
        <boxGeometry args={[LED_SIZE, LED_SIZE, LED_SIZE * 0.35]} /> {/* NOSONAR */}
      </LedShell>
    </group>
  );
}
