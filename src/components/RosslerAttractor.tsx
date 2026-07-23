import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RosslerAttractorProps {
  readonly maxPoints?: number;
  readonly speed?: number;
}

export function RosslerAttractor({ maxPoints = 5000, speed = 2 }: RosslerAttractorProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  // Rössler parameters
  const a = 0.2;
  const b = 0.2;
  const c = 5.7;
  
  // State for the current position
  const [pos] = useState(() => new THREE.Vector3(1, 1, 1));
  
  const positions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  const countRef = useRef(0);
  
  // A glowing neon color (e.g. vibrant orange/yellow)
  const color = new THREE.Color("#ffaa00").lerp(new THREE.Color("#ff0066"), 0.5);

  useFrame((_state, delta) => {
    const steps = speed;
    const dt = Math.min(delta, 0.016) * 0.5; 
    
    let currentCount = countRef.current;
    
    for (let i = 0; i < steps; i++) {
      // Calculate derivatives
      const dx = (-pos.y - pos.z) * dt;
      const dy = (pos.x + a * pos.y) * dt;
      const dz = (b + pos.z * (pos.x - c)) * dt;
      
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
      
      if (currentCount >= maxPoints) {
        positions.copyWithin(0, 3, maxPoints * 3);
        currentCount = maxPoints - 1;
      }
      
      // Scale slightly for consistent visualization size
      const scale = 1.5;
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
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={color} 
        linewidth={2} 
        transparent 
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}
