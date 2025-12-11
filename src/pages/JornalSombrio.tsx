import { useNavigate } from 'react-router-dom';
import './style.css'; // se quiser reaproveitar o style.css

export default function JornalSombrio() {
  const navigate = useNavigate();

  return (
    <div className="jornal-sombrio">
      <h1>📰 Jornal Sombrio</h1>
      <p>Notícias da Taverna e além...</p>
      <button onClick={() => navigate('/game')}>
        Entrar na Taverna
      </button>
    </div>
  );
}
