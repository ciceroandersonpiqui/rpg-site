import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Edges } from "@react-three/drei";
import * as THREE from "three";

type Phase = "idle" | "rolling" | "postRoll";

function Die({ isRolling, result, onRoll }: { isRolling: boolean; result: number | null; onRoll: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const [faces, setFaces] = useState<{ pos: THREE.Vector3; norm: THREE.Vector3; quat: THREE.Quaternion }[]>([]);

  const rotationVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const initialDir = useRef(new THREE.Vector3());
  const flashIntensity = useRef(0);
  const scale = useRef(1.8);
  const phase = useRef<Phase>("idle");
  const phaseStart = useRef(0);

  // parâmetros
  const MAX_ROLL_SPEED = 9;            // velocidade inicial alta controlada
  const ROLL_DECAY = 1;            // desaceleração leve durante rolling
  const POST_DECAY = 0.2;             // desaceleração suave após receber o valor
  const ALIGN_SPEED_THRESHOLD = 0.35;  // começa a alinhar quando velocidade ficar abaixo disso
  const PRE_ALIGN_MIN_TIME = 0;      // tempo mínimo girando antes de alinhar (ms)
  const TOTAL_SHOW_TIME = 8000;        // tempo total antes de voltar ao idle (ms)
  const ALIGN_SLERP_RATE = 2.2;        // taxa de slerp para apontar a face correta
  const ANGLE_LIMIT = Math.PI * 0.5;  // ~20° limite para não inverter direção inicial
  const MIN_SPEED = 0.8;               // velocidade mínima durante rolling
  const RESIDUAL_MIN = 0.2;           // residual mínima na pós-rolagem
  const BOOST_FACTOR = 3.0;            // coice ao receber valor, na mesma direção atual

  // rotação inicial aleatória
  useEffect(() => {
    if (meshRef.current && result === null) {
      meshRef.current.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
    }
  }, [result]);

  // fase e setup
  useEffect(() => {
    if (isRolling) {
      phase.current = "rolling";
      phaseStart.current = Date.now();
      flashIntensity.current = 0;
      scale.current = 1.4;

      rotationVelocity.current.set(
        MAX_ROLL_SPEED * (0.7 + Math.random() * 0.3),
        MAX_ROLL_SPEED * (0.7 + Math.random() * 0.3),
        MAX_ROLL_SPEED * 0.6
      );

      // guarda direção inicial para proteção
      initialDir.current.copy(rotationVelocity.current).normalize();
    } else if (result !== null) {
      phase.current = "postRoll";
      phaseStart.current = Date.now();
      flashIntensity.current = 2.8;
      scale.current = 1.85;

      // coice na direção atual (sem inverter força)
      const boost = rotationVelocity.current.clone().normalize().multiplyScalar(BOOST_FACTOR);
      rotationVelocity.current.add(boost);

      // efeito de flash extra se cair 1
      if (result === 1 && materialRef.current) {
        materialRef.current.emissive.set("#ff0000");
        flashIntensity.current = 4.2;
        setTimeout(() => {
          if (materialRef.current) {
            materialRef.current.emissive.set("#4c1d95");
          }
        }, 1000);
      }
    } else {
      phase.current = "idle";
      phaseStart.current = Date.now();
      scale.current = 1.8;
    }
  }, [isRolling, result]);

  // calcular faces do dodecaedro
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const geom = new THREE.DodecahedronGeometry(1, 0);
    const normalAttribute = geom.attributes.normal;
    const uniqueFaces: { pos: THREE.Vector3; norm: THREE.Vector3; quat: THREE.Quaternion }[] = [];

    for (let i = 0; i < normalAttribute.count; i += 3) {
      const normal = new THREE.Vector3().fromBufferAttribute(normalAttribute, i);
      const exists = uniqueFaces.find((f) => f.norm.distanceTo(normal) < 0.1);
      if (!exists) {
        const faceCenter = normal.clone().multiplyScalar(0.82);
        const quat = new THREE.Quaternion();
        quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        uniqueFaces.push({ pos: faceCenter, norm: normal, quat });
      }
    }

    uniqueFaces.sort((a, b) => a.pos.y - b.pos.y);
    setFaces(uniqueFaces);
  }, []);

  // util: aplicar rotação por velocidade angular
  function applyAngularVelocity(mesh: THREE.Mesh, delta: number, factor = 1) {
    mesh.rotation.x += rotationVelocity.current.x * delta * factor;
    mesh.rotation.y += rotationVelocity.current.y * delta * factor;
    mesh.rotation.z += rotationVelocity.current.z * delta * factor;
  }

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const mesh = meshRef.current;

    // scale animado
    const currentScale = mesh.scale.x;
    const targetScale = scale.current;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 3);
    mesh.scale.set(newScale, newScale, newScale);

    // flash emissivo
    if (flashIntensity.current > 0) {
      flashIntensity.current = THREE.MathUtils.lerp(flashIntensity.current, 0, delta * 2);
      if (materialRef.current) {
        materialRef.current.emissiveIntensity = 0.2 + flashIntensity.current;
      }
    }

    // fases de movimento
    if (phase.current === "idle") {
      mesh.rotation.x += Math.sin(t * 0.8) * 0.003;
      mesh.rotation.y += Math.cos(t * 0.8) * 0.003;
      mesh.position.y = 0.1 + Math.sin(t * 1.5) * 0.05;
      rotationVelocity.current.lerp(new THREE.Vector3(0.05, 0.05, 0.03), 0.02);
      applyAngularVelocity(mesh, delta, 0.15);
    }

    if (phase.current === "rolling") {
      // rotação viva com curva senoidal
      mesh.rotation.x += rotationVelocity.current.x * delta * Math.sin(t * 2);
      mesh.rotation.y += rotationVelocity.current.y * delta * Math.cos(t * 2);
      mesh.rotation.z += rotationVelocity.current.z * delta * 0.5;

      // desaceleração leve
      rotationVelocity.current.multiplyScalar(ROLL_DECAY);

      // turbulência protegida: não inverter direção inicial
      const currentDir = rotationVelocity.current.clone().normalize();
      const angle = currentDir.angleTo(initialDir.current);
      if (angle < ANGLE_LIMIT) {
        rotationVelocity.current.x += Math.sin(t * 3.3) * 0.02;
        rotationVelocity.current.y += Math.cos(t * 2.7) * 0.02;
      } else {
        // ruído perpendicular à direção inicial para não anular
        const up = new THREE.Vector3(0, 1, 0);
        let perp = new THREE.Vector3().crossVectors(initialDir.current, up);
        if (perp.lengthSq() < 1e-6) {
          perp = new THREE.Vector3().crossVectors(initialDir.current, new THREE.Vector3(1, 0, 0));
        }
        perp.normalize();
        rotationVelocity.current.addScaledVector(perp, 0.02 * Math.sin(t * 2.1));
      }

      // clamp de velocidade mínima
      if (rotationVelocity.current.length() < MIN_SPEED) {
        rotationVelocity.current.normalize().multiplyScalar(MIN_SPEED);
      }
    }

    if (phase.current === "postRoll") {
      const elapsed = Date.now() - phaseStart.current;

      // mantém rotação e desacelera suave
      rotationVelocity.current.multiplyScalar(POST_DECAY);
      applyAngularVelocity(mesh, delta, 1);

      // variação circular sutil para dar vida
      mesh.rotation.x += Math.sin(t * 1.2) * 0.0015;
      mesh.rotation.y += Math.cos(t * 1.2) * 0.0015;

      // nunca zera: residual mínima
      rotationVelocity.current.x = Math.sign(rotationVelocity.current.x) * Math.max(Math.abs(rotationVelocity.current.x), RESIDUAL_MIN);
      rotationVelocity.current.y = Math.sign(rotationVelocity.current.y) * Math.max(Math.abs(rotationVelocity.current.y), RESIDUAL_MIN);
      rotationVelocity.current.z = Math.sign(rotationVelocity.current.z) * Math.max(Math.abs(rotationVelocity.current.z), RESIDUAL_MIN * 0.7);

      // alinhamento só quando for natural (tempo mínimo + velocidade baixa)
      const speed = rotationVelocity.current.length();
      if (elapsed > PRE_ALIGN_MIN_TIME && speed < ALIGN_SPEED_THRESHOLD && result !== null && faces.length > 0) {
        const faceIndex = (result - 1) % faces.length;
        const targetFace = faces[faceIndex];
        if (targetFace) {
          const targetDir = new THREE.Vector3(0, 0, 1);
          const q = new THREE.Quaternion().setFromUnitVectors(targetFace.norm, targetDir);
          mesh.quaternion.slerp(q, ALIGN_SLERP_RATE * delta);
        }
      }

      // fim do ciclo
      if (elapsed > TOTAL_SHOW_TIME) {
        phase.current = "idle";
      }
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      <mesh ref={meshRef} onPointerDown={() => !isRolling && onRoll()} scale={1.8}>
        <dodecahedronGeometry args={[1, 0]} />
        <Edges threshold={15} color="#a78bfa" scale={1.02} linewidth={3} />
        <meshPhysicalMaterial
          ref={materialRef}
          color="#7c3aed"
          roughness={0}
          metalness={0.2}
          transmission={0.95}
          transparent
          opacity={1}
          thickness={2}
          ior={1.7}
          clearcoat={1}
          attenuationColor="#4c1d95"
          attenuationDistance={1.5}
          emissive="#4c1d95"
          emissiveIntensity={0.2}
        />
        {faces.map((face, i) => {
          const num = i + 1;
          const displayNum = num === 6 || num === 9 ? `${num}.` : `${num}`;
          const textColor = num === 1 ? "#ef4444" : "#ffffff";
          return (
            <group key={i} position={face.pos} quaternion={face.quat}>
              <Text
                color={textColor}
                fontSize={0.32}
                anchorX="center"
                anchorY="middle"
                characters="0123456789."
                renderOrder={1}
                toneMapped={false}
                outlineWidth={0.02}
                outlineColor="#2e1065"
              >
                {displayNum}
              </Text>
            </group>
          );
        })}
      </mesh>
    </group>
  );
}

export default Die;
