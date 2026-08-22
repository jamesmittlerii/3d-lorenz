import type { ReactNode, RefObject } from 'react';
import * as THREE from 'three';

interface LedShellProps {
  readonly meshRef: RefObject<THREE.InstancedMesh | null>;
  readonly count: number;
  readonly edgeGeometry: THREE.BufferGeometry;
  readonly edgeColor: string;
  readonly edgeOpacity: number;
  readonly children: ReactNode;
}

export function LedShell({
  meshRef,
  count,
  edgeGeometry,
  edgeColor,
  edgeOpacity,
  children,
}: LedShellProps) {
  return (
    <>
      {/* Sonar does not recognize React Three Fiber intrinsic-element props. */}
      <lineSegments>
        <edgesGeometry args={[edgeGeometry]} /> {/* NOSONAR */}
        <lineBasicMaterial color={edgeColor} transparent opacity={edgeOpacity} /> {/* NOSONAR */}
      </lineSegments>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]} /* NOSONAR */
        frustumCulled={false} /* NOSONAR */
      >
        {children}
        <meshBasicMaterial toneMapped={false} /> {/* NOSONAR */}
      </instancedMesh>
    </>
  );
}
