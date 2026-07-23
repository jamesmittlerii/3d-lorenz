import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ThomasAttractorProps {
  maxPoints?: number;
  speed?: number;
}

export function ThomasAttractor({ maxPoints = 5000, speed = 2 }: ThomasAttractorProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  // Thomas parameters
  const b = 0.208186;
  
  // State for the current position
  const [pos] = useState(() => new THREE.Vector3(1, 0, 0));
  
  const positions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  const countRef = useRef(0);
  
  // A glowing neon color (e.g. vibrant purple/gold)
  const color = new THREE.Color("#9900ff").lerp(new THREE.Color("#ffcc00"), 0.5);

  useFrame((_state, delta) => {
    // Thomas typically needs slightly larger speed to trace interesting paths quickly
    const steps = speed * 2;
    const dt = Math.min(delta, 0.016) * 0.5; 
    
    let currentCount = countRef.current;
    
    for (let i = 0; i < steps; i++) {
      // Calculate derivatives
      const dx = (Math.sin(pos.y) - b * pos.x) * dt;
      const dy = (Math.sin(pos.z) - b * pos.y) * dt;
      const dz = (Math.sin(pos.x) - b * pos.z) * dt;
      
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
      
      if (currentCount >= maxPoints) {
        positions.copyWithin(0, 3, maxPoints * 3);
        currentCount = maxPoints - 1;
      }
      
      // Thomas values are small (typically bounded between -5 and 5), scale up for viewing
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
