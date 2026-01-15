
import React, { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows, 
  MeshReflectorMaterial,
  Float,
  Text
} from '@react-three/drei';
import * as THREE from 'three';
import { Physics, useSphere, useBox, usePlane } from '@react-three/cannon';
import { GameState, GameMode, MarbleType, Player, GameSettings } from '../types';

// Extend JSX.IntrinsicElements to include React Three Fiber elements
// This fix addresses the "Property '...' does not exist on type 'JSX.IntrinsicElements'" errors.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface GameSceneProps {
  gameState: GameState;
  settings: GameSettings;
  onTossComplete: (distances: number[]) => void;
  onGameOver: (winnerId: number) => void;
  currentPlayerIndex: number;
  setCurrentPlayerIndex: (idx: number) => void;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}

// 50 x 100 Desk
const DESK_WIDTH = 50;
const DESK_LENGTH = 100;
const GILL_RADIUS = 3;

const Desk = ({ difficulty }: { difficulty: GameMode }) => {
  const gillSize = difficulty === GameMode.EASY ? 5 : difficulty === GameMode.MEDIUM ? 3.5 : 2.5;

  // Floor Physics
  const [ref] = useBox(() => ({ 
    type: 'Static', 
    args: [DESK_WIDTH, 1, DESK_LENGTH], 
    position: [0, -0.5, 0],
    friction: difficulty === GameMode.HARD ? 0.3 : 0.1
  }));

  // Walls
  useBox(() => ({ type: 'Static', args: [1, 5, DESK_LENGTH], position: [DESK_WIDTH / 2 + 0.5, 2, 0] }));
  useBox(() => ({ type: 'Static', args: [1, 5, DESK_LENGTH], position: [-DESK_WIDTH / 2 - 0.5, 2, 0] }));
  useBox(() => ({ type: 'Static', args: [DESK_WIDTH, 5, 1], position: [0, 2, DESK_LENGTH / 2 + 0.5] }));
  useBox(() => ({ type: 'Static', args: [DESK_WIDTH, 5, 1], position: [0, 2, -DESK_LENGTH / 2 - 0.5] }));

  return (
    <group>
      {/* Base of the desk */}
      <mesh ref={ref as any}>
        <boxGeometry args={[DESK_WIDTH, 1, DESK_LENGTH]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#151515"
          metalness={0.5}
        />
      </mesh>
      
      {/* The Gill (Hole) visual only */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[0, gillSize, 64]} />
        <meshBasicMaterial color="#white" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[gillSize, gillSize + 0.5, 64]} />
        <meshBasicMaterial color="#white" transparent opacity={0.2} />
      </mesh>

      {/* Grid pattern */}
      <gridHelper args={[DESK_LENGTH, 20, 0x333333, 0x111111]} position={[0, 0.01, 0]} />
    </group>
  );
};

const Marble = ({ 
  player, 
  isCurrent, 
  position, 
  onFlick, 
  onImpact,
  inGill,
  onEnterGill
}: { 
  player: Player, 
  isCurrent: boolean, 
  position: [number, number, number],
  onFlick: (velocity: [number, number, number]) => void,
  onImpact: (otherPlayerId: number) => void,
  inGill: boolean,
  onEnterGill: () => void
}) => {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [1],
    linearDamping: 0.1,
    angularDamping: 0.1,
    onCollide: (e) => {
      // Check for collision with other marble
      if (e.contact.impactVelocity > 0.5) {
        if (typeof e.body.userData?.playerId === 'number') {
          onImpact(e.body.userData.playerId);
        }
      }
    },
    userData: { playerId: player.id }
  }));

  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<THREE.Vector3 | null>(null);
  const { camera, raycaster, mouse } = useThree();

  useFrame(() => {
    // Detect if inside Gill
    const pos = new THREE.Vector3();
    ref.current?.getWorldPosition(pos);
    const distToCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    if (!inGill && distToCenter < GILL_RADIUS) {
      onEnterGill();
    }
  });

  const onPointerDown = (e: any) => {
    if (!isCurrent) return;
    e.stopPropagation();
    setDragging(true);
    const pos = new THREE.Vector3();
    ref.current?.getWorldPosition(pos);
    dragStart.current = pos;
  };

  const onPointerUp = (e: any) => {
    if (!dragging) return;
    setDragging(false);
    
    // Calculate vector from mouse to marble for power
    // Simplified flick: inverse of mouse offset
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);
    
    if (dragStart.current) {
      const forceVec = new THREE.Vector3().subVectors(dragStart.current, intersect);
      const strength = Math.min(forceVec.length() * 5, 100);
      forceVec.normalize().multiplyScalar(strength);
      
      api.applyImpulse([forceVec.x, 0, forceVec.z], [0, 0, 0]);
      onFlick([forceVec.x, 0, forceVec.z]);
    }
    dragStart.current = null;
  };

  return (
    <group>
      <mesh 
        ref={ref as any} 
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        {player.type === MarbleType.RAINBOW ? (
          <MeshReflectorMaterial
            resolution={512}
            mixBlur={1}
            mixStrength={2}
            roughness={0.1}
            mirror={1}
            color="#pink"
          >
            <meshStandardMaterial metalness={1} roughness={0} />
          </MeshReflectorMaterial>
        ) : (
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
        )}
        
        {isCurrent && (
          <mesh rotation-x={-Math.PI / 2} position={[0, -1, 0]}>
            <ringGeometry args={[1.5, 1.6, 32]} />
            <meshBasicMaterial color="#pink" transparent opacity={0.5} />
          </mesh>
        )}
      </mesh>
      
      {/* Visual Indicator for dragging */}
      {dragging && dragStart.current && (
         <DraggingIndicator origin={dragStart.current} />
      )}
    </group>
  );
};

