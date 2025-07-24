import React, { useState } from 'react';

export default function VideoSelector({
  video,
  handleVideoSelection,
  handleRemoveVideo,
  handleReplaceVideo,
  handleUploadVideo,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    if (files.length > 0) handleVideoSelection(files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="card stagger-children">
      <h3 className="text-xl font-bold mb-4 text-gradient">🎬 Vídeo Secreto</h3>
      
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 mb-4 cursor-pointer transition-all duration-300 ${
          isDragOver 
            ? 'border-pink-400 bg-pink-500/10 scale-105' 
            : 'border-pink-400/50 bg-slate-900/40 hover:border-pink-400 hover:bg-slate-900/60'
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🎥</div>
          <label className="text-sm text-slate-400 block mb-2">Vídeo Secreto (apenas para Secret Love)</label>
          <input 
            type="file" 
            onChange={e => handleVideoSelection(e.target.files[0])} 
            accept="video/mp4,video/webm,video/ogg" 
            className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer focus-visible"
          />
          <div className="text-xs text-slate-400 mt-2">
            Arraste e solte ou clique para selecionar. Formatos aceitos: MP4, WEBM, OGG.
          </div>
        </div>
      </div>

      {video && (
        <div className="flex flex-col items-center gap-3 mt-4 p-4 bg-slate-700 rounded-lg w-full max-w-sm mx-auto animate-fade-in-up">
          <div className="relative">
            <video 
              src={video.url} 
              controls 
              className="w-48 h-32 rounded bg-slate-900 hover:scale-105 transition-transform duration-300" 
            />
            {!video.uploaded && (
              <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                <div className="text-white text-sm">⏳ Aguardando upload...</div>
              </div>
            )}
          </div>
          
          <div className="text-center w-full">
            <div className="text-sm text-slate-200 truncate font-medium">{video.name}</div>
            <div className="text-xs text-slate-400">{(video.file?.size/1024/1024).toFixed(2)}MB</div>
          </div>
          
          {/* Barra de progresso */}
          <div className="w-full h-2 bg-slate-600 rounded overflow-hidden">
            <div 
              className="h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded transition-all duration-500" 
              style={{ width: `${video.progress}%` }}
            ></div>
          </div>
          
          {/* Controles */}
          <div className="flex gap-3 mt-2">
            <label className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">
              <input 
                type="file" 
                style={{ display: 'none' }} 
                accept="video/mp4,video/webm,video/ogg" 
                onChange={e => handleReplaceVideo(e.target.files[0])} 
              />
              🔄 Substituir
            </label>
            <button 
              type="button" 
              onClick={handleRemoveVideo} 
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              🗑️ Remover
            </button>
          </div>
        </div>
      )}

      {/* Botão de upload de vídeo */}
      {video && !video.uploaded && (
        <button
          type="button"
          onClick={handleUploadVideo}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 mt-4 animate-bounce-in"
        >
          📤 Enviar Vídeo
        </button>
      )}

      {/* Status de conclusão */}
      {video && video.uploaded && (
        <div className="mt-4 p-3 bg-pink-500/20 border border-pink-500/30 rounded-lg text-pink-300 text-center animate-fade-in-up">
          ✨ Vídeo enviado com sucesso!
        </div>
      )}
    </div>
  );
} 