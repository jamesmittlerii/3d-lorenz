import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ChuaCircuitProps {
  readonly maxPoints?: number;
  readonly speed?: number;
}

export function ChuaCircuit({ maxPoints = 5000, speed = 2 }: ChuaCircuitProps) {
  const lineRef = useRef<THREE.Line>(null);
  
  // Chua parameters
  const alpha = 15.6;
  const beta = 28;
  const m0 = -1.143;
  const m1 = -0.714;
  
  // State for the current position
  // Start slightly offset from 0
  const [pos] = useState(() => new THREE.Vector3(0.1, 0.1, 0.1));
  
  // Pre-allocate a buffer for the maximum number of points
  const positions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  
  // Keep track of how many points we have currently drawn
  const countRef = useRef(0);
  
  // A glowing neon color (e.g. electric cyan/green to distinguish from Lorenz)
  const color = new THREE.Color("#00ffcc").lerp(new THREE.Color("#00ff66"), 0.5);

  useFrame((_state, delta) => {
    // Run the simulation for multiple steps per frame to speed it up
    const steps = speed;
    const dt = Math.min(delta, 0.016) * 0.5; // Cap delta time for stability
    
    let currentCount = countRef.current;
    
    for (let i = 0; i < steps; i++) {
      // Piecewise linear function
      const h_x = m1 * pos.x + 0.5 * (m0 - m1) * (Math.abs(pos.x + 1) - Math.abs(pos.x - 1));
      
      // Calculate derivatives
      const dx = alpha * (pos.y - pos.x - h_x) * dt;
      const dy = (pos.x - pos.y + pos.z) * dt;
      const dz = (-beta * pos.y) * dt;
      
      // Update position
      pos.x += dx;
      pos.y += dy;
      pos.z += dz;
      
      // Shift array if we've reached maxPoints
      if (currentCount >= maxPoints) {
        positions.copyWithin(0, 3, maxPoints * 3);
        currentCount = maxPoints - 1;
      }
      
      // Add new point at the end
      // Scale it up significantly for visualization, as Chua's circuit values are typically very small (-3 to 3)
      const scale = 12;
      const index = currentCount * 3;
      positions[index] = pos.x * scale;
      positions[index + 1] = pos.y * scale;
      positions[index + 2] = pos.z * scale;
      
      currentCount++;
    }
    
    countRef.current = currentCount;
    
    if (lineRef.current) {
      // Update the geometry buffer
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
