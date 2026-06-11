import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Group, Vector3 } from 'three';

import type { CubeState, FaceName } from '../api/types';
import type { PendingAnimation } from '../state/useCubeSession';
import { colorOf } from './colors';
import { buildCubelets, rotationFor, scenePosition, type Cubelet } from './geometry';

const STICKER_OFFSET = 0.501;
const STICKER_SIZE = 0.92;
const QUARTER_TURN_SECONDS = 0.28;

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
      <mesh>
        <boxGeometry args={[0.97, 0.97, 0.97]} />
        <meshStandardMaterial color="#15151a" roughness={0.85} />
      </mesh>
      {Object.entries(cubelet.stickers).map(([face, letter]) => {
        const placement = STICKER_PLACEMENTS[face as FaceName];
        return (
          <mesh key={face} position={placement.position} rotation={placement.rotation}>
            <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
            <meshStandardMaterial color={colorOf(letter)} roughness={0.35} />
          </mesh>
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

  const cubelets = useMemo(() => buildCubelets(state), [state]);
  const rotation = useMemo(
    () => (animation ? rotationFor(animation.move, state.size) : null),
    [animation, state.size],
  );

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
  }, [animation]);

  useFrame((_, delta) => {
    if (!rotation || finished.current || !rotatingGroup.current) {
      return;
    }

    const duration = (Math.abs(rotation.angle) / (Math.PI / 2)) * QUARTER_TURN_SECONDS;
    progress.current = Math.min(1, progress.current + delta / duration);

    const angle = easeInOutCubic(progress.current) * rotation.angle;
    rotatingGroup.current.quaternion.setFromAxisAngle(
      new Vector3(...rotation.axis).normalize(),
      angle,
    );

    if (progress.current >= 1) {
      finished.current = true;
      onAnimationComplete();
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
 * is revealed by the session hook.
 */
export function Cube3D({ state, animation, onAnimationComplete }: Cube3DProps) {
  return (
    <Canvas camera={{ position: [4.4, 3.6, 5.6], fov: 42 }} aria-label="3D cube view">
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 10, 8]} intensity={1.4} />
      <directionalLight position={[-6, -4, -8]} intensity={0.5} />
      <Puzzle state={state} animation={animation} onAnimationComplete={onAnimationComplete} />
      <OrbitControls enablePan={false} minDistance={5} maxDistance={14} makeDefault />
    </Canvas>
  );
}
