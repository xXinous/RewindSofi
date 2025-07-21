import React, { useState, useEffect } from 'react';

// --- ÍCONES SVG COMO COMPONENTES ---
const PlayIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);
const SkipBackIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" x2="5" y1="19" y2="5"></line></svg>
);
const SkipForwardIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" x2="19" y1="5" y2="19"></line></svg>
);
const ShuffleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 14 4 4-4 4"></path><path d="m18 2 4 4-4 4"></path><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"></path><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"></path><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"></path></svg>
);
const RepeatIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path></svg>
);
const ChevronDownIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"></path></svg>
);
const EllipsisIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
);
const CameraIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
);
const LockIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

// --- FUNÇÕES UTILITÁRIAS ---
const getEmbedUrl = (url) => {
  if (!url) return null;
  let youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/);
  if (youtubeMatch && youtubeMatch[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  let spotifyMatch = url.match(/(?:https?:\/\/)?open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;
  return null;
};

function HomePage({ onNavigate }) {
  return (
    <div className="text-center p-8 max-w-2xl mx-auto bg-slate-900 text-white h-screen flex flex-col justify-center">
      <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">Cápsula do Tempo</h1>
      <p className="mb-8 text-lg text-slate-300">Crie uma mensagem para o futuro, aprimorada com um toque de magia da IA.</p>
      <button onClick={() => onNavigate('form')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105">
        Criar Cápsula Agora
      </button>
    </div>
  );
}

function MemoryForm({ onCreateMemory, onNavigate }) {
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

  // Estados para a seção "Secret Love"
  const [secretLoveEnabled, setSecretLoveEnabled] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [secretVideo, setSecretVideo] = useState(null);
  const [secretMessage, setSecretMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !message || !startDate || !coupleNames || !musicTitle || !musicArtist) {
      setError('Todos os campos principais são obrigatórios.');
      return;
    }
    if (secretLoveEnabled && (!secretPassword || !secretMessage || !secretVideo)) {
      setError('Para a seção "Secret Love", a senha, a mensagem secreta e o vídeo são obrigatórios.');
      return;
    }
    setError('');
    onCreateMemory({ 
      title, message, musicUrl, musicTitle, musicArtist, coupleNames, startDate, photos,
      secretLoveEnabled, secretPassword, secretVideo, secretMessage
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full bg-slate-800 text-white rounded-2xl shadow-xl">
      <button onClick={() => onNavigate('home')} className="mb-6 text-emerald-400 hover:text-emerald-300">&larr; Voltar</button>
      <h2 className="text-3xl font-bold mb-6">Configure sua Cápsula</h2>
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campos Principais */}
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
          <label className="text-sm text-slate-400">Fotos Públicas (a primeira será a capa)</label>
          <input type="file" onChange={(e) => setPhotos(Array.from(e.target.files))} multiple accept="image/*" className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"/>
        </div>
        <div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows="5" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Sua Mensagem Especial (pública)..."></textarea>
        </div>
        {/* Seção Secret Love */}
        <div className="border-t-2 border-dashed border-slate-600 pt-4 mt-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={secretLoveEnabled} onChange={() => setSecretLoveEnabled(!secretLoveEnabled)} className="w-5 h-5 text-pink-500 bg-slate-600 border-slate-500 rounded focus:ring-pink-500"/>
            <span className="text-lg font-semibold text-pink-400">Ativar "Secret Love"</span>
          </label>
          {secretLoveEnabled && (
            <div className="mt-4 space-y-4 p-4 bg-slate-900/50 rounded-lg">
              <h3 className="text-md font-bold text-pink-300">Conteúdo Secreto</h3>
              <input type="password" value={secretPassword} onChange={e => setSecretPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Crie uma senha para esta seção"/>
              <textarea value={secretMessage} onChange={e => setSecretMessage(e.target.value)} rows="5" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Escreva a sua grande mensagem secreta aqui..."></textarea>
              <div>
                <label className="text-sm text-slate-400">Vídeo Secreto</label>
                <input type="file" onChange={(e) => setSecretVideo(e.target.files[0])} accept="video/*" className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"/>
              </div>
            </div>
          )}
        </div>
        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-transform transform hover:scale-101">
          Criar Cápsula
        </button>
      </form>
    </div>
  );
}

function TimeTogether({ startDate }) {
  // Código omitido para brevidade
  return null;
}

function SecretLoveSection({ password, videoUrl, secretMessage }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = () => {
    if (passwordAttempt === password) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  if (isUnlocked) {
    return (
      <div className="flex flex-col gap-5 p-6 h-fit w-full z-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600">
        <h3 className="font-bold text-white text-xl">Secret Love ✨</h3>
        {videoUrl && (
          <video controls src={videoUrl} className="w-full rounded-xl shadow-lg aspect-video">
            Seu navegador não suporta o player de vídeo.
          </video>
        )}
        <div className="font-semibold text-lg leading-relaxed text-white whitespace-pre-wrap">{secretMessage}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-fit w-full z-10 rounded-2xl bg-slate-800/80 border-2 border-dashed border-pink-400 text-center">
      <LockIcon className="w-10 h-10 mx-auto text-pink-400"/>
      <h3 className="font-bold text-white text-xl">Secret Love</h3>
      <p className="text-slate-300">Esta área contém uma surpresa especial e é protegida por senha.</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <input 
          type="password" 
          value={passwordAttempt}
          onChange={(e) => setPasswordAttempt(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-center focus:ring-2 focus:ring-pink-500 outline-none"
          placeholder="Digite a senha"
        />
        <button onClick={handleUnlock} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg">
          Desbloquear
        </button>
      </div>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
}

function MemoryPage({ memory, onExit }) {
  const { title, message, musicUrl, musicTitle, musicArtist, coupleNames, startDate, photos, secretLoveEnabled, secretPassword, secretVideoUrl, secretMessage } = memory;
  const coverArt = photos && photos.length > 0 ? photos[0] : null;
  const embedUrl = getEmbedUrl(musicUrl);

  return (
    <div className="w-full h-screen overflow-y-auto" style={{
      backgroundImage: 'linear-gradient(rgb(71, 98, 125) 0%, rgb(71, 98, 125) 45%, rgb(49, 68, 87) 65%, rgb(18, 18, 18) 85%)',
      backgroundColor: 'rgb(18, 18, 18)',
      color: 'white'
    }}>
      <div className="flex flex-col w-full h-full gap-5 px-6">
        {/* Top Bar */}
        <div className="flex w-full items-center h-fit pt-4 justify-between text-white">
          <button onClick={onExit}><ChevronDownIcon className="w-7 h-7" /></button>
          <span className="font-semibold">{title}</span>
          <button><EllipsisIcon className="w-7 h-7" /></button>
        </div>
        {/* Player */}
        <div className="flex w-full flex-col flex-grow gap-4">
          <div className="flex w-full justify-center items-center px-9">
            {coverArt ? (
              <img src={coverArt} alt="Capa da memória" className="w-full max-w-sm aspect-square object-cover rounded-lg shadow-2xl" />
            ) : (
              <div className="w-full max-w-sm aspect-square bg-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-400">
                <CameraIcon className="w-12 h-12" />
                <p className="mt-2">Nenhuma foto adicionada</p>
              </div>
            )}
          </div>
        </div>
        {/* "Sobre o casal" Section */}
        <div className="flex flex-col gap-6 h-fit w-full mt-4">
          <div className="flex flex-col bg-[#332f2f] h-fit w-full z-10 rounded-2xl">
            <div className="flex flex-col gap-4 p-4 w-full">
              <div className="flex flex-col text-white">
                <span className="font-black text-2xl">{coupleNames}</span>
                <span className="font-extralight text-base text-slate-300">Juntos desde {new Date(startDate).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <TimeTogether startDate={startDate} />
            </div>
          </div>
        </div>
        {/* Mensagem Especial Pública */}
        <div className="flex w-full h-fit items-center justify-center mb-4">
          <div className="flex gap-5 p-6 flex-col h-fit w-full z-10 rounded-2xl" style={{ backgroundColor: 'rgb(228, 44, 20)' }}>
            <span className="font-bold text-white text-xl">Mensagem especial</span>
            <div className="font-bold text-2xl leading-9 text-white whitespace-pre-wrap">{message}</div>
          </div>
        </div>
        {/* Galeria de Fotos Públicas Adicionais */}
        {photos && photos.length > 1 && (
          <div className="flex flex-col gap-5 w-full items-center mb-4">
            {photos.slice(1).map((photoUrl, index) => (
              <img key={index} src={photoUrl} alt={`Foto da memória ${index + 2}`} className="w-full max-w-3xl h-auto rounded-2xl shadow-lg"/>
            ))}
          </div>
        )}
        {/* Seção Secret Love */}
        {secretLoveEnabled && (
          <div className="flex w-full h-fit items-center justify-center mb-4">
            <SecretLoveSection password={secretPassword} videoUrl={secretVideoUrl} secretMessage={secretMessage} />
          </div>
        )}
        {/* Imagem Final */}
        <div className="flex w-full h-fit items-center justify-center mb-6">
          <img alt="wrapped-banner" className="w-full h-auto rounded-2xl" src="https://placehold.co/800x400/010101/FFF?text=TimeCapsule" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // SIMULAÇÃO: No mundo real, você usaria Firebase Auth para definir este estado.
  // Para testar, você pode mudar para `false` para ver a visão do usuário normal.
  const [isCreator, setIsCreator] = useState(true);
  const [page, setPage] = useState('home'); 
  const [memories, setMemories] = useState({});
  const [currentMemoryId, setCurrentMemoryId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setCurrentMemoryId(id);
      setPage('memory');
    } else {
      setPage(isCreator ? 'home' : 'viewer_welcome');
    }
    document.body.style.backgroundColor = 'rgb(15 23 42)';
  }, [isCreator]); 

  const handleCreateMemory = (memoryData) => {
    const newMemoryId = `local_${Date.now()}`;
    const photoUrls = memoryData.photos.map(file => URL.createObjectURL(file));
    const secretVideoUrl = memoryData.secretVideo ? URL.createObjectURL(memoryData.secretVideo) : null;
    const newMemory = { 
      ...memoryData, 
      id: newMemoryId, 
      photos: photoUrls,
      secretVideoUrl: secretVideoUrl
    };
    delete newMemory.photoFiles;
    delete newMemory.secretVideo;
    const updatedMemories = {...memories, [newMemoryId]: newMemory };
    setMemories(updatedMemories);
    setCurrentMemoryId(newMemoryId);
    setPage('memory'); 
  };

  const handleExitMemory = () => {
    setCurrentMemoryId(null);
    setPage(isCreator ? 'home' : 'viewer_welcome');
  }

  const renderPage = () => {
    if (page === 'memory') {
      if (currentMemoryId && memories[currentMemoryId]) {
        return <MemoryPage memory={memories[currentMemoryId]} onExit={handleExitMemory} />;
      } else {
        return <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center"><h2 className="text-2xl text-amber-400">Cápsula não encontrada.</h2><p className="mt-2">Este link pode ser inválido ou de uma sessão diferente.</p><button onClick={handleExitMemory} className="mt-4 bg-emerald-500 p-2 rounded-lg">Voltar</button></div>
      }
    }
    switch (page) {
      case 'form':
        return isCreator ? <MemoryForm onCreateMemory={handleCreateMemory} onNavigate={setPage} /> : <HomePage onNavigate={setPage} />;
      case 'home':
        return isCreator ? <HomePage onNavigate={setPage} /> : <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center"><h1 className="text-4xl font-bold">Bem-vindo(a) à Cápsula do Tempo</h1><p className="text-slate-300 mt-2">Acesse uma cápsula através de um link compartilhado.</p></div>;
      default:
        return <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center"><h1 className="text-4xl font-bold">Bem-vindo(a) à Cápsula do Tempo</h1><p className="text-slate-300 mt-2">Acesse uma cápsula através de um link compartilhado.</p></div>;
    }
  };

  return (
    <main className="w-full h-screen bg-slate-900">
      {renderPage()}
    </main>
  );
} 