import React, { useEffect, useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Ícones SVG como componentes
const PlayIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const SkipBackIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" x2="5" y1="19" y2="5"></line></svg>;
const SkipForwardIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" x2="19" y1="5" y2="19"></line></svg>;
const ShuffleIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 14 4 4-4 4"></path><path d="m18 2 4 4-4 4"></path><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"></path><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"></path><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"></path></svg>;
const RepeatIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path></svg>;
const ChevronDownIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"></path></svg>;
const EllipsisIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;
const CameraIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>;

// Função para obter URL de embed
const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube: aceita links padrão, curtos e de música
  let youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/);
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  // Spotify
  let spotifyMatch = url.match(/(?:https?:\/\/)?open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) {
    return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;
  }
  return null;
};

// Componente para calcular tempo junto
function TimeTogether({ startDate, title = "Tempo Juntos" }) {
  const calculateDuration = () => {
    if (!startDate) {
      return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const start = new Date(startDate);
    const now = new Date();
    
    // Verificar se a data é válida
    if (isNaN(start.getTime())) {
      console.error('❌ TimeTogether: Data inválida:', startDate);
      return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    console.log('🔍 TimeTogether: Calculando duração - startDate:', startDate, 'start:', start, 'now:', now);
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const diff = now - start;
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const result = { years, months, days, hours, minutes, seconds };
    console.log('🔍 TimeTogether: Resultado do cálculo:', result);
    
    return result;
  };

  const [duration, setDuration] = useState(calculateDuration());

  useEffect(() => {
    console.log('🔍 TimeTogether: useEffect - startDate mudou para:', startDate);
    setDuration(calculateDuration());
    
    const timer = setInterval(() => {
      const newDuration = calculateDuration();
      setDuration(newDuration);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startDate]);

  const timeUnits = [
    { label: 'Anos', value: duration.years },
    { label: 'Meses', value: duration.months },
    { label: 'Dias', value: duration.days },
    { label: 'Horas', value: duration.hours },
    { label: 'Minutos', value: duration.minutes },
    { label: 'Segundos', value: duration.seconds },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-white text-center">{title}</h3>
      <div className="grid gap-4 grid-cols-3">
        {timeUnits.map(unit => (
          <div key={unit.label} className="flex flex-col items-center p-4 rounded-xl border-2 border-b-[6px] border-white/20">
            <span className="text-2xl font-bold mb-1 text-white">{unit.value}</span>
            <span className="text-sm text-slate-300">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemoryPage({ memory, onExit, isCreator }) {
  const { title, message, musicUrl, musicTitle, musicArtist, coupleNames, startDate, photos, id } = memory;
  const coverArt = photos && photos.length > 0 ? photos[0] : null;
  const embedUrl = getEmbedUrl(musicUrl);
  
  // Estado para o cronômetro de namoro
  const [datingStartDate, setDatingStartDate] = useState(null);
  const [showDatingTimer, setShowDatingTimer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  // Carregar data de início do namoro
  useEffect(() => {
    const loadDatingStartDate = async () => {
      if (!id) return;
      
      console.log('🔍 MemoryPage: Carregando data de namoro para memória:', id);
      
      try {
        const memoryDoc = await getDoc(doc(db, 'memorias', id));
        console.log('🔍 MemoryPage: Documento existe:', memoryDoc.exists());
        
        if (memoryDoc.exists()) {
          const data = memoryDoc.data();
          console.log('🔍 MemoryPage: Dados da memória:', data);
          console.log('🔍 MemoryPage: datingStartDate:', data.datingStartDate);
          
          if (data.datingStartDate) {
            console.log('✅ MemoryPage: Data de namoro encontrada, ativando cronômetro');
            setDatingStartDate(data.datingStartDate);
            setShowDatingTimer(true);
          } else {
            console.log('❌ MemoryPage: Nenhuma data de namoro encontrada');
            setDatingStartDate(null);
            setShowDatingTimer(false);
          }
        } else {
          console.log('❌ MemoryPage: Documento não existe');
          setDatingStartDate(null);
          setShowDatingTimer(false);
        }
      } catch (error) {
        console.error('❌ MemoryPage: Erro ao carregar data de namoro:', error);
        // Em caso de erro, tentar usar o estado local
        if (memory.datingStartDate) {
          console.log('✅ MemoryPage: Usando data de namoro do estado local');
          setDatingStartDate(memory.datingStartDate);
          setShowDatingTimer(true);
        }
      }
    };

    loadDatingStartDate();
  }, [id, memory.datingStartDate]);

  // Verificar se a memória tem datingStartDate no estado local também
  useEffect(() => {
    console.log('🔍 MemoryPage: Verificando estado local - memory.datingStartDate:', memory.datingStartDate);
    console.log('🔍 MemoryPage: showDatingTimer atual:', showDatingTimer);
    console.log('🔍 MemoryPage: datingStartDate atual:', datingStartDate);
    
    if (memory.datingStartDate && !showDatingTimer) {
      console.log('✅ MemoryPage: Data de namoro encontrada no estado local, ativando cronômetro');
      setDatingStartDate(memory.datingStartDate);
      setShowDatingTimer(true);
    } else if (!memory.datingStartDate && showDatingTimer) {
      console.log('❌ MemoryPage: Data de namoro removida do estado local, desativando cronômetro');
      setDatingStartDate(null);
      setShowDatingTimer(false);
    }
  }, [memory.datingStartDate, showDatingTimer]);

  // Função para ativar o cronômetro de namoro
  const handleSheSaidYes = async () => {
    if (!isCreator || !id) return;
    
    setIsLoading(true);
    try {
      const now = new Date();
      const memoryRef = doc(db, 'memorias', id);
      
      console.log('🔍 MemoryPage: Ativando cronômetro de namoro para memória:', id);
      console.log('🔍 MemoryPage: Data atual:', now.toISOString());
      
      await updateDoc(memoryRef, {
        datingStartDate: now.toISOString()
      });
      
      console.log('✅ MemoryPage: Cronômetro ativado no Firestore');
      
      setDatingStartDate(now.toISOString());
      setShowDatingTimer(true);
      
      console.log('✅ MemoryPage: Estado local atualizado');
      console.log('✅ Cronômetro de namoro ativado!');
      
      // Recarregar a página após um breve delay para garantir sincronização
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao ativar cronômetro de namoro:', error);
      alert('Erro ao ativar cronômetro de namoro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <img 
                src={coverArt} 
                alt="Capa da memória" 
                className="w-full max-w-sm aspect-square object-cover rounded-lg shadow-2xl" 
                onError={(e) => {
                  console.warn('Erro ao carregar capa da memória:', coverArt);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full max-w-sm aspect-square bg-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-400">
                <CameraIcon className="w-12 h-12" />
                <p className="mt-2">Nenhuma foto adicionada</p>
              </div>
            )}
          </div>

          <div className="flex flex-col w-full h-fit gap-2">
            <div className="flex w-full justify-between items-center h-fit">
              <div className="flex flex-col w-[80%] overflow-hidden">
                <h3 className="text-white font-extrabold text-2xl">
                  {musicTitle}
                </h3>
                <span className="text-slate-300 font-light">{musicArtist}</span>
              </div>
            </div>
            {/* Progress Bar (visual only) */}
            <div className="flex w-full h-1.5 rounded-lg bg-white/25 relative items-center">
              <div className="absolute left-0 top-0 bg-white rounded-l-lg h-full" style={{ width: '30%' }}></div>
              <div className="absolute h-3 w-3 rounded-full bg-white z-10" style={{ left: '30%', transform: 'translateX(-50%)' }}></div>
            </div>
            <div className="flex w-full h-fit justify-between text-xs text-slate-300">
              <p>0:58</p>
              <p>2:59</p>
            </div>
          </div>
          
          {/* Controls (visual only) */}
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

           {/* Player de Música Embutido */}
          {embedUrl && (
            <div className="mt-4">
              <iframe
                key={embedUrl}
                src={embedUrl}
                className="w-full rounded-xl shadow-lg aspect-video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Embedded Music Player"
              ></iframe>
            </div>
          )}
        </div>

        {/* "Sobre o casal" Section */}
        <div className="flex flex-col gap-6 h-fit w-full mt-4">
          <div className="flex flex-col bg-[#332f2f] h-fit w-full z-10 rounded-2xl">
            <div className="flex flex-col gap-4 p-4 w-full">
              <div className="flex flex-col text-white">
                <span className="font-black text-2xl">{coupleNames}</span>
                <span className="font-extralight text-base text-slate-300">Juntos desde {new Date(startDate).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <TimeTogether startDate={startDate} title="Tempo Juntos" />
              
              {/* Cronômetro de Namoro (visível para todos quando ativado) */}
              {console.log('🔍 MemoryPage: Renderizando cronômetro - showDatingTimer:', showDatingTimer, 'datingStartDate:', datingStartDate)}
              {showDatingTimer && datingStartDate && (
                <div className="mt-6 p-4 bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-xl border border-pink-500/30">
                  <TimeTogether startDate={datingStartDate} title="💕 Tempo de Namoro" />
                </div>
              )}
              
              {/* Botão para ativar cronômetro (apenas para criadores quando não ativo) */}
              {isCreator && !showDatingTimer && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                  <div className="text-center">
                    <p className="text-yellow-300 font-semibold mb-3">⏰ Cronômetro de Namoro</p>
                    <p className="text-yellow-200 text-sm mb-4">
                      Clique no botão abaixo para ativar o cronômetro de namoro.
                    </p>
                    <button 
                      onClick={handleSheSaidYes}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Ativando...
                        </>
                      ) : (
                        <>
                          <span className="text-xl">💍</span>
                          Ativar Cronômetro de Namoro
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* Mensagem Especial */}
        <div className="flex w-full h-fit items-center justify-center mb-4">
          <div className="flex gap-5 p-6 flex-col h-fit w-full z-10 rounded-2xl" style={{ backgroundColor: 'rgb(228, 44, 20)' }}>
            <span className="font-bold text-white text-xl">Mensagem especial</span>
            <div className="font-bold text-2xl leading-9 text-white whitespace-pre-wrap">{message}</div>
          </div>
        </div>
        
        {/* Galeria de Fotos Adicionais */}
        {photos && photos.length > 1 && (
          <div className="flex flex-col gap-5 w-full items-center mb-4">
            {photos.slice(1).map((photoUrl, index) => (
              <img 
                key={index} 
                src={photoUrl} 
                alt={`Foto da memória ${index + 2}`} 
                className="w-full max-w-3xl h-auto rounded-2xl shadow-lg"
                onError={(e) => {
                  console.warn('Erro ao carregar imagem da memória:', photoUrl);
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}

        {/* Imagem Final */}
         <div className="flex w-full h-fit items-center justify-center mb-6">
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-center p-8">
            <div className="text-2xl font-bold">
              TimeCapsule 💝
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 