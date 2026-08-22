import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { LineAttractor } from './LineAttractor';
import { LedCube } from './LedCube';
import { LedVolume } from './LedVolume';
import type { AttractorType } from '../attractors/systems';

export type { AttractorType };
export type DisplayMode = 'line' | 'led-cube' | 'led-volume';

interface SceneProps {
  readonly type?: AttractorType;
  readonly mode?: DisplayMode;
}

export function Scene({
  type = 'lorenz',
  mode = 'line',
}: SceneProps) {
  const isLed = mode === 'led-cube' || mode === 'led-volume';

  // Rössler tends to have z values around 10, Lorenz around 25, Chua and Thomas around 0
  const targetMap: Record<AttractorType, [number, number, number]> = {
    lorenz: [0, 0, 25],
    chua: [0, 0, 0],
    rossler: [0, 0, 10],
    thomas: [0, 0, 0],
    aizawa: [0, 0, 0],
    halvorsen: [0, 0, 0],
    rabinovich: [0, 0, 0],
  };
  const target = isLed ? ([0, 0, 0] as [number, number, number]) : targetMap[type];
  const cameraPos = isLed
    ? ([55, 40, 55] as [number, number, number])
    : ([0, 0, 80] as [number, number, number]);
  let bloomIntensity = 2;
  if (mode === 'led-volume') {
    bloomIntensity = 1.8;
  } else if (isLed) {
    bloomIntensity = 1.4;
  }

  return (
    <Canvas key={mode} camera={{ position: cameraPos, fov: 50 }}>
      <color attach="background" args={['#020202']} /> {/* NOSONAR */}

      <ambientLight intensity={isLed ? 0.35 : 0.2} /> {/* NOSONAR */}
      <directionalLight position={[10, 10, 10]} intensity={isLed ? 0.6 : 1} /> {/* NOSONAR */}

      {mode === 'led-cube' && <LedCube type={type} />}
      {mode === 'led-volume' && <LedVolume type={type} />}
      {mode === 'line' && <LineAttractor type={type} />}

      <OrbitControls
        autoRotate
        autoRotateSpeed={isLed ? 0.8 : 0.5}
        enablePan
        enableZoom
        enableRotate
        target={target}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={isLed ? 0.15 : 0}
          mipmapBlur
          intensity={bloomIntensity}
        />
      </EffectComposer>
    </Canvas>
  );
}
