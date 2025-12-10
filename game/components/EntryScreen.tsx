import React, { useState } from "react";
import { db, ref, get, set } from "../firebase";

interface EntryScreenProps {
  onJoin: (roomId: string, playerName: string, role: 'narrator' | 'player') => void;
}

export default function EntryScreen({ onJoin }: EntryScreenProps) {
  const [nick, setNick] = useState("");
  const [taverna, setTaverna] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<'narrator' | 'player'>('player');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nick.trim() || !taverna.trim() || !senha.trim()) return;

    setIsLoading(true);
    const cleanTaverna = taverna.trim().toLowerCase();
    const roomRef = ref(db, `rooms/${cleanTaverna}`);

    try {
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();

      if (role === 'narrator') {
        // NARRADOR LOGIC
        if (!roomData) {
          // Create new room if it doesn't exist
          await set(roomRef, {
            password: senha,
            createdAt: Date.now(),
            createdBy: nick
          });
          onJoin(cleanTaverna, nick.trim(), role);
        } else {
          // Room exists, verify password
          if (roomData.password === senha) {
             onJoin(cleanTaverna, nick.trim(), role);
          } else {
             alert("Senha incorreta para assumir esta Taverna.");
             setIsLoading(false);
          }
        }
      } else {
        // JOGADOR LOGIC
        if (!roomData) {
          alert("Esta Taverna não existe. Peça ao Narrador para abri-la primeiro.");
          setIsLoading(false);
          return;
        }

        if (roomData.password === senha) {
          onJoin(cleanTaverna, nick.trim(), role);
        } else {
          alert("Senha da Taverna incorreta.");
          setIsLoading(false);
        }
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com a guilda (Firebase). Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#050505]">
      <div className="w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 7V17" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 7V17" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tighter">
          SALA MÍSTICA
        </h1>
        <p className="text-gray-500 text-center mb-8 text-xs uppercase tracking-widest">
          Sistema de RPG de Mesa Virtual
        </p>

        {/* ROLE TABS */}
        <div className="flex mb-6 bg-[#111] p-1 rounded-lg border border-[#333]">
          <button
            onClick={() => setRole('player')}
            className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all ${
              role === 'player' ? 'bg-[#222] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Jogador
          </button>
          <button
            onClick={() => setRole('narrator')}
            className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all ${
              role === 'narrator' ? 'bg-purple-900/50 text-purple-200 shadow-md border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Narrador
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seu Nick</label>
            <input
              type="text"
              className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700"
              placeholder="Ex: Gandalf, O Cinzento"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome da Taverna</label>
            <input
              type="text"
              className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700"
              placeholder="Ex: masmorra-do-dragao"
              value={taverna}
              onChange={(e) => setTaverna(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senha da Taverna</label>
            <input
              type="password"
              className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700"
              placeholder={role === 'narrator' ? "Crie uma senha segura" : "Digite a senha da sala"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={!nick || !taverna || !senha || isLoading}
            className={`w-full font-bold py-4 mt-4 transition-all flex items-center justify-center group border border-[#333] hover:border-purple-500 ${
               isLoading ? 'bg-gray-800 cursor-wait' : 'bg-[#1a1a1a] hover:bg-purple-900 text-white'
            }`}
          >
            {isLoading ? (
               <span className="text-gray-400">Verificando com os deuses...</span>
            ) : (
              <>
                <span className="mr-2">{role === 'narrator' ? 'Abrir Taverna' : 'Entrar na Aventura'}</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-[10px] text-gray-700 font-mono">
          v2.1.0 • SISTEMA RPG ONLINE
        </div>
      </div>
    </div>
  );
}
