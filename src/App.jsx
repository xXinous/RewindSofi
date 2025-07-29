import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { auth, db, storage } from './firebase';
import { checkForUpdates, forceUpdate } from './version';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject, listAll } from 'firebase/storage';
import PhotoGallery from './PhotoGallery';
import VideoSelector from './VideoSelector';
import UploadStatus from './UploadStatus';

// --- ÍCONES SVG COMO COMPONENTES (MEMOIZADOS) ---
const PlayIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
));
const SkipBackIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" x2="5" y1="19" y2="5"></line></svg>
));
const SkipForwardIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" x2="19" y1="5" y2="19"></line></svg>
));
const ShuffleIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 14 4 4-4 4"></path><path d="m18 2 4 4-4 4"></path><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"></path><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"></path><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"></path></svg>
));
const RepeatIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path></svg>
));
const ChevronDownIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"></path></svg>
));
const EllipsisIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
));
const CameraIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
));
const LockIcon = React.memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
));

// --- FUNÇÕES UTILITÁRIAS (OTIMIZADAS) ---
const getEmbedUrl = (input) => {
  if (!input) return null;
  try {
    // Verificar se é um código de incorporação do YouTube
    let embedMatch = input.match(/<iframe[^>]*src="([^"]*youtube\.com\/embed\/[^"]*)"[^>]*>/i);
    if (embedMatch && embedMatch[1]) {
      // Adicionar enablejsapi=1 se não estiver presente
      let embedUrl = embedMatch[1];
      if (!embedUrl.includes('enablejsapi=1')) {
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'enablejsapi=1';
      }
      return embedUrl;
    }
    
    // Verificar se é uma URL direta do YouTube
    let youtubeMatch = input.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/);
    if (youtubeMatch && youtubeMatch[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1`;
    
    // Verificar se é uma URL do Spotify
    let spotifyMatch = input.match(/(?:https?:\/\/)?open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;
    
    return null;
  } catch (error) {
    console.error('Erro ao processar input:', error);
    return null;
  }
};

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- HOOKS PERSONALIZADOS ---
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [key]);

  return [storedValue, setValue];
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// --- COMPONENTES OTIMIZADOS ---
const HomePage = React.memo(({ onNavigate }) => {
  return (
    <div className="text-center p-8 max-w-2xl mx-auto bg-slate-900 text-white h-screen flex flex-col justify-center">
      <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">MY LOVED SOFIA rewind</h1>
      <p className="mb-8 text-lg text-slate-300">Guarde aqui suas memórias e sentimentos mais especiais.</p>
      <button onClick={() => onNavigate('form')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105">
        Criar nova memória
      </button>
    </div>
  );
});

const TimeTogether = React.memo(({ startDate }) => {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(interval);
  }, []);

  const timeData = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    if (!start || isNaN(start.getTime())) return null;
    
    let end = new Date(now);
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    let hours = end.getHours() - start.getHours();
    let minutes = end.getMinutes() - start.getMinutes();
    let seconds = end.getSeconds() - start.getSeconds();
    let ms = end.getMilliseconds() - start.getMilliseconds();

    if (ms < 0) { ms += 1000; seconds--; }
    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--; }
    if (hours < 0) { hours += 24; days--; }
    if (days < 0) {
      let prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }
    if (months < 0) { months += 12; years--; }

    let weeks = Math.floor(days / 7);
    days = days % 7;

    return { years, months, weeks, days, hours, minutes, seconds };
  }, [startDate, now]);

  if (!timeData) return <span className="text-red-400">Data inválida</span>;

  const timeUnits = [
    { value: timeData.years, label: 'ano', color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-100' },
    { value: timeData.months, label: 'mês', color: 'from-cyan-500 to-cyan-600', textColor: 'text-cyan-100' },
    { value: timeData.weeks, label: 'semana', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-100' },
    { value: timeData.days, label: 'dia', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-100' },
    { value: timeData.hours, label: 'hora', color: 'from-pink-500 to-pink-600', textColor: 'text-pink-100' },
    { value: timeData.minutes, label: 'min', color: 'from-orange-500 to-orange-600', textColor: 'text-orange-100' },
    { value: timeData.seconds, label: 'seg', color: 'from-red-500 to-red-600', textColor: 'text-red-100' }
  ];

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {timeUnits.map((unit, index) => (
        <div key={index} className={`bg-gradient-to-br ${unit.color} rounded-xl p-3 text-center min-w-[80px] transform hover:scale-105 transition-all duration-300 shadow-lg`}>
          <div className="text-2xl font-bold text-white">{unit.value}</div>
          <div className={`text-xs ${unit.textColor}`}>
            {unit.label}{unit.value !== 1 ? (unit.label === 'mês' ? 'es' : 's') : ''}
          </div>
        </div>
      ))}
    </div>
  );
});

const SecretLoveSection = React.memo(({ password, videoUrl, secretMessage }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [error, setError] = useState('');
  const [videoEnded, setVideoEnded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [playlistStarted, setPlaylistStarted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const playlistRef = useRef(null);
  const videoRef = useRef(null);

  // Controlar YouTube quando a seção é desbloqueada
  useEffect(() => {
    if (isUnlocked) {
      try {
        const youtubeIframe = document.querySelector('iframe[src*="youtube"]');
        if (youtubeIframe) {
          youtubeIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          youtubeIframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
        }
      } catch (error) {
        console.error('Erro ao controlar YouTube:', error);
      }
    }
  }, [isUnlocked]);

  // Controlar playlist quando vídeo toca
  useEffect(() => {
    if (isVideoPlaying && playlistStarted) {
      try {
        const spotifyIframe = playlistRef.current?.querySelector('iframe');
        if (spotifyIframe) {
          spotifyIframe.contentWindow.postMessage('{"command":"pause"}', '*');
        }
      } catch (error) {
        console.error('Erro ao pausar Spotify:', error);
      }
    } else if (videoEnded && playlistStarted) {
      setTimeout(() => {
        try {
          const spotifyIframe = playlistRef.current?.querySelector('iframe');
          if (spotifyIframe) {
            spotifyIframe.contentWindow.postMessage('{"command":"play"}', '*');
          }
        } catch (error) {
          console.error('Erro ao retomar Spotify:', error);
        }
      }, 1000);
    }
  }, [isVideoPlaying, videoEnded, playlistStarted]);

  const handleUnlock = () => {
    if (passwordAttempt === password) {
      setShowAnimation(true);
      setError('');
      
      const animationSteps = [
        { time: 0, text: "✨ Desbloqueando o amor..." },
        { time: 2000, text: "💕 Carregando memórias especiais..." },
        { time: 4000, text: "🌹 Preparando surpresas..." },
        { time: 6000, text: "💫 Quase lá..." },
        { time: 8000, text: "💝 Abrindo o coração..." },
        { time: 10000, text: "💖 Secret Love ativado!" }
      ];
      
      animationSteps.forEach((step, index) => {
        setTimeout(() => {
          setAnimationStep(index);
        }, step.time);
      });
      
      setTimeout(() => {
        setIsUnlocked(true);
        setShowAnimation(false);
      }, 10000);
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
  };

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    setVideoEnded(true);
    setTimeout(() => {
      setShowPlaylist(true);
      setTimeout(() => {
        if (playlistRef.current) {
          playlistRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 300);
    }, 500);
  };

  const handleStartPlaylist = () => {
    setPlaylistStarted(true);
    setTimeout(() => {
      try {
        const spotifyIframe = playlistRef.current?.querySelector('iframe');
        if (spotifyIframe) {
          spotifyIframe.contentWindow.postMessage('{"command":"play"}', '*');
        }
      } catch (error) {
        console.error('Erro ao iniciar playlist:', error);
      }
    }, 500);
  };

  if (showAnimation) {
    const animationTexts = [
      "✨ Desbloqueando o amor...",
      "💕 Carregando memórias especiais...",
      "🌹 Preparando surpresas...",
      "💫 Quase lá...",
      "💝 Abrindo o coração...",
      "💖 Secret Love ativado!"
    ];
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-8 rounded-3xl shadow-2xl text-center max-w-md mx-4">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-4xl">💖</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Secret Love</h3>
            <p className="text-white/90 text-lg animate-fade-in">
              {animationTexts[animationStep]}
            </p>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-1000 ease-out"
              style={{ width: `${((animationStep + 1) / animationTexts.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-pink-300 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              >
                {['💕', '💖', '💝', '🌹', '✨'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <div className="flex flex-col gap-5 p-6 h-fit w-full z-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 animate-fade-in">
        <h3 className="font-bold text-white text-xl">Secret Love ✨</h3>
        
        {videoUrl && (
          <video 
            ref={videoRef}
            controls 
            src={videoUrl} 
            className="w-full rounded-xl shadow-lg aspect-video"
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onEnded={handleVideoEnded}
          >
            Seu navegador não suporta o player de vídeo.
          </video>
        )}
        
        {videoEnded && (
          <div 
            ref={playlistRef}
            className={`w-full rounded-xl shadow-lg transition-all duration-700 ease-out ${
              showPlaylist 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-8'
            }`}
          >
            <div className="bg-gradient-to-r from-green-400 to-green-600 p-2 rounded-t-xl">
              <div className="flex items-center justify-between text-white text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span>🎵 Playlist Especial</span>
                </div>
                {!playlistStarted && (
                  <button 
                    onClick={handleStartPlaylist}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  >
                    ▶️ Iniciar Playlist
                  </button>
                )}
              </div>
            </div>
            <iframe 
              data-testid="embed-iframe" 
              style={{borderRadius: '0 0 12px 12px'}} 
              src="https://open.spotify.com/embed/playlist/5f3kszyKEEZj4YhukoEEus?utm_source=generator" 
              width="100%" 
              height="352" 
              frameBorder="0" 
              allowFullScreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            ></iframe>
          </div>
        )}
        
        <div className="font-semibold text-lg leading-relaxed text-white whitespace-pre-line break-words w-full max-w-3xl" style={{wordBreak: 'break-word'}}>{secretMessage}</div>
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
});

function MemoryForm({ onCreateMemory, onNavigate, initialData, loadingMemory }) {
  // Estados principais do formulário
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [coupleNames, setCoupleNames] = useState('');
  const [startDate, setStartDate] = useState('');
  const [secretLoveEnabled, setSecretLoveEnabled] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [secretMessage, setSecretMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Fotos: array de {file, url, name, uploaded, progress}
  const [photos, setPhotos] = useState([]);
  // Vídeo: {file, url, name, uploaded, progress}
  const [video, setVideo] = useState(null);
  const [availableStoragePhotos, setAvailableStoragePhotos] = useState([]); // [{url, name, selected}]

  // Preencher formulário ao editar
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setMessage(initialData.message || '');
      setMusicUrl(initialData.musicUrl || '');
      setMusicTitle(initialData.musicTitle || '');
      setMusicArtist(initialData.musicArtist || '');
      setCoupleNames(initialData.coupleNames || '');
      setStartDate(initialData.startDate || '');
      setSecretLoveEnabled(initialData.secretLoveEnabled || false);
      setSecretPassword(initialData.secretPassword || '');
      setSecretMessage(initialData.secretMessage || '');
      // Fotos já existentes
      if (initialData.photos && Array.isArray(initialData.photos)) {
        setPhotos(initialData.photos.map(url => ({ file: null, url, name: url.split('/').pop(), uploaded: true, progress: 100 })));
      }
      // Vídeo já existente
      if (initialData.secretVideo) {
        setVideo({ file: null, url: initialData.secretVideo, name: initialData.secretVideo.split('/').pop(), uploaded: true, progress: 100 });
      }
    }
  }, [initialData]);

  // Buscar imagens já presentes no Storage ao abrir o formulário de nova memória
  useEffect(() => {
    async function fetchStoragePhotos() {
      if (initialData) return; // Só para nova memória
      try {
        const photosRef = ref(storage, 'memories/photos/');
        const res = await listAll(photosRef);
        const urls = await Promise.all(res.items.map(async (itemRef) => {
          try {
            const url = await getDownloadURL(itemRef);
            return { url, name: itemRef.name, selected: false };
          } catch (error) {
            console.warn('Erro ao carregar imagem do Storage:', error);
            return null;
          }
        }));
        // Filtrar URLs nulas
        const validUrls = urls.filter(url => url !== null);
        setAvailableStoragePhotos(validUrls);
      } catch (e) {
        console.warn('Erro ao buscar fotos do Storage:', e);
      }
    }
    fetchStoragePhotos();
  }, [initialData]);

  // Selecionar/deselecionar imagem do Storage
  const toggleSelectStoragePhoto = (idx) => {
    setAvailableStoragePhotos(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  // Adicionar fotos
  const handlePhotoSelection = (files) => {
    // Remover validação de tamanho
    const newPhotos = Array.from(files).map(file => ({ file, url: URL.createObjectURL(file), name: file.name, uploaded: false, progress: 0 }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 10));
  };
  // Remover foto
  const handleRemovePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };
  // Substituir foto
  const handleReplacePhoto = (file, idx) => {
    setPhotos(prev => prev.map((p, i) => i === idx ? { file, url: URL.createObjectURL(file), name: file.name, uploaded: false, progress: 0 } : p));
  };

  // Adicionar vídeo
  const handleVideoSelection = (file) => {
    // Remover validação de tamanho
    setVideo({ file, url: URL.createObjectURL(file), name: file.name, uploaded: false, progress: 0 });
  };
  // Remover vídeo
  const handleRemoveVideo = () => {
    setVideo(null);
  };
  // Substituir vídeo
  const handleReplaceVideo = (file) => {
    setVideo({ file, url: URL.createObjectURL(file), name: file.name, uploaded: false, progress: 0 });
  };

  // Função utilitária para sanitizar nome de arquivo
  function sanitizeFileName(name) {
    return name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-zA-Z0-9.\-_]/g, '_') // só letras, números, ponto, traço, underline
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, ''); // remove underscores no início e fim
  }
  function getTimestampName(prefix, originalName) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const sanitized = sanitizeFileName(originalName);
    return `${prefix}_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}-${ms}_${sanitized}`;
  }

  // Upload em lote de fotos
  const handleUploadPhotos = async () => {
    setUploadError('');
    const newPhotos = await Promise.all(photos.map(async (p, i) => {
      if (p.uploaded) return p;
      const fileName = getTimestampName('foto', p.name);
      const storageRef = ref(storage, `memories/photos/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, p.file);
      return await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            setPhotos(prev => prev.map((ph, idx) => idx === i ? { ...ph, progress: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) } : ph));
          },
          (error) => { setUploadError('Erro ao enviar fotos.'); reject(error); },
          async () => {
            const url = await getDownloadURL(storageRef);
            resolve({ ...p, url, uploaded: true, progress: 100, name: fileName });
          }
        );
      });
    }));
    setPhotos(newPhotos);
  };

  // Upload do vídeo
  const handleUploadVideo = async () => {
    if (!video || video.uploaded) return;
    setUploadError('');
    const fileName = getTimestampName('video', video.name);
    const storageRef = ref(storage, `memories/secret_videos/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, video.file);
    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          setVideo(v => ({ ...v, progress: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) }));
        },
        (error) => { setUploadError('Erro ao enviar vídeo.'); reject(error); },
        async () => {
          const url = await getDownloadURL(storageRef);
          setVideo(v => ({ ...v, url, uploaded: true, progress: 100, name: fileName }));
          resolve();
        }
      );
    });
  };

  // Verifica se há upload pendente
  const hasPendingUploads = photos.some(p => !p.uploaded) || (video && !video.uploaded);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message || !startDate || !coupleNames || !musicTitle || !musicArtist) {
      setError('Todos os campos principais são obrigatórios.');
      return;
    }
    if (secretLoveEnabled && (!secretPassword || !secretMessage || !video || !video.uploaded)) {
      setError('Para a seção "Secret Love", a senha, a mensagem secreta e o vídeo são obrigatórios.');
      return;
    }
    setError('');
    const selectedStorageUrls = availableStoragePhotos.filter(p => p.selected).map(p => p.url);
    onCreateMemory({
      title, message, musicUrl, musicTitle, musicArtist, coupleNames, startDate,
      photos: [...photos.filter(p => p.uploaded).map(p => p.url), ...selectedStorageUrls],
      secretLoveEnabled, secretPassword, secretVideo: video && video.uploaded ? video.url : null, secretMessage
    });
  };

  // Remover foto já enviada
  const handleRemoveUploadedPhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };
  // Remover vídeo já enviado
  const handleRemoveUploadedVideo = () => {
    setVideo(null);
  };

  // Drag & drop para fotos
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handlePhotoSelection(files);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Padronizar nomes de handlers
  const isUploading = hasPendingUploads || loadingMemory;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full bg-slate-800 text-white rounded-2xl shadow-xl">
      <UploadStatus error={error} uploadError={uploadError} loading={isUploading} />
      <button onClick={() => onNavigate('home')} className="mb-6 text-emerald-400 hover:text-emerald-300" disabled={isUploading}>&larr; Voltar</button>
      <h2 className="text-3xl font-bold mb-6">Configure sua memória</h2>
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4">{error}</div>}
      {uploadError && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4">{uploadError}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campos Principais */}
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Título da memória (Ex: Nosso Primeiro Ano)"/>
        <input type="text" value={coupleNames} onChange={e => setCoupleNames(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nomes do Casal (Ex: Marcelo e Sofia)"/>
        <div>
          <label className="text-sm text-slate-400">Data e hora do primeiro encontro</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <div className="text-xs text-slate-400 mt-1">O formato se adapta ao seu sistema (12h ou 24h).</div>
        </div>
        <input type="text" value={musicTitle} onChange={e => setMusicTitle(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nome da Música"/>
        <input type="text" value={musicArtist} onChange={e => setMusicArtist(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Artista da Música"/>
        <div>
          <input type="text" value={musicUrl} onChange={e => setMusicUrl(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Código de incorporação do YouTube ou link do Spotify"/>
          <div className="text-xs text-slate-400 mt-1">
            <strong>Para YouTube:</strong> Cole o código de incorporação completo (iframe) do YouTube. 
            <br/>Para obter: Clique em "Compartilhar" → "Incorporar" → Copie o código iframe.
            <br/><strong>Para Spotify:</strong> Cole o link direto da música/playlist.
          </div>
        </div>
        <PhotoGallery
          photos={photos}
          setPhotos={setPhotos}
          availableStoragePhotos={availableStoragePhotos}
          setAvailableStoragePhotos={setAvailableStoragePhotos}
          handlePhotoSelection={handlePhotoSelection}
          handleRemovePhoto={handleRemovePhoto}
          handleReplacePhoto={handleReplacePhoto}
          handleUploadPhotos={handleUploadPhotos}
          isUploading={isUploading}
        />
        <VideoSelector
          video={video}
          handleVideoSelection={handleVideoSelection}
          handleRemoveVideo={handleRemoveVideo}
          handleReplaceVideo={handleReplaceVideo}
          handleUploadVideo={handleUploadVideo}
          isUploading={isUploading}
        />
        <div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            style={{ minHeight: 100, resize: 'vertical' }}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Sua Mensagem Especial (pública)..."
          ></textarea>
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
              <textarea
                value={secretMessage}
                onChange={e => setSecretMessage(e.target.value)}
                rows={5}
                style={{ minHeight: 100, resize: 'vertical' }}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 outline-none"
                placeholder="Escreva a sua grande mensagem secreta aqui..."
              ></textarea>
              <div>
                <label className="text-sm text-slate-400">Vídeo Secreto</label>
                <input type="file" onChange={e => handleVideoSelection(e.target.files[0])} accept="video/mp4,video/webm,video/ogg" className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"/>
                <div className="text-xs text-slate-400 mt-1">Formatos aceitos: MP4, WEBM, OGG. Máximo 50MB.</div>
                {video && (
                  <div className="flex flex-col items-center gap-2 mt-2 bg-slate-700 rounded-lg p-2 w-56">
                    <video src={video.url} controls className="w-40 h-24 rounded bg-slate-900" />
                    <div className="text-xs text-slate-200 truncate w-full text-center">{video.name}</div>
                    <div className="text-xs text-slate-400">{(video.file?.size/1024/1024).toFixed(2)}MB</div>
                    <div className="w-full h-2 bg-slate-600 rounded mt-1">
                      <div className="h-2 bg-pink-400 rounded" style={{ width: `${video.progress}%` }}></div>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <label className="text-xs text-blue-400 cursor-pointer">
                        <input type="file" style={{ display: 'none' }} accept="video/mp4,video/webm,video/ogg" onChange={e => handleReplaceVideo(e.target.files[0])} />
                        Substituir
                      </label>
                      <button type="button" onClick={handleRemoveVideo} className="text-xs text-red-400 ml-2">Remover</button>
                    </div>
                  </div>
                )}
                {/* Botão de upload de vídeo */}
                {video && !video.uploaded && (
                  <button
                    type="button"
                    onClick={handleUploadVideo}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg mt-2"
                  >
                    Enviar vídeo
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Botão de salvar/criar só habilitado se não houver uploads pendentes */}
        {initialData && (
          <button type="submit" disabled={isUploading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-transform transform hover:scale-101 mt-4">
            Salvar alterações
          </button>
        )}
        {!initialData && (
          <button type="submit" disabled={isUploading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-transform transform hover:scale-101 mt-4">
            Criar memória
          </button>
        )}
      </form>
    </div>
  );
}

const MemoryPage = React.memo(({ memory, onExit, isCreator, onEditMemory, onDeleteMemory }) => {
  const { title, message, musicUrl, musicTitle, musicArtist, coupleNames, startDate, photos, secretLoveEnabled, secretPassword, secretVideoUrl, secretMessage, secretVideo } = memory;
  
  // Valores computados
  const coverArt = photos && photos.length > 0 ? photos[0] : null;
  const embedUrl = getEmbedUrl(musicUrl);
  
  // Estados otimizados
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [playerPosition, setPlayerPosition] = useState({ x: 'right', y: 'bottom' });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef(null);



  // Sincronizar com o YouTube
  const handleMessage = (event) => {
    if (event.origin !== 'https://www.youtube.com') return;
    
    try {
      const data = JSON.parse(event.data);
      
      if (data.event === 'onStateChange') {
        setIsPlaying(data.info === 1);
        if (data.info === 0) {
          setCurrentTime(0);
        }
      } else if (data.event === 'onReady') {
        const iframe = document.querySelector('iframe[src*="youtube"]');
        if (iframe) {
          iframe.contentWindow.postMessage('{"event":"command","func":"getDuration","args":""}', '*');
        }
      } else if (data.event === 'infoDelivery') {
        if (data.info && data.info.duration) {
          setDuration(data.info.duration);
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem do YouTube:', error);
    }
  };

  useEffect(() => {
    const timeInterval = setInterval(() => {
      if (isPlaying && currentTime < duration) {
        setCurrentTime(prev => Math.min(prev + 1, duration));
      }
    }, 1000);

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(timeInterval);
    };
  }, [isPlaying, currentTime, duration]);

  return (
    <div className="w-full h-screen overflow-y-auto" style={{
      backgroundImage: 'linear-gradient(rgb(71, 98, 125) 0%, rgb(71, 98, 125) 45%, rgb(49, 68, 87) 65%, rgb(18, 18, 18) 85%)',
      backgroundColor: 'rgb(18, 18, 18)',
      color: 'white'
    }}>
      <div className="flex flex-col w-full h-full gap-5 px-6">
        {/* Top Bar */}
        <div className="flex w-full items-center h-fit pt-4 justify-between text-white">
          <button onClick={onExit} className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-colors">
            <ChevronDownIcon className="w-7 h-7" />
            <span className="text-sm">Voltar</span>
          </button>
          <span className="font-semibold">{title}</span>
          <div className="flex items-center gap-2">
            <button className="hover:bg-white/10 p-2 rounded-lg transition-colors">
              <EllipsisIcon className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="flex w-full flex-col flex-grow gap-4">
          <div className="flex w-full justify-center items-center px-9">
            {coverArt ? (
              <img 
                src={coverArt} 
                alt="Capa da memória" 
                className="w-full max-w-sm aspect-square object-cover rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-500 animate-fade-in" 
                style={{
                  animation: 'fadeIn 1s ease-out, float 3s ease-in-out infinite'
                }}
                onError={(e) => {
                  console.warn('Erro ao carregar capa da memória:', coverArt);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full max-w-sm aspect-square bg-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-400 animate-pulse">
                <CameraIcon className="w-12 h-12" />
                <p className="mt-2">Nenhuma foto adicionada</p>
              </div>
            )}
          </div>

          {/* Título e Artista */}
          <div className="flex flex-col w-full h-fit gap-2 animate-fade-in-up">
            <div className="flex w-full justify-between items-center h-fit">
              <div className="flex flex-col w-[80%] overflow-hidden">
                <h3 className="text-white font-extrabold text-2xl scrolling-text-container animate-heartbeat">
                  <span className="scrolling-text">{musicTitle}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                </h3>
                <span className="text-slate-300 font-light animate-fade-in" style={{ animationDelay: '0.5s' }}>{musicArtist}</span>
              </div>
            </div>
            {/* Barra de Progresso (Funcional) */}
            <div 
              className="flex w-full h-1.5 rounded-lg bg-white/25 relative items-center cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                const newTime = percentage * duration;
                
                const iframe = document.querySelector('iframe[src*="youtube"]');
                if (iframe) {
                  iframe.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${newTime}]}`, '*');
                }
              }}
            >
              <div 
                className="absolute left-0 top-0 bg-white rounded-l-lg h-full transition-all duration-100" 
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
              <div 
                className="absolute h-3 w-3 rounded-full bg-white z-10 transition-all duration-100" 
                style={{ 
                  left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, 
                  transform: 'translateX(-50%)' 
                }}
              ></div>
            </div>
            <div className="flex w-full h-fit justify-between text-xs text-slate-300">
              <p>{formatTime(currentTime)}</p>
              <p>{formatTime(duration)}</p>
            </div>
          </div>
          {/* Controles do Player (Funcional) */}
          <div className="flex justify-between items-center h-fit text-white animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <ShuffleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 cursor-pointer hover:scale-110 transition-transform animate-glow" />
            <div className="flex flex-row h-fit items-center justify-center gap-6 sm:gap-8">
              <SkipBackIcon 
                className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => {
                  const iframe = document.querySelector('iframe[src*="youtube"]');
                  if (iframe) {
                    iframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[Math.max(0, currentTime - 10)]}', '*');
                  }
                }}
              />
              <div 
                className="flex p-0 items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black cursor-pointer hover:scale-105 transition-transform animate-heartbeat"
                onClick={() => {
                  const iframe = document.querySelector('iframe[src*="youtube"]');
                  if (iframe) {
                    if (isPlaying) {
                      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                      setIsPlaying(false);
                    } else {
                      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                      setIsPlaying(true);
                    }
                  }
                }}
              >
                {isPlaying ? (
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                )}
              </div>
              <SkipForwardIcon 
                className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => {
                  const iframe = document.querySelector('iframe[src*="youtube"]');
                  if (iframe) {
                    iframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[Math.min(duration, currentTime + 10)]}', '*');
                  }
                }}
              />
            </div>
            <RepeatIcon className="w-6 h-6 sm:w-7 sm:h-7 cursor-pointer hover:scale-110 transition-transform animate-glow" />
          </div>
          {/* Player de Música Embutido (Funcional) */}
          {embedUrl && isPlayerVisible && (
            <div 
              ref={playerRef}
              className="fixed z-30 cursor-move"
              style={{ 
                width: '280px', 
                height: '157px',
                bottom: playerPosition.y === 'bottom' ? '16px' : 'auto',
                top: playerPosition.y === 'top' ? '16px' : 'auto',
                right: playerPosition.x === 'right' ? '16px' : 'auto',
                left: playerPosition.x === 'left' ? '16px' : 'auto',
                transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                transition: isDragging ? 'none' : 'all 0.2s ease'
              }}
              onMouseDown={(e) => {
                if (e.target.tagName === 'IFRAME') return;
                setIsDragging(true);
                const rect = e.currentTarget.getBoundingClientRect();
                setDragOffset({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                });
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                
                // Determinar posição baseada na localização
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                if (newX < windowWidth / 2) {
                  setPlayerPosition(prev => ({ ...prev, x: 'left' }));
                } else {
                  setPlayerPosition(prev => ({ ...prev, x: 'right' }));
                }
                
                if (newY < windowHeight / 2) {
                  setPlayerPosition(prev => ({ ...prev, y: 'top' }));
                } else {
                  setPlayerPosition(prev => ({ ...prev, y: 'bottom' }));
                }
              }}
              onMouseUp={() => {
                setIsDragging(false);
              }}
              onMouseLeave={() => {
                setIsDragging(false);
              }}
            >
              <div className="relative w-full h-full">
                <iframe
                  src={embedUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    pointerEvents: isDragging ? 'none' : 'auto'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Embedded Music Player"
                  onLoad={() => {
                    // Configurar comunicação com iframe do YouTube
                    const iframe = document.querySelector('iframe[src*="youtube"]');
                    if (iframe) {
                      iframe.contentWindow.postMessage('{"event":"listening"}', '*');
                    }
                  }}
                ></iframe>
                {/* Botão para minimizar */}
                <button 
                  onClick={() => setIsPlayerVisible(false)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors z-10"
                  title="Minimizar player"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          {/* Botão para restaurar player quando minimizado */}
          {embedUrl && !isPlayerVisible && (
            <button 
              onClick={() => setIsPlayerVisible(true)}
              className="fixed bottom-4 right-4 z-30 bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold transition-colors shadow-lg"
              title="Restaurar player"
            >
              ▶️
            </button>
          )}
        </div>

        {/* "Sobre o casal" Section */}
        <div className="flex flex-col gap-6 h-fit w-full mt-4">
          <div className="flex flex-col bg-[#332f2f] h-fit w-full z-10 rounded-2xl">
            <div className="flex flex-col gap-4 p-4 w-full">
              <div className="flex flex-col text-white">
                <span className="font-black text-2xl">{coupleNames}</span>
                <span className="font-extralight text-base text-slate-300">Juntos desde {new Date(startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
              <TimeTogether startDate={startDate} />
            </div>
          </div>
        </div>

        {/* Mensagem Especial Pública */}
        <div className="flex w-full h-fit items-center justify-center mb-4">
          <div className="flex gap-5 p-6 flex-col h-fit w-full z-10 rounded-2xl" style={{ backgroundColor: 'rgb(228, 44, 20)' }}>
            <span className="font-bold text-white text-xl">Mensagem especial</span>
            <div className="font-bold text-2xl leading-9 text-white whitespace-pre-line break-words w-full max-w-3xl" style={{wordBreak: 'break-word'}}>{message}</div>
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
            <SecretLoveSection password={secretPassword} videoUrl={secretVideo || secretVideoUrl} secretMessage={secretMessage} />
          </div>
        )}
        {/* Imagem Final */}
        <div className="flex w-full h-fit items-center justify-center mb-6">
          <div className="w-full h-48 bg-gradient-to-br from-pink-500 via-red-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-center p-8">
            <div className="text-2xl font-bold">
              Para a melhor coisa que me aconteceu ❤️
            </div>
          </div>
        </div>
        {isCreator && (
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => onEditMemory(memory.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg">Editar</button>
            <button onClick={() => onDeleteMemory(memory.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">Apagar</button>
          </div>
        )}
      </div>
    </div>
  );
});

export default function App() {
  // Verificar atualizações na inicialização
  useEffect(() => {
    if (checkForUpdates()) {
      forceUpdate();
    }
  }, []);

  const [isCreator, setIsCreator] = useState(false);
  const [user, setUser] = useState(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorSurname, setVisitorSurname] = useState('');
  const [visitorStep, setVisitorStep] = useState('ask'); // 'ask', 'showMsg', 'showMemory'
  const [visitorMsg, setVisitorMsg] = useState('');
  const [page, setPage] = useState('home');
  const [memories, setMemories] = useState({});
  const [currentMemoryId, setCurrentMemoryId] = useState(null);
  const [loadingMemory, setLoadingMemory] = useState(true);
  const [draftMemory, setDraftMemory] = useState(null); // Para preview antes de publicar
  const [editMode, setEditMode] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null); // Para edição de draft no preview
  const [adminChoice, setAdminChoice] = useState(null); // 'edit' | 'new' | null

  // Firebase Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email === 'marcelop.smile@gmail.com') {
        setIsCreator(true);
        setUser(user);
        setPage('home');
      } else {
        setIsCreator(false);
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Carregar a memória mais recente do Firestore
  useEffect(() => {
    async function fetchLatestMemory() {
      setLoadingMemory(true);
      const q = query(collection(db, 'memorias'), orderBy('createdAt', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      let loaded = {};
      let lastId = null;
      querySnapshot.forEach((docSnap) => {
        loaded[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        lastId = docSnap.id;
      });
      setMemories(loaded);
      if (lastId) setCurrentMemoryId(lastId);
      setLoadingMemory(false);
    }
    fetchLatestMemory();
  }, []);

  // Helper para pegar o ID da última memória
  const getLastMemoryId = () => {
    const ids = Object.keys(memories);
    if (ids.length === 0) return null;
    return ids[ids.length - 1];
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      alert('Erro ao fazer login com Google.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsCreator(false);
    setUser(null);
    setVisitorStep('ask');
    setVisitorMsg('');
    setPage('home');
    setCurrentMemoryId(null);
  };

  // Lógica de identificação de visitante
  const handleVisitorSubmit = (e) => {
    e.preventDefault();
    if (!visitorName || !visitorSurname) return;
    let msg = '';
    if (visitorName.trim().toLowerCase() === 'sofia' && visitorSurname.trim().toLowerCase() === 'miketem') {
      msg = 'Oi minha gatinha, bem vinda à nossa retrospectiva.';
    } else if (visitorSurname.trim().toLowerCase() === 'miketem') {
      msg = `Bem-vindo(a) ${visitorName} ${visitorSurname}, é um prazer receber a família!`;
    } else {
      msg = `Bem-vindo(a) ${visitorName}! Obrigado pela visita. Aqui estão minhas memórias com a Sofi.`;
    }
    setVisitorMsg(msg);
    setVisitorStep('showMsg');
    setTimeout(() => setVisitorStep('showMemory'), 2000);
  };

  // Personalizar mensagem para login Google
  useEffect(() => {
    if (user && !isCreator) {
      const [nome, ...sobrenomeArr] = (user.displayName || '').split(' ');
      const sobrenome = sobrenomeArr.join(' ');
      let msg = '';
      if (nome && sobrenome && nome.toLowerCase() === 'sofia' && sobrenome.toLowerCase() === 'miketem') {
        msg = 'Oi minha gatinha, bem vinda à nossa retrospectiva.';
      } else if (sobrenome && sobrenome.toLowerCase() === 'miketem') {
        msg = `Bem-vindo(a) ${nome} ${sobrenome}, é um prazer receber a família!`;
      } else if (nome) {
        msg = `Bem-vindo(a) ${nome}! Obrigado pela visita. Aqui estão minhas memórias com a Sofi.`;
      } else {
        msg = 'Bem-vindo(a)! Obrigado pela visita. Aqui estão minhas memórias com a Sofi.';
      }
      setVisitorMsg(msg);
      setVisitorStep('showMsg');
      setTimeout(() => setVisitorStep('showMemory'), 2000);
    }
  }, [user, isCreator]);

  // Detectar login do admin e mostrar tela de escolha
  useEffect(() => {
    if (isCreator) {
      setAdminChoice(null); // Resetar escolha ao logar
    }
  }, [isCreator]);

  // Função para criar nova memória
  const handleCreateMemory = (memoryData) => {
    setDraftMemory({ ...memoryData, createdAt: new Date().toISOString() });
    setPage('preview');
  };

  // Publicar memória no Firestore
  const handlePublishMemory = async () => {
    if (!draftMemory) return;
    const docRef = await addDoc(collection(db, 'memorias'), draftMemory);
    setMemories({ [docRef.id]: { ...draftMemory, id: docRef.id } });
    setCurrentMemoryId(docRef.id);
    setDraftMemory(null);
    setPage('memory');
  };

  // Editar draft (volta para o formulário)
  const handleEditDraft = () => {
    setPage('form');
  };

  // Função para editar memória existente
  const handleEditMemory = async (id, updatedData) => {
    const docRef = doc(db, 'memorias', id);
    await updateDoc(docRef, updatedData);
    setMemories((prev) => ({ ...prev, [id]: { ...prev[id], ...updatedData } }));
  };

  // Função para deletar memória
  const handleDeleteMemory = async (id) => {
    await deleteDoc(doc(db, 'memorias', id));
    setMemories({});
    setCurrentMemoryId(null);
    setPage('home');
  };

  const handleExitMemory = () => {
    setCurrentMemoryId(null);
    if (isCreator) {
      setPage('home');
    } else if (user) {
      // Usuário Google - volta para a tela de identificação
      setVisitorStep('ask');
    } else {
      // Usuário anônimo - volta para a tela de identificação
      setVisitorStep('ask');
    }
  }

  // Função para iniciar edição de memória existente
  const handleStartEdit = () => {
    setEditMode(true);
    setPage('edit');
  };

  // Função para salvar edição
  const handleSaveEdit = async (updatedData) => {
    if (!currentMemoryId) return;
    // Atualiza no Firestore
    await handleEditMemory(currentMemoryId, updatedData);
    // Leva para preview da memória atualizada
    setDraftMemory({ ...updatedData, id: currentMemoryId });
    setEditMode(false);
    setPage('preview');
    setAdminChoice(null);
  };

  const renderPage = () => {
    // Tela de escolha para admin
    if (isCreator && !adminChoice) {
      const hasMemory = Object.keys(memories).length > 0;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-6">
          <h2 className="text-2xl font-bold mb-2">O que deseja fazer?</h2>
          <button
            onClick={() => {
              if (hasMemory) {
                setCurrentMemoryId(getLastMemoryId());
                setAdminChoice('edit');
              } else {
                setAdminChoice('no-memory');
              }
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105"
          >
            Editar memória mais recente
          </button>
          <button onClick={() => setAdminChoice('new')} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105">Criar nova memória</button>
        </div>
      );
    }
    // Mensagem se não houver memória para editar
    if (isCreator && adminChoice === 'no-memory') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-6">
          <h2 className="text-2xl font-bold mb-2">Nenhuma memória encontrada.</h2>
          <p className="mb-4">Crie uma nova memória para começar.</p>
          <button onClick={() => setAdminChoice('new')} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105">Criar nova memória</button>
        </div>
      );
    }
    // Se admin escolher editar
    if (isCreator && adminChoice === 'edit') {
      if (!currentMemoryId || !memories[currentMemoryId]) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-6">
            <h2 className="text-2xl font-bold mb-2">Carregando memória para edição...</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
          </div>
        );
      }
      return <MemoryForm onCreateMemory={handleSaveEdit} onNavigate={() => { setEditMode(false); setPage('memory'); setAdminChoice(null); }} initialData={memories[currentMemoryId]} loadingMemory={loadingMemory} />;
    }
    // Se admin escolher criar nova
    if (isCreator && adminChoice === 'new') {
      return <MemoryForm onCreateMemory={handleCreateMemory} onNavigate={() => { setAdminChoice(null); setPage('home'); }} initialData={null} loadingMemory={loadingMemory} />;
    }
    // Preview só para criação de nova memória
    if (page === 'preview' && draftMemory) {
      return (
        <div>
          <MemoryPage memory={draftMemory} onExit={handleEditDraft} isCreator={true} />
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={handleEditDraft} className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg">Editar</button>
            <button onClick={handlePublishMemory} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg">Publicar</button>
          </div>
        </div>
      );
    }
    // Edição de memória existente
    if (page === 'edit' && currentMemoryId && memories[currentMemoryId]) {
      return <MemoryForm onCreateMemory={handleSaveEdit} onNavigate={() => { setEditMode(false); setPage('memory'); setAdminChoice(null); }} initialData={memories[currentMemoryId]} loadingMemory={loadingMemory} />;
    }
    if (page === 'memory') {
      if (currentMemoryId && memories[currentMemoryId]) {
        return <MemoryPage 
          memory={memories[currentMemoryId]} 
          onExit={handleExitMemory} 
          isCreator={isCreator}
          onEditMemory={handleStartEdit}
          onDeleteMemory={handleDeleteMemory}
        />;
      } else {
        return <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center"><h2 className="text-2xl text-amber-400">Memória não encontrada.</h2><p className="mt-2">Este link pode ser inválido ou de uma sessão diferente.</p><button onClick={handleExitMemory} className="mt-4 bg-emerald-500 p-2 rounded-lg">Voltar</button></div>
      }
    }
    switch (page) {
      case 'form':
        return isCreator ? <MemoryForm onCreateMemory={handleCreateMemory} onNavigate={setPage} loadingMemory={loadingMemory} /> : <HomePage onNavigate={setPage} />;
      case 'home':
        return isCreator ? <HomePage onNavigate={setPage} /> : <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center"><h1 className="text-4xl font-bold">Bem-vindo(a) à MY LOVED SOFIA rewind</h1><p className="text-slate-300 mt-2">Acesse uma memória através de um link compartilhado.</p></div>;
      default:
        return <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center"><h1 className="text-4xl font-bold">Bem-vindo(a) à MY LOVED SOFIA rewind</h1><p className="text-slate-300 mt-2">Acesse uma memória através de um link compartilhado.</p></div>;
    }
  };

  // Renderização condicional para visitantes (não autenticados)
  if (!isCreator && !user) {
    // Visitante não autenticado
    if (visitorStep === 'ask') {
      return (
        <main className="w-full h-screen bg-slate-900">
          {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <span className="text-white text-sm">Visitante</span>
            <button 
              onClick={() => {
                setVisitorStep('ask');
                setVisitorMsg('');
                setPage('home');
                setCurrentMemoryId(null);
              }} 
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              title="Voltar ao início"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Início
            </button>
          </div>
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Quem está acessando?</h2>
                <button 
                  onClick={() => {
                    setVisitorName('');
                    setVisitorSurname('');
                    setVisitorMsg('');
                    setPage('home');
                    setCurrentMemoryId(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Limpar e voltar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleVisitorSubmit} className="flex flex-col gap-3">
                <input type="text" placeholder="Nome" value={visitorName} onChange={e => setVisitorName(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg p-3 text-white" />
                <input type="text" placeholder="Sobrenome" value={visitorSurname} onChange={e => setVisitorSurname(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg p-3 text-white" />
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg">Acessar</button>
              </form>
              <div className="mt-4 text-center text-slate-400 text-sm">Ou</div>
              <button onClick={handleGoogleLogin} className="bg-white text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.69 30.77 0 24 0 14.82 0 6.71 5.13 2.69 12.56l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.04l7.19 5.59C43.99 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.13a14.5 14.5 0 0 1 0-8.26l-7.98-6.2A23.94 23.94 0 0 0 0 24c0 3.77.9 7.34 2.69 10.56l7.98-6.43z"/><path fill="#EA4335" d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.19-5.59c-2.01 1.35-4.6 2.15-8.7 2.15-6.38 0-11.87-3.59-14.33-8.79l-7.98 6.43C6.71 42.87 14.82 48 24 48z"/></g></svg>
                Entrar com Google
              </button>
            </div>
          </div>
        </main>
      );
    } else if (visitorStep === 'showMsg') {
      return (
        <main className="w-full h-screen bg-slate-900">
          {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <span className="text-white text-sm">Visitante</span>
            <button 
              onClick={() => {
                setVisitorStep('ask');
                setVisitorMsg('');
                setPage('home');
                setCurrentMemoryId(null);
              }} 
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              title="Voltar ao início"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Início
            </button>
          </div>
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4 text-center">
              <span className="text-2xl font-bold">{visitorMsg}</span>
            </div>
          </div>
        </main>
      );
    } else if (visitorStep === 'showMemory') {
      // Mostra a cápsula mais recente (memória)
      const memoryIds = Object.keys(memories);
      const lastMemory = memoryIds.length > 0 ? memories[memoryIds[memoryIds.length - 1]] : null;
      if (lastMemory) {
        return (
          <main className="w-full h-screen bg-slate-900">
            {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
              <span className="text-white text-sm">Visitante</span>
              <button 
                onClick={() => {
                  setVisitorStep('ask');
                  setVisitorMsg('');
                  setPage('home');
                  setCurrentMemoryId(null);
                }} 
                className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                title="Voltar ao início"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Início
              </button>
            </div>
            <MemoryPage memory={lastMemory} onExit={() => setVisitorStep('ask')} />
          </main>
        );
      } else {
        return (
          <main className="w-full h-screen bg-slate-900">
            {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
              <span className="text-white text-sm">Visitante</span>
              <button 
                onClick={() => {
                  setVisitorStep('ask');
                  setVisitorMsg('');
                  setPage('home');
                  setCurrentMemoryId(null);
                }} 
                className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                title="Voltar ao início"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Início
              </button>
            </div>
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white"><span>Nenhuma memória encontrada.</span></div>
          </main>
        );
      }
    }
  }

  // Renderização condicional para usuários Google autenticados (não criadores)
  if (!isCreator && user) {
    if (visitorStep === 'showMsg') {
      return (
        <main className="w-full h-screen bg-slate-900">
          {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <span className="text-white text-sm">Olá, {user.displayName || user.email}</span>
            <button 
              onClick={handleLogout} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              title="Sair da conta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4 text-center">
              <span className="text-2xl font-bold">{visitorMsg}</span>
            </div>
          </div>
        </main>
      );
    } else if (visitorStep === 'showMemory') {
      // Mostra a cápsula mais recente (memória)
      const memoryIds = Object.keys(memories);
      const lastMemory = memoryIds.length > 0 ? memories[memoryIds[memoryIds.length - 1]] : null;
      if (lastMemory) {
        return (
          <main className="w-full h-screen bg-slate-900">
            {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
              <span className="text-white text-sm">Olá, {user.displayName || user.email}</span>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                title="Sair da conta"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
            <MemoryPage memory={lastMemory} onExit={() => setVisitorStep('ask')} />
          </main>
        );
      } else {
        return (
          <main className="w-full h-screen bg-slate-900">
            {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
              <span className="text-white text-sm">Olá, {user.displayName || user.email}</span>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                title="Sair da conta"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white"><span>Nenhuma memória encontrada.</span></div>
          </main>
        );
      }
    } else {
      // Se não está em nenhum step específico, mostra a memória mais recente diretamente
      const memoryIds = Object.keys(memories);
      const lastMemory = memoryIds.length > 0 ? memories[memoryIds[memoryIds.length - 1]] : null;
      if (lastMemory) {
        return (
          <main className="w-full h-screen bg-slate-900">
            {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
              <span className="text-white text-sm">Olá, {user.displayName || user.email}</span>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                title="Sair da conta"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
            <MemoryPage memory={lastMemory} onExit={() => setVisitorStep('ask')} />
          </main>
        );
      } else {
        return (
          <main className="w-full h-screen bg-slate-900">
            {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
              <span className="text-white text-sm">Olá, {user.displayName || user.email}</span>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                title="Sair da conta"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white"><span>Nenhuma memória encontrada.</span></div>
          </main>
        );
      }
    }
  }

  return (
    <main className="w-full h-screen bg-slate-900">
      {/* Header com informações do usuário e logout - SEMPRE VISÍVEL */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        {user ? (
          <>
            <span className="text-white text-sm">Olá, {user.displayName || user.email}</span>
            <button 
              onClick={handleLogout} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              title="Sair da conta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </>
        ) : (
          <>
            <span className="text-white text-sm">Visitante</span>
            <button 
              onClick={() => {
                setVisitorStep('ask');
                setVisitorMsg('');
                setPage('home');
                setCurrentMemoryId(null);
              }} 
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              title="Voltar ao início"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Início
            </button>
          </>
        )}
      </div>
      {renderPage()}
    </main>
  );
} 