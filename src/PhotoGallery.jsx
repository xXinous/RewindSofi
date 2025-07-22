import React from 'react';

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
  // Drag & drop para fotos
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handlePhotoSelection(files);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Selecionar/deselecionar imagem do Storage
  const toggleSelectStoragePhoto = (idx) => {
    setAvailableStoragePhotos(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  return (
    <div onDrop={handleDrop} onDragOver={handleDragOver} className="border-2 border-dashed border-emerald-400 rounded-lg p-3 mb-2 bg-slate-900/40 cursor-pointer">
      <label className="text-sm text-slate-400">Fotos Públicas (a primeira será a capa)</label>
      <input type="file" onChange={e => handlePhotoSelection(Array.from(e.target.files))} multiple accept="image/jpeg,image/png,image/webp" className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"/>
      <div className="text-xs text-slate-400 mt-1">Arraste e solte ou clique para selecionar. Formatos aceitos: JPG, PNG, WEBP. Máximo 10 fotos, até 5MB cada.</div>
      {/* Fotos novas ou já enviadas */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative bg-slate-700 rounded-lg p-2 flex flex-col items-center w-28">
              <img src={photo.url || ''} alt="Prévia" className="w-20 h-20 object-cover rounded mb-1 bg-slate-900" />
              <div className="text-xs text-slate-200 truncate w-full text-center">{photo.name}</div>
              <div className="text-xs text-slate-400">{(photo.file?.size/1024/1024).toFixed(2)}MB</div>
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
      {/* Botão de upload de fotos */}
      {photos.some(p => !p.uploaded) && (
        <button
          type="button"
          onClick={handleUploadPhotos}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg mt-2"
        >
          Enviar fotos
        </button>
      )}
      {/* Galeria de imagens já presentes no Storage para seleção */}
      {availableStoragePhotos.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-1">Imagens já presentes no Storage (opcional):</div>
          <div className="flex flex-wrap gap-3">
            {availableStoragePhotos.map((photo, i) => (
              <div key={i} className={`relative border-2 rounded-lg p-1 w-20 h-20 flex items-center justify-center ${photo.selected ? 'border-emerald-400' : 'border-slate-600'}`}
                onClick={() => toggleSelectStoragePhoto(i)}
                style={{ cursor: 'pointer' }}
              >
                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover rounded" />
                {photo.selected && <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {photos.length > 0 && <div className="text-emerald-400 mt-2">Todos os uploads concluídos!</div>}
    </div>
  );
} 