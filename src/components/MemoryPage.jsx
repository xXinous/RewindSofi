import React, { useState } from "react";

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function MemoryPage({ memory, onGoHome }) {
  const [showSecret, setShowSecret] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [secretError, setSecretError] = useState("");
  const [secretLoading, setSecretLoading] = useState(false);

  async function handleSecretSubmit(e) {
    e.preventDefault();
    setSecretLoading(true);
    setSecretError("");
    const hash = await hashPassword(secretInput);
    if (hash === memory.secretLove.passwordHash) {
      setShowSecret(true);
    } else {
      setSecretError("Senha incorreta!");
    }
    setSecretLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <div className="flex flex-col p-5 w-[35%] max-[1250px]:w-[40%] max-[1050px]:w-[45%] h-full h-[calc(100vh-40px)] bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-2">{memory.title}</h2>
        <p className="mb-4 text-gray-700 whitespace-pre-line">{memory.message}</p>
        {memory.photos && memory.photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {memory.photos.map((url, i) => (
              <img key={i} src={url} alt="foto" className="w-32 h-32 object-cover rounded" />
            ))}
          </div>
        )}
        {memory.musicUrl && (
          <div className="mb-4">
            <p className="font-semibold">Música:</p>
            <a href={memory.musicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
              {memory.musicUrl}
            </a>
          </div>
        )}
        <div className="text-sm text-gray-400 mb-2">Criada em: {new Date(memory.createdAt).toLocaleString()}</div>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded" onClick={onGoHome}>
          Voltar para início
        </button>
        {/* Área secreta opcional */}
        {memory.secretLove?.enabled && (
          <div className="mt-8 p-4 rounded-lg bg-pink-50 border border-pink-200">
            <h3 className="text-xl font-bold text-pink-700 mb-2">Área Secreta</h3>
            {!showSecret ? (
              <form onSubmit={handleSecretSubmit} className="flex flex-col gap-2">
                <input type="password" className="input" placeholder="Senha da área secreta" value={secretInput} onChange={e => setSecretInput(e.target.value)} />
                {secretError && <div className="text-red-600 text-sm">{secretError}</div>}
                <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded" disabled={secretLoading}>{secretLoading ? "Verificando..." : "Acessar área secreta"}</button>
              </form>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                {memory.secretLove.videoUrl && (
                  <video src={memory.secretLove.videoUrl} controls className="w-full rounded" />
                )}
                <div className="bg-pink-100 p-4 rounded text-pink-900 whitespace-pre-line text-lg font-semibold">
                  {memory.secretLove.text}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 