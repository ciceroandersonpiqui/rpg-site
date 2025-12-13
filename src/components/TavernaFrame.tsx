import React from "react";
import "../styles/taverna.css"; // importa o CSS compartilhado

export default function TavernaFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="taverna-frame">
      <div className="taverna-border">
        {children}
      </div>
    </div>
  );
}
