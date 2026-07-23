import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HalvorsenAttractorProps {
  readonly maxPoints?: number;
  readonly speed?: number;
}

export function HalvorsenAttractor({ maxPoints = 20000, speed = 8 }: HalvorsenAttractorProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  const a = 1.4;
  
  const [pos] = useState(() => new THREE.Vector3(-5, 0, 0));
  const positions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  const countRef = useRef(0);
  
  const color = new THREE.Color("#00ffcc").lerp(new THREE.Color("#0066ff"), 0.5);

  useFrame((_state, delta) => {
    const steps = speed;
    const dt = Math.min(delta, 0.016) * 0.2;
    
    let currentCount = countRef.current;
    
    for (let i = 0; i < steps; i++) {
      const dx = (-a * pos.x - 4 * pos.y - 4 * pos.z - pos.y * pos.y) * dt;
      const dy = (-a * pos.y - 4 * pos.z - 4 * pos.x - pos.z * pos.z) * dt;
      const dz = (-a * pos.z - 4 * pos.x - 4 * pos.y - pos.x * pos.x) * dt;
      
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
      
      if (currentCount >= maxPoints) {
        positions.copyWithin(0, 3, maxPoints * 3);
        currentCount = maxPoints - 1;
      }
      
      const scale = 2;
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
