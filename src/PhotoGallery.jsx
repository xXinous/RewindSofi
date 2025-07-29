import React, { useState } from 'react';

export default function PhotoGallery({
  photos,
  setPhotos,
  availableStoragePhotos,
  setAvailableStoragePhotos,
  handlePhotoSelection,
  handleRemovePhoto,
  handleReplacePhoto,
  handleUploadPhotos,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag & drop para fotos
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handlePhotoSelection(files);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Selecionar/deselecionar imagem do Storage
  const toggleSelectStoragePhoto = (idx) => {
    setAvailableStoragePhotos(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  return (
    <div className="card stagger-children">
      <h3 className="text-xl font-bold mb-4 text-gradient">📸 Galeria de Fotos</h3>
      
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 mb-4 cursor-pointer transition-all duration-300 ${
          isDragOver 
            ? 'border-emerald-400 bg-emerald-500/10 scale-105' 
            : 'border-emerald-400/50 bg-slate-900/40 hover:border-emerald-400 hover:bg-slate-900/60'
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">📷</div>
          <label className="text-sm text-slate-400 block mb-2">Fotos Públicas (a primeira será a capa)</label>
          <input 
            type="file" 
            onChange={e => handlePhotoSelection(Array.from(e.target.files))} 
            multiple 
            accept="image/jpeg,image/png,image/webp" 
            className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer focus-visible"
          />
          <div className="text-xs text-slate-400 mt-2">
            Arraste e solte ou clique para selecionar. Formatos aceitos: JPG, PNG, WEBP. Máximo 10 fotos.
          </div>
        </div>
      </div>

      {/* Fotos novas ou já enviadas */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {photos.map((photo, i) => (
            <div 
              key={i} 
              className="relative bg-slate-700 rounded-lg p-3 flex flex-col items-center w-32 hover-lift animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <img 
                src={photo.url || ''} 
                alt="Prévia" 
                className="w-24 h-24 object-cover rounded mb-2 bg-slate-900 hover:scale-105 transition-transform duration-300" 
                onError={(e) => {
                  console.warn('Erro ao carregar imagem:', photo.url);
                  e.target.style.display = 'none';
                }}
              />
              <div className="text-xs text-slate-200 truncate w-full text-center font-medium">{photo.name}</div>
              <div className="text-xs text-slate-400">{(photo.file?.size/1024/1024).toFixed(2)}MB</div>
              
              {/* Barra de progresso */}
              <div className="w-full h-2 bg-slate-600 rounded mt-2 overflow-hidden">
                <div 
                  className="h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded transition-all duration-500" 
                  style={{ width: `${photo.progress}%` }}
                ></div>
              </div>
              
              {/* Controles */}
              <div className="flex gap-2 mt-2">
                <label className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 transition-colors">
                  <input 
                    type="file" 
                    style={{ display: 'none' }} 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={e => handleReplacePhoto(e.target.files[0], i)} 
                  />
                  🔄 Substituir
                </label>
                <button 
                  type="button" 
                  onClick={() => handleRemovePhoto(i)} 
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão de upload de fotos */}
      {photos.some(p => !p.uploaded) && (
        <button
          type="button"
          onClick={handleUploadPhotos}
          className="btn-primary mt-4 animate-bounce-in"
        >
          📤 Enviar Fotos
        </button>
      )}

      {/* Galeria de imagens já presentes no Storage para seleção */}
      {availableStoragePhotos.length > 0 && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
          <div className="text-sm text-slate-300 mb-3 font-medium">🖼️ Imagens já presentes no Storage (opcional):</div>
          <div className="flex flex-wrap gap-3">
            {availableStoragePhotos.map((photo, i) => (
              <div 
                key={i} 
                className={`relative border-2 rounded-lg p-1 w-20 h-20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer ${
                  photo.selected 
                    ? 'border-emerald-400 bg-emerald-500/20' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => toggleSelectStoragePhoto(i)}
              >
                <img 
                  src={photo.url} 
                  alt={photo.name} 
                  className="w-full h-full object-cover rounded" 
                  onError={(e) => {
                    console.warn('Erro ao carregar imagem do Storage:', photo.url);
                    e.target.style.display = 'none';
                  }}
                />
                {photo.selected && (
                  <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs animate-bounce-in">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status de conclusão */}
      {photos.length > 0 && photos.every(p => p.uploaded) && (
        <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-center animate-fade-in-up">
          ✨ Todos os uploads concluídos!
        </div>
      )}
    </div>
  );
} 