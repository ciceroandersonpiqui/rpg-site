import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Die from "./Die";
import { db, ref, push, serverTimestamp } from "../firebase";
import TavernaFrame from "./TavernaFrame";

export default function Sala() {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);

    // gera número aleatório de 1 a 12
    const roll = Math.floor(Math.random() * 12) + 1;

    // simula tempo de rolagem
    setTimeout(() => {
      setResult(roll);
      setIsRolling(false);

      // salva no Firebase
      const rollsRef = ref(db, "salas/default/rolls");
      push(rollsRef, {
        value: roll,
        timestamp: serverTimestamp(),
      });
    }, 2000);
  };

  return (
    <TavernaFrame>
      <div style={{ textAlign: "center" }}>
        <h2 className="taverna-title">Sala de Rolagem</h2>
        <p className="taverna-subtitle">Clique para jogar o dado da sala</p>
        <button
          className="taverna-button"
          onClick={handleRoll}
          disabled={isRolling}
        >
          {isRolling ? "Rolando..." : "Jogar dado da sala"}
        </button>

        <div style={{ marginTop: 24 }}>
          <Canvas style={{ height: "60vh" }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <Die isRolling={isRolling} result={result} onRoll={handleRoll} />
          </Canvas>
        </div>

        {result && (
          <p style={{ marginTop: 16 }}>
            Último resultado: <strong>{result}</strong>
          </p>
        )}
      </div>
    </TavernaFrame>
  );
}
