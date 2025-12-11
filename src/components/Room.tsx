import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Float } from "@react-three/drei";
import { db, ref, set, onValue } from "../firebase";
import Die from "./Die";

export default function Room({ roomId, playerName, role, onExit }) {
  const [dice, setDice] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [rolling, setRolling] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [lastRollTime, setLastRollTime] = useState(0);

  // presença
  useEffect(() => {
    const userRef = ref(db, `rooms/${roomId}/players/${playerName}`);
    set(userRef, { name: playerName, role, online: true, lastActive: Date.now() });
    return () => set(userRef, null);
  }, [roomId, playerName, role]);

  // escuta jogadores
  useEffect(() => {
    const playersRef = ref(db, `rooms/${roomId}/players`);
    onValue(playersRef, (snap) => {
      const data = snap.val();
      setUsers(data ? Object.values(data) : []);
    });
  }, [roomId]);

  // escuta dado
  useEffect(() => {
    const diceRef = ref(db, `rooms/${roomId}/dice`);
    onValue(diceRef, (snap) => {
      const d = snap.val();
      if (d) {
        setDice(d);
        setRolling(true);
        setTimeout(() => setRolling(false), d.duration || 3000);
      }
    });
  }, [roomId]);

  // escuta senha da sala
  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomId}`);
    onValue(roomRef, (snap) => {
      const data = snap.val();
      if (data?.password) setRoomPassword(data.password);
    });
  }, [roomId]);

  // jogador ou narrador pede rolagem
  const requestRoll = () => {
    const now = Date.now();
    if (now - lastRollTime < 4000) return; // evita flood
    setLastRollTime(now);

    if (role === "narrator") {
      // narrador rola direto
      const result = Math.floor(Math.random() * 12) + 1;
      const duration = 3000;
      set(ref(db, `rooms/${roomId}/dice`), {
        result,
        rolledBy: "Narrador",
        decidedBy: playerName,
        time: now,
        duration
      });
    } else {
      // jogador envia pedido
      const reqRef = ref(db, `rooms/${roomId}/requests/${crypto.randomUUID()}`);
      set(reqRef, { requestedBy: playerName, time: now });
    }
  };

  // narrador processa pedidos
  useEffect(() => {
    if (role !== "narrator") return;
    const reqRef = ref(db, `rooms/${roomId}/requests`);
    onValue(reqRef, (snap) => {
      const requests = snap.val();
      if (!requests || rolling) return;

      // pega o primeiro pedido
      const [firstReqKey, firstReq] = Object.entries(requests)[0] as [string, any];
      const result = Math.floor(Math.random() * 12) + 1;
      const duration = 3000;

      set(ref(db, `rooms/${roomId}/dice`), {
        result,
        rolledBy: firstReq.requestedBy,
        decidedBy: playerName, // narrador que decidiu
        time: Date.now(),
        duration
      });

      // limpa todos os pedidos
      set(reqRef, null);
    });
  }, [role, roomId, playerName, rolling]);

  const rollResult = dice?.result ?? null;
  const rollerName = dice?.rolledBy ?? "";

  return (
    <div className="h-screen w-full bg-[#050505] relative overflow-hidden">
      {/* TOPO */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-center items-start z-10">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold uppercase">
            {roomId} {roomPassword && ` | ${roomPassword}`}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Para jogar o dado, clique nele
          </p>
        </div>
        <button
          onClick={onExit}
          className="text-white/40 hover:text-white text-sm font-bold uppercase absolute right-6 top-6"
        >
          Sair
        </button>
      </div>

      {/* CENA */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <ambientLight intensity={0.6} />
          <spotLight
            position={[0, -5, 5]}
            intensity={6}
            angle={0.6}
            color="#c4b5fd"
          />
          <pointLight
            position={[0, 0, -6]}
            intensity={30}
            color="#7c3aed"
            distance={20}
          />
          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.15}>
              <Die
                isRolling={rolling}
                result={rollResult}
                onRoll={requestRoll}
              />
            </Float>
          </Suspense>
        </Canvas>
      </div>

      {/* HUD */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
        {rollerName && (
          <div className="mb-6 text-center">
            {rolling ? (
              <p className="text-purple-400 text-sm font-bold">
                {rollerName === "Narrador"
                  ? "O narrador está rolando o dado..."
                  : `O jogador ${rollerName} está rolando o dado...`}
              </p>
            ) : (
              <p
                className={`text-xl font-bold ${
                  rollResult === 1 ? "text-red-500" : "text-white"
                }`}
              >
                {rollerName === "Narrador"
                  ? `O narrador tirou ${rollResult}`
                  : `O jogador ${rollerName} tirou ${rollResult}`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* JOGADORES */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 flex-wrap justify-center z-10">
        {users.slice(0, 6).map((u, i) => (
          <div className="relative" key={i}>
            <div
              className={`absolute inset-0 rounded-md blur-md animate-pulse ${
                u.role === "narrator" ? "bg-yellow-500/40" : "bg-purple-500/40"
              }`}
            ></div>
            <button
              className={`relative px-4 py-2 rounded-md font-bold z-10 ${
                u.role === "narrator"
                  ? "bg-yellow-600 text-black"
                  : "bg-purple-700 text-white"
              }`}
            >
              {u.role === "narrator" ? "👑 " : ""}{u.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