const DraggingIndicator = ({ origin }: { origin: THREE.Vector3 }) => {
  const { raycaster } = useThree();
  const [target, setTarget] = useState(new THREE.Vector3());

  useFrame(() => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);
    setTarget(intersect);
  });

  const points = useMemo(() => [origin, target], [origin, target]);
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  // Use primitive to avoid collision with SVG line element in JSX
  const line = useMemo(() => new THREE.Line(lineGeometry), [lineGeometry]);

  return (
    <primitive object={line}>
      <lineBasicMaterial attach="material" color="#white" transparent opacity={0.5} />
    </primitive>
  );
};

const GameManager = ({ 
  gameState, 
  settings, 
  onTossComplete, 
  onGameOver,
  currentPlayerIndex,
  setCurrentPlayerIndex,
  players,
  setPlayers
}: GameSceneProps) => {
  const [turnComplete, setTurnComplete] = useState(false);
  const p1Pos: [number, number, number] = [0, 2, 40];
  const p2Pos: [number, number, number] = [0, 2, -40];

  const handleFlick = (velocity: [number, number, number]) => {
    // Start tracking turn end after a short delay to allow movement
    setTimeout(() => {
      setTurnComplete(true);
    }, 2000);
  };

  useEffect(() => {
    if (turnComplete) {
      if (gameState === GameState.TOSS_PHASE) {
        // Simple mock for toss calculation based on final pos
        // In a real app we'd wait for sleep
        onTossComplete([Math.random() * 50, Math.random() * 50]);
      } else if (gameState === GameState.PLAYING) {
        setCurrentPlayerIndex(currentPlayerIndex === 0 ? 1 : 0);
      }
      setTurnComplete(false);
    }
  }, [turnComplete, gameState, currentPlayerIndex]);

  const handleImpact = (id: number) => {
    // If current player has reached gill and hits opponent, game over
    const attacker = players[currentPlayerIndex];
    if (attacker.hasReachedGill && id !== attacker.id) {
      onGameOver(attacker.id);
    }
  };

  const handleEnterGill = (playerId: number) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, hasReachedGill: true } : p));
  };

  return (
    <group>
      <Desk difficulty={settings.difficulty} />
      
      {/* Player 1 Marble */}
      <Marble 
        player={players[0]}
        isCurrent={gameState !== GameState.START && currentPlayerIndex === 0}
        position={p1Pos}
        onFlick={handleFlick}
        onImpact={(id) => handleImpact(id)}
        inGill={players[0].hasReachedGill}
        onEnterGill={() => handleEnterGill(players[0].id)}
      />

      {/* Player 2 Marble */}
      <Marble 
        player={players[1]}
        isCurrent={gameState !== GameState.START && currentPlayerIndex === 1}
        position={p2Pos}
        onFlick={handleFlick}
        onImpact={(id) => handleImpact(id)}
        inGill={players[1].hasReachedGill}
        onEnterGill={() => handleEnterGill(players[1].id)}
      />
    </group>
  );
};

const GameScene: React.FC<GameSceneProps> = (props) => {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={[0, 60, 80]} fov={40} />
      <OrbitControls 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={30}
        maxDistance={120}
      />
      
      {/* Scene environment setup */}
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 50, 200]} />
      
      <ambientLight intensity={0.5} />
      <spotLight position={[50, 50, 50]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={1} color="#444" />
      
      <Suspense fallback={null}>
        <Physics gravity={[0, -30, 0]} defaultContactMaterial={{ friction: 0.1, restitution: 0.7 }}>
          <GameManager {...props} />
        </Physics>
        
        <Environment preset="night" />
        <ContactShadows position={[0, -0.49, 0]} opacity={0.6} scale={150} blur={2} far={10} color="#000000" />
      </Suspense>

      {/* Background visual element */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, -10, -100]} scale={20}>
          <octahedronGeometry />
          <meshStandardMaterial color="#111" wireframe />
        </mesh>
      </Float>
    </Canvas>
  );
};

export default GameScene;

