import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { LorenzAttractor } from './LorenzAttractor';
import { ChuaCircuit } from './ChuaCircuit';
import { RosslerAttractor } from './RosslerAttractor';
import { ThomasAttractor } from './ThomasAttractor';
import { AizawaAttractor } from './AizawaAttractor';
import { HalvorsenAttractor } from './HalvorsenAttractor';
import { RabinovichFabrikantAttractor } from './RabinovichFabrikantAttractor';
import { LedCube } from './LedCube';
import { LedVolume } from './LedVolume';
import type { AttractorType } from '../attractors/systems';

export type { AttractorType };
export type DisplayMode = 'line' | 'led-cube' | 'led-volume';

export function Scene({
  type = 'lorenz',
  mode = 'line',
}: {
  type?: AttractorType;
  mode?: DisplayMode;
}) {
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

  return (
    <Canvas key={mode} camera={{ position: cameraPos, fov: 50 }}>
      <color attach="background" args={['#020202']} />

      <ambientLight intensity={isLed ? 0.35 : 0.2} />
      <directionalLight position={[10, 10, 10]} intensity={isLed ? 0.6 : 1} />

      {mode === 'led-cube' && <LedCube type={type} />}
      {mode === 'led-volume' && <LedVolume type={type} />}
      {mode === 'line' && (
        <>
          {type === 'lorenz' && <LorenzAttractor maxPoints={20000} speed={4} />}
          {type === 'chua' && <ChuaCircuit maxPoints={20000} speed={4} />}
          {type === 'rossler' && <RosslerAttractor maxPoints={20000} speed={16} />}
          {type === 'thomas' && <ThomasAttractor maxPoints={20000} speed={16} />}
          {type === 'aizawa' && <AizawaAttractor maxPoints={20000} speed={8} />}
          {type === 'halvorsen' && <HalvorsenAttractor maxPoints={20000} speed={8} />}
          {type === 'rabinovich' && <RabinovichFabrikantAttractor maxPoints={20000} speed={8} />}
        </>
      )}

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
          intensity={mode === 'led-volume' ? 1.8 : isLed ? 1.4 : 2.0}
        />
      </EffectComposer>
    </Canvas>
  );
}
