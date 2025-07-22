import React from 'react';

export default function VideoSelector({
  video,
  handleVideoSelection,
  handleRemoveVideo,
  handleReplaceVideo,
  handleUploadVideo,
}) {
  return (
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
  );
} 