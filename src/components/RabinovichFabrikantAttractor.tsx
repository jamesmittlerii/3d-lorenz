import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RabinovichFabrikantAttractorProps {
  readonly maxPoints?: number;
  readonly speed?: number;
}

export function RabinovichFabrikantAttractor({ maxPoints = 20000, speed = 8 }: RabinovichFabrikantAttractorProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  const alpha = 0.14;
  const gamma = 0.1;
  
  const [pos] = useState(() => new THREE.Vector3(-1, 0, 0.5));
  const positions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  const countRef = useRef(0);
  
  const color = new THREE.Color("#aaff00").lerp(new THREE.Color("#00aa00"), 0.5);

  useFrame((_state, delta) => {
    const steps = speed;
    const dt = Math.min(delta, 0.016) * 0.1;
    
    let currentCount = countRef.current;
    
    for (let i = 0; i < steps; i++) {
      const dx = (pos.y * (pos.z - 1 + pos.x * pos.x) + gamma * pos.x) * dt;
      const dy = (pos.x * (3 * pos.z + 1 - pos.x * pos.x) + gamma * pos.y) * dt;
      const dz = (-2 * pos.z * (alpha + pos.x * pos.y)) * dt;
      
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
      
      if (currentCount >= maxPoints) {
        positions.copyWithin(0, 3, maxPoints * 3);
        currentCount = maxPoints - 1;
      }
      
      const scale = 8;
      const index = currentCount * 3;
      positions[index] = pos.x * scale;
      positions[index + 1] = pos.y * scale;
      positions[index + 2] = pos.z * scale;
      
      currentCount++;
    }
    
    countRef.current = currentCount;
    
    if (lineRef.current) {
      const geo = lineRef.current.geometry;
      geo.attributes.position.needsUpdate = true;
      geo.setDrawRange(0, currentCount);
    }
  });

  return (
    <line ref={lineRef as any}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
    </line>
  );
}
