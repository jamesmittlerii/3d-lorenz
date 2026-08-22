import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ATTRACTOR_SYSTEMS, type AttractorType, type Vec3 } from '../attractors/systems';

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
    const pos: Vec3 = config.init();
    const brightness = new Float32Array(LED_COUNT);
    const bounds = {
      minX: Infinity,
      minY: Infinity,
      minZ: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
      maxZ: -Infinity,
      ready: false,
      samples: 0,
    };
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

      bounds.minX = Math.min(bounds.minX, d.x);
      bounds.minY = Math.min(bounds.minY, d.y);
      bounds.minZ = Math.min(bounds.minZ, d.z);
      bounds.maxX = Math.max(bounds.maxX, d.x);
      bounds.maxY = Math.max(bounds.maxY, d.y);
      bounds.maxZ = Math.max(bounds.maxZ, d.z);
      bounds.samples++;

      // Warm up a bit so bounds aren't a single point
      if (bounds.samples < 40) continue;
      bounds.ready = true;

      const pad = 0.08;
      const spanX = Math.max(bounds.maxX - bounds.minX, 1e-3);
      const spanY = Math.max(bounds.maxY - bounds.minY, 1e-3);
      const spanZ = Math.max(bounds.maxZ - bounds.minZ, 1e-3);

      const nx = ((d.x - bounds.minX) / spanX) * 2 - 1;
      const ny = ((d.y - bounds.minY) / spanY) * 2 - 1;
      const nz = ((d.z - bounds.minZ) / spanZ) * 2 - 1;

      // Soft pad so the plot doesn't hug the LED edges only
      const sx = nx * (1 - pad);
      const sy = ny * (1 - pad);
      const sz = nz * (1 - pad);

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
      {/* Sonar does not recognize React Three Fiber intrinsic-element props. */}
      {/* Dark PCB body */}
      <mesh>
        <boxGeometry args={[CUBE_SIZE * 0.96, CUBE_SIZE * 0.96, CUBE_SIZE * 0.96]} /> {/* NOSONAR */}
        <meshStandardMaterial color="#08080c" roughness={0.85} metalness={0.35} /> {/* NOSONAR */}
      </mesh>

      {/* Subtle edge frame */}
      <lineSegments>
        <edgesGeometry args={[edgeGeo]} /> {/* NOSONAR */}
        <lineBasicMaterial color="#1a1a22" transparent opacity={0.7} /> {/* NOSONAR */}
      </lineSegments>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, LED_COUNT]} /* NOSONAR */
        frustumCulled={false} /* NOSONAR */
      >
        <boxGeometry args={[LED_SIZE, LED_SIZE, LED_SIZE * 0.35]} /> {/* NOSONAR */}
        <meshBasicMaterial toneMapped={false} /> {/* NOSONAR */}
      </instancedMesh>
    </group>
  );
}
