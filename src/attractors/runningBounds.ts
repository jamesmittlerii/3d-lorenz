import type { Vec3 } from './systems';

export interface RunningBounds {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  samples: number;
}

export function createRunningBounds(): RunningBounds {
  return {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity,
    samples: 0,
  };
}

export function includePoint(bounds: RunningBounds, point: Vec3) {
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.minZ = Math.min(bounds.minZ, point.z);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
  bounds.maxZ = Math.max(bounds.maxZ, point.z);
  bounds.samples++;
}

export function normalizePoint(bounds: RunningBounds, point: Vec3): Vec3 {
  const spanX = Math.max(bounds.maxX - bounds.minX, 1e-3);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1e-3);
  const spanZ = Math.max(bounds.maxZ - bounds.minZ, 1e-3);

  return {
    x: (point.x - bounds.minX) / spanX,
    y: (point.y - bounds.minY) / spanY,
    z: (point.z - bounds.minZ) / spanZ,
  };
}
