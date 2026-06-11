import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Group, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';

import type { CubeState, FaceName } from '../api/types';
import type { PendingAnimation } from '../state/useCubeSession';
import { STICKER_COLORS, colorOf } from './colors';
import { buildCubelets, rotationFor, scenePosition, type Cubelet } from './geometry';

const STICKER_OFFSET = 0.501;
const QUARTER_TURN_SECONDS = 0.28;

// Geometries and materials are shared across every cubelet and every render —
// a 5×5 cube would otherwise create hundreds of identical GPU resources.
const cubeletGeometry = new RoundedBoxGeometry(0.97, 0.97, 0.97, 4, 0.06);
const stickerGeometry = new PlaneGeometry(0.86, 0.86);
const bodyMaterial = new MeshStandardMaterial({ color: '#15151a', roughness: 0.85 });
const stickerMaterials = new Map(
  Object.keys(STICKER_COLORS).map((letter) => [
    letter,
    new MeshStandardMaterial({ color: colorOf(letter), roughness: 0.35 }),
  ]),
);

/** Placement of a sticker plane on each side of a cubelet. */
const STICKER_PLACEMENTS: Record<
  FaceName,
  { position: [number, number, number]; rotation: [number, number, number] }
> = {
  front: { position: [0, 0, STICKER_OFFSET], rotation: [0, 0, 0] },
  back: { position: [0, 0, -STICKER_OFFSET], rotation: [0, Math.PI, 0] },
  up: { position: [0, STICKER_OFFSET, 0], rotation: [-Math.PI / 2, 0, 0] },
  down: { position: [0, -STICKER_OFFSET, 0], rotation: [Math.PI / 2, 0, 0] },
  right: { position: [STICKER_OFFSET, 0, 0], rotation: [0, Math.PI / 2, 0] },
  left: { position: [-STICKER_OFFSET, 0, 0], rotation: [0, -Math.PI / 2, 0] },
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface CubeletMeshProps {
  cubelet: Cubelet;
  size: number;
}

function CubeletMesh({ cubelet, size }: CubeletMeshProps) {
  return (
    <group position={scenePosition(cubelet.grid, size)}>
      <mesh geometry={cubeletGeometry} material={bodyMaterial} />
      {Object.entries(cubelet.stickers).map(([face, letter]) => {
        const placement = STICKER_PLACEMENTS[face as FaceName];
        return (
          <mesh
            key={face}
            geometry={stickerGeometry}
            material={stickerMaterials.get(letter)}
            position={placement.position}
            rotation={placement.rotation}
          />
        );
      })}
    </group>
  );
}

interface PuzzleProps {
  state: CubeState;
  animation: PendingAnimation | null;
  onAnimationComplete: () => void;
}

function Puzzle({ state, animation, onAnimationComplete }: PuzzleProps) {
  const rotatingGroup = useRef<Group>(null);
  const progress = useRef(0);
  const finished = useRef(false);
  const invalidate = useThree((three) => three.invalidate);

  const cubelets = useMemo(() => buildCubelets(state), [state]);
  const rotation = useMemo(() => {
    if (!animation) {
      return null;
    }

    const { axis, angle, affects } = rotationFor(animation.move, state.size);
    return {
      axisVector: new Vector3(...axis),
      angle,
      affects,
      duration: ((Math.abs(angle) / (Math.PI / 2)) * QUARTER_TURN_SECONDS) / animation.speed,
    };
  }, [animation, state.size]);

  const layers = useMemo(() => {
    if (!rotation) {
      return { rotating: [] as Cubelet[], still: cubelets };
    }
    return {
      rotating: cubelets.filter((cubelet) => rotation.affects(cubelet.grid)),
      still: cubelets.filter((cubelet) => !rotation.affects(cubelet.grid)),
    };
  }, [cubelets, rotation]);

  useEffect(() => {
    progress.current = 0;
    finished.current = false;
    rotatingGroup.current?.quaternion.identity();

    // The canvas renders on demand; a new animation needs a first frame.
    if (animation) {
      invalidate();
    }
  }, [animation, invalidate]);

  useFrame((_, delta) => {
    if (!rotation || finished.current || !rotatingGroup.current) {
      return;
    }

    progress.current = Math.min(1, progress.current + delta / rotation.duration);

    const angle = easeInOutCubic(progress.current) * rotation.angle;
    rotatingGroup.current.quaternion.setFromAxisAngle(rotation.axisVector, angle);

    if (progress.current >= 1) {
      finished.current = true;
      onAnimationComplete();
    } else {
      invalidate();
    }
  });

  // Scaling by cube size keeps every size framed identically.
  return (
    <group scale={3 / state.size}>
      <group ref={rotatingGroup}>
        {layers.rotating.map((cubelet) => (
          <CubeletMesh key={cubelet.key} cubelet={cubelet} size={state.size} />
        ))}
      </group>
      {layers.still.map((cubelet) => (
        <CubeletMesh key={cubelet.key} cubelet={cubelet} size={state.size} />
      ))}
    </group>
  );
}

export interface Cube3DProps {
  state: CubeState;
  animation: PendingAnimation | null;
  onAnimationComplete: () => void;
}

/**
 * The interactive 3D cube: drag to orbit, scroll to zoom. Face turns play as
 * smooth layer rotations; when a turn finishes the authoritative server state
 * is revealed by the session hook. The canvas renders on demand, so an idle
 * cube costs no GPU time.
 */
export function Cube3D({ state, animation, onAnimationComplete }: Cube3DProps) {
  return (
    <Canvas frameloop="demand" dpr={[1, 2]} camera={{ position: [4.4, 3.6, 5.6], fov: 42 }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 10, 8]} intensity={1.4} />
      <directionalLight position={[-6, -4, -8]} intensity={0.5} />
      <Puzzle state={state} animation={animation} onAnimationComplete={onAnimationComplete} />
      <OrbitControls enablePan={false} minDistance={5} maxDistance={14} makeDefault />
    </Canvas>
  );
}
