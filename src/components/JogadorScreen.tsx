import React from "react";
import { useNavigate } from "react-router-dom";
import TavernaFrame from "./TavernaFrame";

export default function JogadorScreen() {
  const navigate = useNavigate();

  return (
    <TavernaFrame>
      <div style={{ textAlign: "center" }}>
        <h2 className="taverna-title">Área do jogador</h2>
        <p className="taverna-subtitle">Escolha o que deseja acessar.</p>
        <div style={{ display: "grid", gap: 12, justifyContent: "center" }}>
          <button className="taverna-button" onClick={() => navigate("/sala")}>
            Entrar nas salas
          </button>
          <button className="taverna-button" disabled style={{ opacity: 0.6 }}>
            Planilhas geradas (em breve)
          </button>
        </div>
      </div>
    </TavernaFrame>
  );
}
