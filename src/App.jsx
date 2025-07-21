import React, { useState, useEffect } from 'react';
import { app, db, storage } from './firebase';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
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
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';

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
      <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">MY LOVED SOFIA rewind</h1>
      <p className="mb-8 text-lg text-slate-300">Guarde aqui suas memórias e sentimentos mais especiais.</p>
      <button onClick={() => onNavigate('form')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105">
        Criar nova memória
      </button>
    </div>
  );
}

function MemoryForm({ onCreateMemory, onNavigate, initialData }) {
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

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [allUploadsDone, setAllUploadsDone] = useState(false);

  const MAX_PHOTOS = 10;
  const MAX_PHOTO_SIZE_MB = 5;
  const MAX_VIDEO_SIZE_MB = 50;

  // Novo estado para fotos: array de objetos { url, name, size, progress, uploading, ref }
  const [photoObjs, setPhotoObjs] = useState([]);
  // Novo estado para vídeo secreto: objeto { url, name, size, progress, uploading, ref }
  const [secretVideoObj, setSecretVideoObj] = useState(null);

  // Se initialData existir, preenche os campos
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
        setPhotoObjs(initialData.photos.map(url => ({ url, name: url.split('/').pop(), size: 0, progress: 100, uploading: false, ref: null })));
      }
      // Vídeo secreto já existente
      if (initialData.secretVideo) {
        setSecretVideoObj({ url: initialData.secretVideo, name: initialData.secretVideo.split('/').pop(), size: 0, progress: 100, uploading: false, ref: null });
      }
    }
  }, [initialData]);

  // Upload de uma foto individual com timeout
  const uploadPhoto = (file, idx) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `memories/photos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      let newPhoto = {
        url: '',
        name: file.name,
        size: file.size,
        progress: 0,
        uploading: true,
        ref: storageRef
      };
      setPhotoObjs(prev => {
        const arr = [...prev];
        arr[idx] = newPhoto;
        return arr;
      });
      // Timeout de 60s
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        setPhotoObjs(prev => {
          const arr = [...prev];
          arr[idx] = { ...arr[idx], uploading: false };
          return arr;
        });
        setUploadError('O upload está demorando mais do que o esperado. Verifique sua conexão ou tente novamente.');
        reject(new Error('Timeout de upload'));
      }, 60000);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setPhotoObjs(prev => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], progress };
            return arr;
          });
        },
        (error) => {
          clearTimeout(timeout);
          setPhotoObjs(prev => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], uploading: false };
            return arr;
          });
          if (error.code === 'storage/canceled') {
            setUploadError('O upload foi cancelado por demora excessiva.');
          }
          reject(error);
        },
        async () => {
          clearTimeout(timeout);
          const url = await getDownloadURL(storageRef);
          setPhotoObjs(prev => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], url, uploading: false };
            return arr;
          });
          resolve(url);
        }
      );
    });
  };

  // Upload de fotos múltiplas em paralelo
  const handlePhotoUpload = async (files) => {
    setUploadError('');
    if (files.length + photoObjs.length > MAX_PHOTOS) {
      setUploadError(`Você pode enviar no máximo ${MAX_PHOTOS} fotos.`);
      return;
    }
    for (const file of files) {
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        setUploadError(`Cada foto deve ter no máximo ${MAX_PHOTO_SIZE_MB}MB.`);
        return;
      }
    }
    // Adiciona placeholders
    const startIdx = photoObjs.length;
    setPhotoObjs(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size, progress: 0, uploading: true, url: '', ref: null }))]);
    // Upload em paralelo
    await Promise.all(files.map((file, i) => uploadPhoto(file, startIdx + i)));
  };

  // Drag & drop para fotos
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handlePhotoUpload(files);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Verifica se todos os uploads estão prontos
  useEffect(() => {
    const allPhotosDone = photoObjs.every(p => !p.uploading);
    const videoDone = !secretLoveEnabled || !secretVideoObj || !secretVideoObj.uploading;
    setAllUploadsDone(allPhotosDone && videoDone);
  }, [photoObjs, secretLoveEnabled, secretVideoObj]);

  // Remover foto (apaga do Storage se já enviada)
  const handleRemovePhoto = async (idx) => {
    const obj = photoObjs[idx];
    if (obj && obj.url && obj.ref) {
      try { await deleteObject(obj.ref); } catch {}
    }
    setPhotoObjs(prev => prev.filter((_, i) => i !== idx));
  };

  // Substituir foto
  const handleReplacePhoto = (file, idx) => {
    handleRemovePhoto(idx).then(() => handlePhotoUpload([file]));
  };

  // Upload de vídeo secreto com timeout
  const uploadSecretVideo = (file) => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        setUploadError(`O vídeo deve ter no máximo ${MAX_VIDEO_SIZE_MB}MB.`);
        reject();
        return;
      }
      const storageRef = ref(storage, `memories/secret_videos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      let newVid = {
        url: '',
        name: file.name,
        size: file.size,
        progress: 0,
        uploading: true,
        ref: storageRef
      };
      setSecretVideoObj(newVid);
      // Timeout de 60s
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        setSecretVideoObj(v => ({ ...v, uploading: false }));
        setUploadError('O upload do vídeo está demorando mais do que o esperado. Verifique sua conexão ou tente novamente.');
        reject(new Error('Timeout de upload'));
      }, 60000);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setSecretVideoObj(v => ({ ...v, progress }));
        },
        (error) => {
          clearTimeout(timeout);
          setSecretVideoObj(v => ({ ...v, uploading: false }));
          if (error.code === 'storage/canceled') {
            setUploadError('O upload do vídeo foi cancelado por demora excessiva.');
          }
          reject(error);
        },
        async () => {
          clearTimeout(timeout);
          const url = await getDownloadURL(storageRef);
          setSecretVideoObj(v => ({ ...v, url, uploading: false }));
          resolve(url);
        }
      );
    });
  };

  const handleSecretVideoUpload = async (file) => {
    setUploadError('');
    await uploadSecretVideo(file);
  };

  // Remover vídeo secreto
  const handleRemoveSecretVideo = async () => {
    if (secretVideoObj && secretVideoObj.ref) {
      try { await deleteObject(secretVideoObj.ref); } catch {}
    }
    setSecretVideoObj(null);
  };

  // Substituir vídeo secreto
  const handleReplaceSecretVideo = (file) => {
    handleRemoveSecretVideo().then(() => handleSecretVideoUpload(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message || !startDate || !coupleNames || !musicTitle || !musicArtist) {
      setError('Todos os campos principais são obrigatórios.');
      return;
    }
    if (secretLoveEnabled && (!secretPassword || !secretMessage || !secretVideoObj || !secretVideoObj.url)) {
      setError('Para a seção "Secret Love", a senha, a mensagem secreta e o vídeo são obrigatórios.');
      return;
    }
    setError('');
    onCreateMemory({ 
      title, message, musicUrl, musicTitle, musicArtist, coupleNames, startDate, photos: photoObjs.map(p => p.url),
      secretLoveEnabled, secretPassword, secretVideo: secretVideoObj ? secretVideoObj.url : null, secretMessage
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full bg-slate-800 text-white rounded-2xl shadow-xl">
      <button onClick={() => onNavigate('home')} className="mb-6 text-emerald-400 hover:text-emerald-300">&larr; Voltar</button>
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
        <input type="url" value={musicUrl} onChange={e => setMusicUrl(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Link da Música (Spotify, YouTube)"/>
        <div onDrop={handleDrop} onDragOver={handleDragOver} className="border-2 border-dashed border-emerald-400 rounded-lg p-3 mb-2 bg-slate-900/40 cursor-pointer">
          <label className="text-sm text-slate-400">Fotos Públicas (a primeira será a capa)</label>
          <input type="file" onChange={e => handlePhotoUpload(Array.from(e.target.files))} multiple accept="image/jpeg,image/png,image/webp" className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"/>
          <div className="text-xs text-slate-400 mt-1">Arraste e solte ou clique para selecionar. Formatos aceitos: JPG, PNG, WEBP. Máximo {MAX_PHOTOS} fotos, até {MAX_PHOTO_SIZE_MB}MB cada.</div>
          {photoObjs.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-2">
              {photoObjs.map((photo, i) => (
                <div key={i} className="relative bg-slate-700 rounded-lg p-2 flex flex-col items-center w-28">
                  <img src={photo.url || ''} alt="Prévia" className="w-20 h-20 object-cover rounded mb-1 bg-slate-900" />
                  <div className="text-xs text-slate-200 truncate w-full text-center">{photo.name}</div>
                  <div className="text-xs text-slate-400">{(photo.size/1024/1024).toFixed(2)}MB</div>
                  <div className="w-full h-2 bg-slate-600 rounded mt-1">
                    <div className="h-2 bg-emerald-400 rounded" style={{ width: `${photo.progress}%` }}></div>
                  </div>
                  <div className="flex gap-1 mt-1">
                    <label className="text-xs text-blue-400 cursor-pointer">
                      <input type="file" style={{ display: 'none' }} accept="image/jpeg,image/png,image/webp" onChange={e => handleReplacePhoto(e.target.files[0], i)} />
                      Substituir
                    </label>
                    <button type="button" onClick={() => handleRemovePhoto(i)} className="text-xs text-red-400 ml-2">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {allUploadsDone && photoObjs.length > 0 && <div className="text-emerald-400 mt-2">Todos os uploads concluídos!</div>}
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
                <input type="file" onChange={e => handleSecretVideoUpload(e.target.files[0])} accept="video/mp4,video/webm,video/ogg" className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"/>
                <div className="text-xs text-slate-400 mt-1">Formatos aceitos: MP4, WEBM, OGG. Máximo {MAX_VIDEO_SIZE_MB}MB.</div>
                {secretVideoObj && (
                  <div className="flex flex-col items-center gap-2 mt-2 bg-slate-700 rounded-lg p-2 w-56">
                    <video src={secretVideoObj.url || ''} controls className="w-40 h-24 rounded bg-slate-900" />
                    <div className="text-xs text-slate-200 truncate w-full text-center">{secretVideoObj.name}</div>
                    <div className="text-xs text-slate-400">{(secretVideoObj.size/1024/1024).toFixed(2)}MB</div>
                    <div className="w-full h-2 bg-slate-600 rounded mt-1">
                      <div className="h-2 bg-pink-400 rounded" style={{ width: `${secretVideoObj.progress}%` }}></div>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <label className="text-xs text-blue-400 cursor-pointer">
                        <input type="file" style={{ display: 'none' }} accept="video/mp4,video/webm,video/ogg" onChange={e => handleReplaceSecretVideo(e.target.files[0])} />
                        Substituir
                      </label>
                      <button type="button" onClick={handleRemoveSecretVideo} className="text-xs text-red-400 ml-2">Remover</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-transform transform hover:scale-101" disabled={!allUploadsDone}>
          Criar memória
        </button>
      </form>
    </div>
  );
}

function parseDateTimeBR(str) {
  // Espera formato DD/MM/AAAA HH:mm
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!match) return null;
  const [_, dd, mm, yyyy, hh, min] = match;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
}

function TimeTogether({ startDate }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(interval);
  }, []);
  const start = startDate ? new Date(startDate) : null;
  if (!start || isNaN(start.getTime())) return <span className="text-red-400">Data inválida</span>;
  let diff = now - start.getTime();
  if (diff < 0) diff = 0;
  let ms = diff % 1000;
  let totalSec = Math.floor(diff / 1000);
  let sec = totalSec % 60;
  let totalMin = Math.floor(totalSec / 60);
  let min = totalMin % 60;
  let totalHr = Math.floor(totalMin / 60);
  let hr = totalHr % 24;
  let totalDays = Math.floor(totalHr / 24);
  let weeks = Math.floor(totalDays / 7);
  let days = totalDays % 7;
  // Aproximação para meses/anos
  let months = Math.floor(totalDays / 30.4375);
  let years = Math.floor(months / 12);
  months = months % 12;
  return (
    <div className="flex flex-wrap gap-2 text-emerald-300 font-mono text-lg mt-2">
      <span>{years} ano{years!==1?'s':''}</span>
      <span>{months} mês{months!==1?'es':''}</span>
      <span>{weeks} semana{weeks!==1?'s':''}</span>
      <span>{days} dia{days!==1?'s':''}</span>
      <span>{hr}h</span>
      <span>{min}m</span>
      <span>{sec}s</span>
      <span>{ms.toString().padStart(3,'0')}ms</span>
    </div>
  );
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

function MemoryPage({ memory, onExit, isCreator, onEditMemory, onDeleteMemory }) {
  const { title, message, musicUrl, musicTitle, musicArtist, coupleNames, startDate, photos, secretLoveEnabled, secretPassword, secretVideoUrl, secretMessage, secretVideo } = memory;
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

          {/* Título e Artista */}
          <div className="flex flex-col w-full h-fit gap-2">
            <div className="flex w-full justify-between items-center h-fit">
              <div className="flex flex-col w-[80%] overflow-hidden">
                <h3 className="text-white font-extrabold text-2xl scrolling-text-container">
                  <span className="scrolling-text">{musicTitle}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                </h3>
                <span className="text-slate-300 font-light">{musicArtist}</span>
              </div>
            </div>
            {/* Barra de Progresso (Apenas Visual) */}
            <div className="flex w-full h-1.5 rounded-lg bg-white/25 relative items-center">
              <div className="absolute left-0 top-0 bg-white rounded-l-lg h-full" style={{ width: '30%' }}></div>
              <div className="absolute h-3 w-3 rounded-full bg-white z-10" style={{ left: '30%', transform: 'translateX(-50%)' }}></div>
            </div>
            <div className="flex w-full h-fit justify-between text-xs text-slate-300">
              <p>0:58</p>
              <p>2:59</p>
            </div>
          </div>
          {/* Controles do Player (Apenas Visual) */}
          <div className="flex justify-between items-center h-fit text-white">
            <ShuffleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            <div className="flex flex-row h-fit items-center justify-center gap-6 sm:gap-8">
              <SkipBackIcon className="w-7 h-7 sm:w-8 sm:h-8"/>
              <div className="flex p-0 items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black">
                <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <SkipForwardIcon className="w-7 h-7 sm:w-8 sm:h-8"/>
            </div>
            <RepeatIcon className="w-6 h-6 sm:w-7 sm:h-7"/>
          </div>
          {/* Player de Música Embutido (Funcional) */}
          {embedUrl && (
            <div className="mt-4">
              <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 0,
                    borderRadius: '12px'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Embedded Music Player"
                ></iframe>
              </div>
            </div>
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
            <SecretLoveSection password={secretPassword} videoUrl={secretVideo || secretVideoUrl} secretMessage={secretMessage} />
          </div>
        )}
        {/* Imagem Final */}
        <div className="flex w-full h-fit items-center justify-center mb-6">
          <img alt="wrapped-banner" className="w-full h-auto rounded-2xl" src="https://placehold.co/800x400/010101/FFF?text=TimeCapsule" />
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
}

export default function App() {
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
    const auth = getAuth(app);
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
      querySnapshot.forEach((docSnap) => {
        loaded[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
      setMemories(loaded);
      setLoadingMemory(false);
    }
    fetchLatestMemory();
  }, []);

  const handleGoogleLogin = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      alert('Erro ao fazer login com Google.');
    }
  };

  const handleLogout = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    setIsCreator(false);
    setUser(null);
    setVisitorStep('ask');
    setVisitorMsg('');
    setPage('home');
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
    setPage(isCreator ? 'home' : 'viewer_welcome');
  }

  // Função para iniciar edição de memória existente
  const handleStartEdit = () => {
    setEditMode(true);
    setPage('edit');
  };

  // Função para salvar edição
  const handleSaveEdit = async (updatedData) => {
    if (!currentMemoryId) return;
    await handleEditMemory(currentMemoryId, updatedData);
    setEditMode(false);
    setPage('memory');
  };

  const renderPage = () => {
    // Tela de escolha para admin
    if (isCreator && !adminChoice) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-6">
          <h2 className="text-2xl font-bold mb-2">O que deseja fazer?</h2>
          <button onClick={() => setAdminChoice('edit')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105">Editar memória mais recente</button>
          <button onClick={() => setAdminChoice('new')} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105">Criar nova memória</button>
        </div>
      );
    }
    // Se admin escolher editar
    if (isCreator && adminChoice === 'edit' && currentMemoryId && memories[currentMemoryId]) {
      return <MemoryForm onCreateMemory={handleSaveEdit} onNavigate={() => { setEditMode(false); setPage('memory'); setAdminChoice(null); }} initialData={memories[currentMemoryId]} />;
    }
    // Se admin escolher criar nova
    if (isCreator && adminChoice === 'new') {
      return <MemoryForm onCreateMemory={handleCreateMemory} onNavigate={() => { setAdminChoice(null); setPage('home'); }} initialData={null} />;
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
      return <MemoryForm onCreateMemory={handleSaveEdit} onNavigate={() => { setEditMode(false); setPage('memory'); setAdminChoice(null); }} initialData={memories[currentMemoryId]} />;
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
        return isCreator ? <MemoryForm onCreateMemory={handleCreateMemory} onNavigate={setPage} /> : <HomePage onNavigate={setPage} />;
      case 'home':
        return isCreator ? <HomePage onNavigate={setPage} /> : <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center"><h1 className="text-4xl font-bold">Bem-vindo(a) à MY LOVED SOFIA rewind</h1><p className="text-slate-300 mt-2">Acesse uma memória através de um link compartilhado.</p></div>;
      default:
        return <div className="text-center p-8 text-white bg-slate-900 h-screen flex flex-col justify-center"><h1 className="text-4xl font-bold">Bem-vindo(a) à MY LOVED SOFIA rewind</h1><p className="text-slate-300 mt-2">Acesse uma memória através de um link compartilhado.</p></div>;
    }
  };

  // Renderização condicional
  if (!isCreator && !user) {
    // Visitante não autenticado
    if (visitorStep === 'ask') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4">
            <h2 className="text-2xl font-bold mb-2">Quem está acessando?</h2>
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
      );
    } else if (visitorStep === 'showMsg') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4 text-center">
            <span className="text-2xl font-bold">{visitorMsg}</span>
          </div>
        </div>
      );
    } else if (visitorStep === 'showMemory') {
      // Mostra a cápsula mais recente (memória)
      const memoryIds = Object.keys(memories);
      const lastMemory = memoryIds.length > 0 ? memories[memoryIds[memoryIds.length - 1]] : null;
      if (lastMemory) {
        return <MemoryPage memory={lastMemory} onExit={() => setVisitorStep('ask')} />;
      } else {
        return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white"><span>Nenhuma memória encontrada.</span></div>;
      }
    }
  }

  return (
    <main className="w-full h-screen bg-slate-900">
      {user && (
        <div className="absolute top-4 right-4 z-50">
          <span className="mr-2">Olá, {user.displayName || user.email}</span>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded">Sair</button>
        </div>
      )}
      {renderPage()}
    </main>
  );
} 