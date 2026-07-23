import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LorenzAttractorProps {
  readonly maxPoints?: number;
  readonly speed?: number;
}

export function LorenzAttractor({ maxPoints = 5000, speed = 2 }: LorenzAttractorProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  // Lorenz parameters
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  
  // State for the current position and the array of points
  const [pos] = useState(() => new THREE.Vector3(0.1, 0, 0));
  
  // Pre-allocate a buffer for the maximum number of points to avoid continuous reallocation
  const positions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  
  // Keep track of how many points we have currently drawn
  const countRef = useRef(0);
  
  // A glowing neon color
  const color = new THREE.Color("#ff00cc").lerp(new THREE.Color("#3333ff"), 0.5);

  useFrame((_state, delta) => {
    // Run the simulation for multiple steps per frame to speed it up
    const steps = speed;
    const dt = Math.min(delta, 0.016) * 0.5; // Cap delta time for stability
    
    let currentCount = countRef.current;
    
    for (let i = 0; i < steps; i++) {
      // Calculate derivatives
      const dx = sigma * (pos.y - pos.x) * dt;
      const dy = (pos.x * (rho - pos.z) - pos.y) * dt;
      const dz = (pos.x * pos.y - beta * pos.z) * dt;
      
      // Update position
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
      
      // Shift array if we've reached maxPoints
      if (currentCount >= maxPoints) {
        // Shift all elements back by 3 (one vector)
        positions.copyWithin(0, 3, maxPoints * 3);
        currentCount = maxPoints - 1;
      }
      
      // Add new point at the end
      const index = currentCount * 3;
      positions[index] = pos.x;
      positions[index + 1] = pos.y;
      positions[index + 2] = pos.z;
      
      currentCount++;
    }
    
    countRef.current = currentCount;
    
    if (lineRef.current) {
      // Update the geometry buffer
      const geo = lineRef.current.geometry;
      geo.attributes.position.needsUpdate = true;
      // Tell Three.js how many points to actually draw
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
