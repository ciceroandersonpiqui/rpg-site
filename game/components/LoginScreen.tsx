import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { db, ref, onValue, set, onDisconnect } from "../firebase";

// Dado decorativo com números nas faces
function DecorativeDie() {
  const group = useRef<THREE.Group>(null);
  const [faces, setFaces] = useState<
    { pos: THREE.Vector3; norm: THREE.Vector3; quat: THREE.Quaternion }[]
  >([]);

  useFrame(() => {
    if (group.current) {
      group.current.rotation.x += 0.01;
      group.current.rotation.y += 0.01;
    }
  });

  // calcula centros e orientação das faces
  useLayoutEffect(() => {
    const geom = new THREE.DodecahedronGeometry(1.8, 0);
    const normalAttribute = geom.attributes.normal;
    const uniqueFaces: {
      pos: THREE.Vector3;
      norm: THREE.Vector3;
      quat: THREE.Quaternion;
    }[] = [];

    for (let i = 0; i < normalAttribute.count; i += 3) {
      const normal = new THREE.Vector3().fromBufferAttribute(normalAttribute, i);
      const exists = uniqueFaces.find((f) => f.norm.distanceTo(normal) < 0.1);
      if (!exists) {
        const faceCenter = normal.clone().multiplyScalar(1.5);
        const quat = new THREE.Quaternion();
        quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        uniqueFaces.push({ pos: faceCenter, norm: normal, quat });
      }
    }

    uniqueFaces.sort((a, b) => a.pos.y - b.pos.y);
    setFaces(uniqueFaces);
  }, []);

  return (
    <group ref={group}>
      <mesh>
        <dodecahedronGeometry args={[1.8]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.DodecahedronGeometry(1.8)]} />
        <lineBasicMaterial color="#a855f7" />
      </lineSegments>

      {faces.map((face, i) => {
        const num = i + 1;
        const displayNum = num === 6 || num === 9 ? `${num}.` : `${num}`;
        return (
          <group key={i} position={face.pos} quaternion={face.quat}>
            <Text
              color="#a855f7"
              fontSize={0.8}
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
    </group>
  );
}

export default function LoginScreen({
  onEnter,
}: {
  onEnter: (name: string, roomName: string, mode: "narrator" | "player") => void;
}) {
  const [mode, setMode] = useState<"narrator" | "player">("player");
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // cores por modo
  const borderColor = mode === "narrator" ? "border-purple-500" : "border-blue-500";
  const titleColor = mode === "narrator" ? "text-purple-300" : "text-blue-300";
  const auraClass = mode === "narrator" ? "aura-purple" : "aura-blue";
  const buttonClass =
    mode === "narrator" ? "bg-purple-600 hover:bg-purple-500" : "bg-blue-600 hover:bg-blue-500";

  // cores por campo
  const nickColor = mode === "narrator" ? "text-purple-300" : "text-blue-300";
  const roomColor = mode === "narrator" ? "text-gray-400" : "text-blue-300";
  const keyColor = mode === "narrator" ? "text-purple-300" : "text-blue-300";

  // placeholders
  const roomPlaceholder = mode === "player" ? "Taverna" : "Nome da sala";
  const keyPlaceholder = "Chave";

  // util: 4 dígitos
  const random4 = () => Math.floor(1000 + Math.random() * 9000).toString();

  // checa existência da sala
  const checkRoomExists = (room: string): Promise<boolean> =>
    new Promise((resolve) => {
      const roomRef = ref(db, `rooms/${room}`);
      onValue(roomRef, (snapshot) => resolve(!!snapshot.val()), { onlyOnce: true });
    });

  // geração automática de sala para narrador (sem "taverna" no prefixo)
  useEffect(() => {
    let cancelled = false;
    async function generateUniqueRoom() {
      if (mode !== "narrator") return;
      const baseNick = (name || "narrador").trim().toLowerCase().replace(/\s+/g, "-");
      for (let i = 0; i < 10; i++) {
        const candidate = `${baseNick}-${random4()}`;
        const exists = await checkRoomExists(candidate);
        if (!exists) {
          if (!cancelled) setRoomName(candidate);
          break;
        }
      }
    }
    generateUniqueRoom();
    return () => {
      cancelled = true;
    };
  }, [name, mode]);

  // quando alterna para jogador, opcionalmente preencher "Taverna" como valor inicial
  useEffect(() => {
    if (mode === "player" && !roomName) {
      setRoomName("Taverna"); // deixe vazio se preferir só placeholder; troque por "Taverna" para valor inicial
    }
  }, [mode]);

  const handleEnter = () => {
    if (!name.trim()) {
      setError("Preencha seu nick para entrar!");
      return;
    }

    if (mode === "player") {
      if (!roomName.trim() || !password.trim()) {
        setError("Preencha o nome da sala e a chave para entrar!");
        return;
      }
      const roomRef = ref(db, `rooms/${roomName}`);
      onValue(
        roomRef,
        (snapshot) => {
          const room = snapshot.val();
          if (!room || !room.narratorOnline) {
            setError("Sala não está ativa, o narrador saiu.");
            return;
          }
          if (room.password && room.password !== password) {
            setError("Chave inválida!");
            return;
          }
          const players = room.players || {};
          if (Object.keys(players).includes(name)) {
            setError("Já existe alguém com esse nick na sala!");
            return;
          }
          setError("");
          onEnter(name, roomName, mode);
        },
        { onlyOnce: true }
      );
    } else {
      if (!roomName.trim()) {
        setError("O sistema ainda está gerando o nome da sala.");
        return;
      }
      if (!/^\d{4}$/.test(password.trim())) {
        setError("Defina a sua chave com 4 dígitos.");
        return;
      }

      const roomRef = ref(db, `rooms/${roomName}`);
      // cria sala com narrador ativo
      set(roomRef, {
        password,
        players: {},
        createdBy: name,
        createdAt: Date.now(),
        narratorOnline: true,
      });
      // remove sala automaticamente ao desconectar o narrador
      onDisconnect(roomRef).remove();

      setError("");
      onEnter(name, roomName, mode);
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {error}
        </div>
      )}

      <div
        className={`rounded-xl border ${borderColor} p-8 flex flex-col items-center gap-4 w-96 transition-colors duration-500 ${auraClass}`}
        style={{ backgroundColor: "#000" }}
      >
        <div className="h-40 w-40">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[0, 0, 5]} color="#a855f7" intensity={2} />
            <DecorativeDie />
          </Canvas>
        </div>

        <h1 className={`text-2xl font-semibold ${titleColor}`}>Bem-vindo à Taverna</h1>

        {/* Interruptor */}
        <div className="flex items-center gap-4">
          <span className="text-blue-400 font-semibold">Jogador</span>
          <div
            className="relative w-24 h-6 bg-gray-700 rounded-full cursor-pointer"
            onClick={() => setMode(mode === "narrator" ? "player" : "narrator")}
          >
            <div
              className={`absolute top-0 h-6 w-12 rounded-full transition-all duration-500 ${
                mode === "narrator" ? "left-12 bg-purple-600" : "left-0 bg-blue-600"
              }`}
            />
          </div>
          <span className="text-purple-400 font-semibold">Narrador</span>
        </div>

        {/* Nick */}
        <input
          type="text"
          placeholder="Seu nick"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full p-2 rounded-md bg-black border ${borderColor} ${nickColor} text-center font-semibold transition-colors duration-500`}
        />

        {/* Sala (atalho sala|chave no modo jogador) */}
        <input
          type="text"
          placeholder={roomPlaceholder}
          value={roomName}
          onChange={(e) => {
            const value = e.target.value;
            if (mode === "player") {
              const parts = value.split("|").map((p) => p.trim());
              if (parts.length === 2) {
                setRoomName(parts[0]);
                setPassword(parts[1]);
              } else {
                setRoomName(value);
              }
            } else {
              setRoomName(value);
            }
          }}
          disabled={mode === "narrator"}
          className={`w-full p-2 rounded-md bg-black border ${borderColor} ${roomColor} text-center font-semibold transition-colors duração-500`}
        />

        {/* Chave */}
        <input
          type="password"
          placeholder={keyPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full p-2 rounded-md bg-black border ${borderColor} ${keyColor} text-center font-semibold transition-colors duration-500`}
        />

        <button
          onClick={handleEnter}
          className={`w-full p-2 rounded-md ${buttonClass} transition-colors duration-500 text-white font-semibold`}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
