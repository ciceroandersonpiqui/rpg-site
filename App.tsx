import { BrowserRouter, Routes, Route } from 'react-router-dom';
import JornalSombrio from '@/pages/JornalSombrio';
import EntryScreen from '@/components/EntryScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JornalSombrio />} />
        <Route path="/game" element={<EntryScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
