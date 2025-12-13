import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeScreen from "./components/HomeScreen";
import JogadorScreen from "./components/JogadorScreen";
import Sala from "./components/Sala";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/jogador" element={<JogadorScreen />} />
        <Route path="/sala" element={<Sala />} />
      </Routes>
    </BrowserRouter>
  );
}
