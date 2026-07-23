import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AizawaAttractorProps {
  readonly maxPoints?: number;
  readonly speed?: number;
}

export function AizawaAttractor({ maxPoints = 20000, speed = 8 }: AizawaAttractorProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  const a = 0.95;
  const b = 0.7;
  const c = 0.6;
  const d = 3.5;
  const e = 0.25;
  const f = 0.1;
  
  const [pos] = useState(() => new THREE.Vector3(0.1, 0, 0));
  const positions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  const countRef = useRef(0);
  
  const color = new THREE.Color("#ff3366").lerp(new THREE.Color("#ffcc00"), 0.5);

  useFrame((_state, delta) => {
    const steps = speed;
    const dt = Math.min(delta, 0.016) * 0.5;
    
    let currentCount = countRef.current;
    
    for (let i = 0; i < steps; i++) {
      const dx = ((pos.z - b) * pos.x - d * pos.y) * dt;
      const dy = (d * pos.x + (pos.z - b) * pos.y) * dt;
      const dz = (c + a * pos.z - Math.pow(pos.z, 3) / 3 - (pos.x * pos.x + pos.y * pos.y) * (1 + e * pos.z) + f * pos.z * Math.pow(pos.x, 3)) * dt;
      
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
      
      if (currentCount >= maxPoints) {
        positions.copyWithin(0, 3, maxPoints * 3);
        currentCount = maxPoints - 1;
      }
      
      const scale = 15;
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
