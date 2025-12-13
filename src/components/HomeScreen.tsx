import React from "react";
import { useNavigate } from "react-router-dom";
import TavernaFrame from "./TavernaFrame";

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <TavernaFrame>
      <div style={{ textAlign: "center" }}>
        <img src="/assets/d20.png" alt="D20" style={{ width: 64, height: 64, marginBottom: 16 }} />
        <h1 className="taverna-title">Bem-vindo à Taverna</h1>
        <p className="taverna-subtitle">
          Entre para rolar dados, ver salas e acompanhar novidades do mundo sombrio.
        </p>
        <button className="taverna-button" onClick={() => navigate("/jogador")}>
          Área do jogador
        </button>
      </div>
    </TavernaFrame>
  );
}
