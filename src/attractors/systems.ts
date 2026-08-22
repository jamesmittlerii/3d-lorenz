export type AttractorType =
  | 'lorenz'
  | 'chua'
  | 'rossler'
  | 'thomas'
  | 'aizawa'
  | 'halvorsen'
  | 'rabinovich';

export type Vec3 = { x: number; y: number; z: number };

export type AttractorConfig = {
  color: string;
  lineColors: readonly [string, string];
  speed: number;
  dtScale: number;
  /** Approximate world-space half-extent after scaling (for camera / cube sizing). */
  extent: number;
  init: () => Vec3;
  step: (pos: Vec3, dt: number) => void;
  /** Map internal state → display coordinates (same scales as line attractors). */
  toDisplay: (pos: Vec3) => Vec3;
};

function chuaH(x: number, m0: number, m1: number) {
  return m1 * x + 0.5 * (m0 - m1) * (Math.abs(x + 1) - Math.abs(x - 1));
}

function rk4Step(pos: Vec3, dt: number, derivative: (point: Vec3) => Vec3) {
  const k1 = derivative(pos);
  const k2 = derivative({
    x: pos.x + k1.x * dt * 0.5,
    y: pos.y + k1.y * dt * 0.5,
    z: pos.z + k1.z * dt * 0.5,
  });
  const k3 = derivative({
    x: pos.x + k2.x * dt * 0.5,
    y: pos.y + k2.y * dt * 0.5,
    z: pos.z + k2.z * dt * 0.5,
  });
  const k4 = derivative({
    x: pos.x + k3.x * dt,
    y: pos.y + k3.y * dt,
    z: pos.z + k3.z * dt,
  });

  pos.x += (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x);
  pos.y += (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y);
  pos.z += (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z);
}

function rabinovichDerivative(pos: Vec3): Vec3 {
  const alpha = 1.1;
  const gamma = 0.87;
  return {
    x: pos.y * (pos.z - 1 + pos.x * pos.x) + gamma * pos.x,
    y: pos.x * (3 * pos.z + 1 - pos.x * pos.x) + gamma * pos.y,
    z: -2 * pos.z * (alpha + pos.x * pos.y),
  };
}

export const ATTRACTOR_SYSTEMS: Record<AttractorType, AttractorConfig> = {
  lorenz: {
    color: '#ff00cc',
    lineColors: ['#ff00cc', '#3333ff'],
    speed: 4,
    dtScale: 0.5,
    extent: 40,
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (pos, dt) => {
      const sigma = 10;
      const rho = 28;
      const beta = 8 / 3;
      const dx = sigma * (pos.y - pos.x) * dt;
      const dy = (pos.x * (rho - pos.z) - pos.y) * dt;
      const dz = (pos.x * pos.y - beta * pos.z) * dt;
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
    },
    toDisplay: (pos) => ({ x: pos.x, y: pos.y, z: pos.z }),
  },
  chua: {
    color: '#00ffcc',
    lineColors: ['#00ffcc', '#00ff66'],
    speed: 4,
    dtScale: 0.5,
    extent: 40,
    init: () => ({ x: 0.1, y: 0.1, z: 0.1 }),
    step: (pos, dt) => {
      const alpha = 15.6;
      const beta = 28;
      const m0 = -1.143;
      const m1 = -0.714;
      const h = chuaH(pos.x, m0, m1);
      const dx = alpha * (pos.y - pos.x - h) * dt;
      const dy = (pos.x - pos.y + pos.z) * dt;
      const dz = -beta * pos.y * dt;
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
    },
    toDisplay: (pos) => {
      const s = 12;
      return { x: pos.x * s, y: pos.y * s, z: pos.z * s };
    },
  },
  rossler: {
    color: '#ffaa00',
    lineColors: ['#ffaa00', '#ff0066'],
    speed: 16,
    dtScale: 0.5,
    extent: 30,
    init: () => ({ x: 1, y: 1, z: 1 }),
    step: (pos, dt) => {
      const a = 0.2;
      const b = 0.2;
      const c = 5.7;
      const dx = (-pos.y - pos.z) * dt;
      const dy = (pos.x + a * pos.y) * dt;
      const dz = (b + pos.z * (pos.x - c)) * dt;
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
    },
    toDisplay: (pos) => {
      const s = 1.5;
      return { x: pos.x * s, y: pos.y * s, z: pos.z * s };
    },
  },
  thomas: {
    color: '#9900ff',
    lineColors: ['#9900ff', '#ffcc00'],
    speed: 32,
    dtScale: 0.5,
    extent: 40,
    init: () => ({ x: 1, y: 0, z: 0 }),
    step: (pos, dt) => {
      const b = 0.208186;
      const dx = (Math.sin(pos.y) - b * pos.x) * dt;
      const dy = (Math.sin(pos.z) - b * pos.y) * dt;
      const dz = (Math.sin(pos.x) - b * pos.z) * dt;
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
    },
    toDisplay: (pos) => {
      const s = 8;
      return { x: pos.x * s, y: pos.y * s, z: pos.z * s };
    },
  },
  aizawa: {
    color: '#ff3366',
    lineColors: ['#ff3366', '#ffcc00'],
    speed: 8,
    dtScale: 0.5,
    extent: 30,
    init: () => ({ x: 0.1, y: 0, z: 0 }),
    step: (pos, dt) => {
      const a = 0.95;
      const b = 0.7;
      const c = 0.6;
      const d = 3.5;
      const e = 0.25;
      const f = 0.1;
      const dx = ((pos.z - b) * pos.x - d * pos.y) * dt;
      const dy = (d * pos.x + (pos.z - b) * pos.y) * dt;
      const dz =
        (c +
          a * pos.z -
          Math.pow(pos.z, 3) / 3 -
          (pos.x * pos.x + pos.y * pos.y) * (1 + e * pos.z) +
          f * pos.z * Math.pow(pos.x, 3)) *
        dt;
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
    },
    toDisplay: (pos) => {
      const s = 15;
      return { x: pos.x * s, y: pos.y * s, z: pos.z * s };
    },
  },
  halvorsen: {
    color: '#0066ff',
    lineColors: ['#00ffcc', '#0066ff'],
    speed: 8,
    dtScale: 0.2,
    extent: 40,
    init: () => ({ x: -5, y: 0, z: 0 }),
    step: (pos, dt) => {
      const a = 1.4;
      const dx = (-a * pos.x - 4 * pos.y - 4 * pos.z - pos.y * pos.y) * dt;
      const dy = (-a * pos.y - 4 * pos.z - 4 * pos.x - pos.z * pos.z) * dt;
      const dz = (-a * pos.z - 4 * pos.x - 4 * pos.y - pos.x * pos.x) * dt;
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
    },
    toDisplay: (pos) => {
      const s = 2;
      return { x: pos.x * s, y: pos.y * s, z: pos.z * s };
    },
  },
  rabinovich: {
    color: '#aaff00',
    lineColors: ['#aaff00', '#00aa00'],
    speed: 32,
    dtScale: 0.1,
    extent: 30,
    init: () => ({ x: -1, y: 0, z: 0.5 }),
    step: (pos, dt) => rk4Step(pos, dt, rabinovichDerivative),
    toDisplay: (pos) => {
      const s = 8;
      return { x: pos.x * s, y: pos.y * s, z: pos.z * s };
    },
  },
};
