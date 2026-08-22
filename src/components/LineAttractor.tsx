import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ATTRACTOR_SYSTEMS, type AttractorType } from '../attractors/systems';

interface LineAttractorProps {
  readonly type: AttractorType;
  readonly maxPoints?: number;
  readonly speed?: number;
}

export function LineAttractor({
  type,
  maxPoints = 20000,
  speed,
}: LineAttractorProps) {
  const lineRef = useRef<THREE.Line>(null);
  const config = ATTRACTOR_SYSTEMS[type];
  const simulation = useMemo(
    () => ({
      pos: config.init(),
      positions: new Float32Array(maxPoints * 3),
      count: 0,
    }),
    [config, maxPoints],
  );
  const color = useMemo(
    () => new THREE.Color(config.lineColors[0]).lerp(new THREE.Color(config.lineColors[1]), 0.5),
    [config.lineColors],
  );

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.016) * config.dtScale;
    const steps = speed ?? config.speed;

    for (let i = 0; i < steps; i++) {
      config.step(simulation.pos, dt);

      if (simulation.count >= maxPoints) {
        simulation.positions.copyWithin(0, 3, maxPoints * 3);
        simulation.count = maxPoints - 1;
      }

      const display = config.toDisplay(simulation.pos);
      const index = simulation.count * 3;
      simulation.positions[index] = display.x;
      simulation.positions[index + 1] = display.y;
      simulation.positions[index + 2] = display.z;
      simulation.count++;
    }

    if (lineRef.current) {
      const geometry = lineRef.current.geometry;
      geometry.attributes.position.needsUpdate = true;
      geometry.setDrawRange(0, simulation.count);
    }
  });

  return (
    <line ref={lineRef as any}> {/* NOSONAR -- R3F line is THREE.Line, not SVGLineElement. */}
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" /* NOSONAR */
          args={[simulation.positions, 3]} /* NOSONAR */
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        linewidth={2} /* NOSONAR */
        transparent /* NOSONAR */
        opacity={0.8}
        blending={THREE.AdditiveBlending} /* NOSONAR */
      />
    </line>
  );
}
