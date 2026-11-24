import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, RoundedBox } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const PALETTE = ['#EC6206', '#FFA723', '#2F8EE0', '#00457F', '#2BB88F'];

/** A live soroban: 5 rods, beads bob and slide, whole frame follows the pointer. */
function Soroban() {
  const group = useRef<THREE.Group>(null);
  const beads = useRef<THREE.Mesh[]>([]);
  const rods = 6;
  useFrame(({ pointer, clock }) => {
    const g = group.current; if (!g) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, -0.5 + pointer.x * 0.5, 0.06);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.15 - pointer.y * 0.3, 0.06);
    const t = clock.elapsedTime;
    beads.current.forEach((m, i) => { if (m) m.position.y = m.userData.base + Math.sin(t * 1.4 + i) * 0.12 * (m.userData.earth ? 1 : -1); });
  });
  const items = useMemo(() => {
    const out: { x: number; y: number; c: string; earth: boolean }[] = [];
    for (let r = 0; r < rods; r++) {
      const x = (r - (rods - 1) / 2) * 0.62;
      out.push({ x, y: 1.0 - (r % 2) * 0.25, c: PALETTE[r % 5], earth: false });
      for (let b = 0; b < 4; b++) out.push({ x, y: -0.25 - b * 0.3 + (b < (r % 4) ? 0.55 : 0), c: PALETTE[(r + b) % 5], earth: true });
    }
    return out;
  }, []);
  return (
    <group ref={group} position={[0, 0, 0]}>
      <RoundedBox args={[4.4, 3.4, 0.5]} radius={0.12} position={[0, 0, -0.1]}><meshStandardMaterial color="#8a4515" roughness={0.5} /></RoundedBox>
      <RoundedBox args={[3.9, 2.9, 0.62]} radius={0.06} position={[0, 0, -0.05]}><meshStandardMaterial color="#EDF5FA" roughness={0.9} /></RoundedBox>
      <mesh position={[0, 0.5, 0.3]}><boxGeometry args={[3.9, 0.1, 0.1]} /><meshStandardMaterial color="#4a2308" /></mesh>
      {items.map((b, i) => (
        <group key={i}>
          {b.earth === false || true ? null : null}
          <mesh ref={(m) => { if (m) { m.userData = { base: b.y, earth: b.earth }; beads.current[i] = m; } }} position={[b.x, b.y, 0.3]} scale={[1, 0.7, 1]} castShadow>
            <sphereGeometry args={[0.27, 32, 32]} /><meshPhysicalMaterial color={b.c} roughness={0.2} clearcoat={1} />
          </mesh>
          {i % 5 === 0 && <mesh position={[b.x, 0, 0.28]}><cylinderGeometry args={[0.018, 0.018, 2.9, 8]} /><meshStandardMaterial color="#c9b79a" /></mesh>}
        </group>
      ))}
    </group>
  );
}

function Orbs() {
  const arr = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ p: [(Math.random() - 0.5) * 11, (Math.random() - 0.5) * 6, -1 - Math.random() * 4] as [number, number, number], s: 0.12 + Math.random() * 0.3, c: PALETTE[i % 5] })), []);
  return <>{arr.map((o, i) => <Float key={i} speed={1 + (i % 3)} floatIntensity={2} rotationIntensity={1}><mesh position={o.p}><sphereGeometry args={[o.s, 24, 24]} /><meshStandardMaterial color={o.c} roughness={0.25} metalness={0.1} /></mesh></Float>)}</>;
}

/** The flute from the logo, floating. */
function Flute() {
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={1.5}>
      <mesh position={[3.1, 1.9, 0]} rotation={[0, 0, -0.7]}><cylinderGeometry args={[0.09, 0.09, 3, 24]} /><meshStandardMaterial color="#FFA723" roughness={0.3} metalness={0.3} /></mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 5]} intensity={1.6} />
      <Soroban /><Orbs /><Flute />
      <Environment preset="city" />
    </Canvas>
  );
}
