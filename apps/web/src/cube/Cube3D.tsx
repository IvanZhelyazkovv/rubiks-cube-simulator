import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  Group,
  MeshStandardMaterial,
  Plane,
  PlaneGeometry,
  Raycaster,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry, type OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import type { CubeState, FaceName } from '../api/types';
import type { PendingAnimation } from '../state/useCubeSession';
import { STICKER_COLORS, colorOf } from './colors';
import { formatMove } from './notation';
import {
  buildCubelets,
  faceNormal,
  resolveDragMove,
  rotationFor,
  scenePosition,
  type Cubelet,
} from './geometry';

const STICKER_OFFSET = 0.501;
const QUARTER_TURN_SECONDS = 0.28;

/** How far (in scene units) a drag must travel before it counts as a turn. */
const DRAG_THRESHOLD = 0.35;

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
  onStickerPointerDown?: (
    face: FaceName,
    cubelet: Cubelet,
    event: ThreeEvent<PointerEvent>,
  ) => void;
  onStickerHover?: (hovering: boolean) => void;
}

function CubeletMesh({ cubelet, size, onStickerPointerDown, onStickerHover }: CubeletMeshProps) {
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
            onPointerDown={
              onStickerPointerDown &&
              ((event) => onStickerPointerDown(face as FaceName, cubelet, event))
            }
            onPointerOver={onStickerHover && (() => onStickerHover(true))}
            onPointerOut={onStickerHover && (() => onStickerHover(false))}
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
  onMove?: (notation: string) => void;
}

function Puzzle({ state, animation, onAnimationComplete, onMove }: PuzzleProps) {
  const rotatingGroup = useRef<Group>(null);
  const progress = useRef(0);
  const finished = useRef(false);
  const invalidate = useThree((three) => three.invalidate);
  const camera = useThree((three) => three.camera);
  const gl = useThree((three) => three.gl);
  // Orbit controls are an external, mutable three.js object; fetching them
  // imperatively at event time keeps render-scope values immutable.
  const getThree = useThree((three) => three.get);
  const orbitControls = useCallback(
    () => getThree().controls as OrbitControlsImpl | null,
    [getThree],
  );

  /** An in-progress sticker drag: where it started and the plane it moves in. */
  const dragRef = useRef<{
    face: FaceName;
    cubelet: Cubelet;
    start: Vector3;
    plane: Plane;
  } | null>(null);
  const hoveringSticker = useRef(false);

  /** Cursor affordance: grab over draggable stickers, grabbing during a drag. */
  const setCursor = useCallback(
    (cursor: '' | 'grab' | 'grabbing') => {
      getThree().gl.domElement.style.cursor = cursor;
    },
    [getThree],
  );

  const handleStickerHover = (hovering: boolean) => {
    hoveringSticker.current = hovering;
    if (!dragRef.current) {
      setCursor(hovering && onMove && !animation ? 'grab' : '');
    }
  };

  /** Abandons the current drag and restores orbiting. */
  const cancelDrag = useCallback(() => {
    if (dragRef.current) {
      dragRef.current = null;
      setCursor('');
      const controls = orbitControls();
      if (controls) {
        controls.enabled = true;
      }
    }
  }, [orbitControls, setCursor]);

  // An animation starting mid-gesture invalidates the drag (it was aimed at
  // the previous state); when it ends, refresh the hover cursor in place.
  useEffect(() => {
    if (animation) {
      cancelDrag();
    }
    if (!dragRef.current) {
      setCursor(hoveringSticker.current && onMove && !animation ? 'grab' : '');
    }
  }, [animation, onMove, cancelDrag, setCursor]);

  const beginDrag = (face: FaceName, cubelet: Cubelet, event: ThreeEvent<PointerEvent>) => {
    // Drags are resolved against the displayed state, so they only start
    // while no turn is animating.
    if (!onMove || animation) {
      return;
    }

    event.stopPropagation();
    const start = event.point.clone();
    dragRef.current = {
      face,
      cubelet,
      start,
      plane: new Plane().setFromNormalAndCoplanarPoint(new Vector3(...faceNormal(face)), start),
    };
    setCursor('grabbing');

    // Orbiting pauses while the pointer is turning a layer.
    const controls = orbitControls();
    if (controls) {
      controls.enabled = false;
    }
  };

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const hit = new Vector3();

    const endDrag = cancelDrag;

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }

      // Follow the pointer on the grabbed face's plane; the drag vector is the
      // world-space path travelled since the sticker was grabbed.
      const rect = element.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(drag.plane, hit)) {
        return;
      }

      const delta = hit.clone().sub(drag.start);
      if (delta.length() < DRAG_THRESHOLD) {
        return;
      }

      const move = resolveDragMove(
        drag.face,
        drag.cubelet.grid,
        [delta.x, delta.y, delta.z],
        state.size,
      );
      endDrag();
      if (move && onMove) {
        onMove(formatMove(move));
      }
    };

    // The whole gesture lives on the window: a fast drag often leaves the
    // canvas (especially on phones, where it is small) before resolving.
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      endDrag();
    };
  }, [gl, camera, cancelDrag, onMove, state.size]);

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

    // With an on-demand frameloop the first delta after an idle period spans
    // the whole gap; unclamped it would snap the turn instead of animating it.
    const frameDelta = Math.min(delta, 1 / 30);
    progress.current = Math.min(1, progress.current + frameDelta / rotation.duration);

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
          <CubeletMesh
            key={cubelet.key}
            cubelet={cubelet}
            size={state.size}
            onStickerPointerDown={beginDrag}
            onStickerHover={handleStickerHover}
          />
        ))}
      </group>
      {layers.still.map((cubelet) => (
        <CubeletMesh
          key={cubelet.key}
          cubelet={cubelet}
          size={state.size}
          onStickerPointerDown={beginDrag}
          onStickerHover={handleStickerHover}
        />
      ))}
    </group>
  );
}

export interface Cube3DProps {
  state: CubeState;
  animation: PendingAnimation | null;
  onAnimationComplete: () => void;
  /** Receives Singmaster notation when the user turns a layer by dragging a sticker. */
  onMove?: (notation: string) => void;
}

/**
 * The interactive 3D cube: drag a sticker to turn its layer, drag the
 * background to orbit, scroll to zoom. Face turns play as smooth layer
 * rotations; when a turn finishes the authoritative server state is revealed
 * by the session hook. The canvas renders on demand, so an idle cube costs no
 * GPU time.
 */
export function Cube3D({ state, animation, onAnimationComplete, onMove }: Cube3DProps) {
  return (
    <Canvas frameloop="demand" dpr={[1, 2]} camera={{ position: [4.4, 3.6, 5.6], fov: 42 }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 10, 8]} intensity={1.4} />
      <directionalLight position={[-6, -4, -8]} intensity={0.5} />
      <Puzzle
        state={state}
        animation={animation}
        onAnimationComplete={onAnimationComplete}
        onMove={onMove}
      />
      <OrbitControls enablePan={false} minDistance={5} maxDistance={14} makeDefault />
    </Canvas>
  );
}
