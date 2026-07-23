import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { LorenzAttractor } from './LorenzAttractor';
import { ChuaCircuit } from './ChuaCircuit';
import { RosslerAttractor } from './RosslerAttractor';
import { ThomasAttractor } from './ThomasAttractor';

export type AttractorType = 'lorenz' | 'chua' | 'rossler' | 'thomas';

export function Scene({ type = 'lorenz' }: { type?: AttractorType }) {
  // Rössler tends to have z values around 10, Lorenz around 25, Chua and Thomas around 0
  const targetMap: Record<AttractorType, [number, number, number]> = {
    lorenz: [0, 0, 25],
    chua: [0, 0, 0],
    rossler: [0, 0, 10],
    thomas: [0, 0, 0]
  };
  const target = targetMap[type];

  return (
    <Canvas camera={{ position: [0, 0, 80], fov: 60 }}>
      <color attach="background" args={['#020202']} />
      
      {/* Lights */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      
      {/* The Attractor */}
      {type === 'lorenz' && <LorenzAttractor maxPoints={2000} speed={4} />}
      {type === 'chua' && <ChuaCircuit maxPoints={2000} speed={4} />}
      {type === 'rossler' && <RosslerAttractor maxPoints={2000} speed={4} />}
      {type === 'thomas' && <ThomasAttractor maxPoints={2000} speed={4} />}
      
      {/* Controls to spin and zoom */}
      <OrbitControls 
        autoRotate 
        autoRotateSpeed={0.5} 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={target}
      />
      
      {/* Postprocessing for the neon glow */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0} 
          mipmapBlur 
          intensity={2.0} 
        />
      </EffectComposer>
    </Canvas>
  );
}
