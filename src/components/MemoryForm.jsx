import React, { useState } from "react";

export default function MemoryForm({ onCreateMemory, onNavigate, canCreate }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [coupleNames, setCoupleNames] = useState('');
  const [startDate, setStartDate] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !message || !startDate || !coupleNames || !musicTitle || !musicArtist) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    setError('');
    onCreateMemory({ title, message, musicUrl, musicTitle, musicArtist, coupleNames, startDate, photos });
  };
  
  const handleEnhanceMessage = async () => {
    // Função para aprimorar mensagem com IA (pode ser implementada depois)
    setIsEnhancing(true);
    setTimeout(() => {
      setIsEnhancing(false);
    }, 2000);
  };

  if (!canCreate) {
    return <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center">
      <h2 className="text-2xl text-amber-400">Acesso restrito.</h2>
    </div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full bg-slate-800 text-white rounded-2xl shadow-xl">
      <button onClick={() => onNavigate('home')} className="mb-6 text-emerald-400 hover:text-emerald-300">&larr; Voltar</button>
      <h2 className="text-3xl font-bold mb-6">Configure sua Cápsula</h2>
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Título da Cápsula (Ex: Nosso Primeiro Ano)"/>
        <input type="text" value={coupleNames} onChange={e => setCoupleNames(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nomes do Casal (Ex: Marcelo e Sofia)"/>
        <div>
          <label className="text-sm text-slate-400">Data de Início do Relacionamento</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <input type="text" value={musicTitle} onChange={e => setMusicTitle(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nome da Música"/>
        <input type="text" value={musicArtist} onChange={e => setMusicArtist(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Artista da Música"/>
        <input type="url" value={musicUrl} onChange={e => setMusicUrl(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Link da Música (Spotify, YouTube)"/>
        
        <div>
          <label className="text-sm text-slate-400">Fotos (a primeira será a capa)</label>
          <input type="file" onChange={(e) => setPhotos(Array.from(e.target.files))} multiple accept="image/*" className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"/>
        </div>
        
        <div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows="5" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Sua Mensagem Especial..."></textarea>
          <div className="flex justify-end mt-2">
            <button type="button" onClick={handleEnhanceMessage} disabled={isEnhancing || !message.trim()} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
              {isEnhancing ? <div className="spinner"></div> : '✨'}
              {isEnhancing ? 'Aprimorando...' : 'Aprimorar com IA'}
            </button>
          </div>
        </div>

        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-transform transform hover:scale-101">
          Criar Cápsula
        </button>
      </form>
    </div>
  );
} 