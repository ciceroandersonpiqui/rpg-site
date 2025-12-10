import React, { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Room from "./components/Room";

function App() {
  const [entered, setEntered] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState<"narrator" | "player">("player");

  if (!entered) {
    return (
      <LoginScreen
        onEnter={(name, room, role) => {
          setPlayerName(name);
          setRoomId(room);
          setRole(role);
          setEntered(true);
        }}
      />
    );
  }

  return (
    <Room
      roomId={roomId}
      playerName={playerName}
      role={role}
      onExit={() => setEntered(false)}
    />
  );
}

export default App;
