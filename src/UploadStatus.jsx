import React from 'react';

export default function UploadStatus({ error, uploadError, loading, children }) {
  return (
    <div className="mb-6">
      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-3 border border-red-500/30 animate-bounce-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}
      
      {uploadError && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-3 border border-red-500/30 animate-bounce-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">📤</span>
            <span className="font-medium">{uploadError}</span>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="flex items-center gap-3 text-emerald-400 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 animate-fade-in-up">
          <div className="loading-spinner h-6 w-6"></div>
          <span className="font-medium">⏳ Processando upload...</span>
        </div>
      )}
      
      {children}
    </div>
  );
} 