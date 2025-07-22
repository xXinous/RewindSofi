import React from 'react';

export default function UploadStatus({ error, uploadError, loading, children }) {
  return (
    <div className="mb-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-2">{error}</div>}
      {uploadError && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-2">{uploadError}</div>}
      {loading && (
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></span>
          <span>Processando...</span>
        </div>
      )}
      {children}
    </div>
  );
} 