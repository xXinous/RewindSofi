import React, { useState } from "react";

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function MemoryForm({ onCreate, onCancel }) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState([]);
  const [musicUrl, setMusicUrl] = useState("");
  const [openDate, setOpenDate] = useState("");
  // Secret Love
  const [hasSecret, setHasSecret] = useState(false);
  const [secretPassword, setSecretPassword] = useState("");
  const [secretText, setSecretText] = useState("");
  const [secretVideo, setSecretVideo] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoChange(e) {
    setPhotos(Array.from(e.target.files));
  }
  function handleSecretVideo(e) {
    setSecretVideo(e.target.files[0] || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    let secretLove = { enabled: false };
    if (hasSecret) {
      if (!secretPassword || !secretText || !secretVideo) {
        setError("Preencha todos os campos da área secreta.");
        setSubmitting(false);
        return;
      }
      const passwordHash = await hashPassword(secretPassword);
      secretLove = {
        enabled: true,
        passwordHash,
        text: secretText,
        video: secretVideo
      };
    }
    onCreate({ title, message, photos, musicUrl, openDate, secretLove });
  }

  const steps = [
    (
      <div key="step1">
        <label className="block mb-2 font-semibold">Título</label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
    ),
    (
      <div key="step2">
        <label className="block mb-2 font-semibold">Mensagem</label>
        <textarea className="input" value={message} onChange={e => setMessage(e.target.value)} required />
      </div>
    ),
    (
      <div key="step3">
        <label className="block mb-2 font-semibold">Fotos (opcional, múltiplas)</label>
        <input type="file" multiple accept="image/*" onChange={handlePhotoChange} />
        <div className="flex gap-2 mt-2">
          {photos.map((file, i) => (
            <img key={i} src={URL.createObjectURL(file)} alt="preview" className="w-16 h-16 object-cover rounded" />
          ))}
        </div>
      </div>
    ),
    (
      <div key="step4">
        <label className="block mb-2 font-semibold">Link de música (Spotify/YouTube, opcional)</label>
        <input className="input" value={musicUrl} onChange={e => setMusicUrl(e.target.value)} placeholder="https://..." />
      </div>
    ),
    (
      <div key="step5">
        <label className="block mb-2 font-semibold">Data e hora de abertura</label>
        <input className="input" type="datetime-local" value={openDate} onChange={e => setOpenDate(e.target.value)} required />
      </div>
    ),
    (
      <div key="step6">
        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={hasSecret} onChange={e => setHasSecret(e.target.checked)} />
          Adicionar área secreta (Secret Love)
        </label>
        {hasSecret && (
          <div className="space-y-3 mt-2">
            <input type="password" className="input" placeholder="Senha da área secreta" value={secretPassword} onChange={e => setSecretPassword(e.target.value)} />
            <textarea className="input" placeholder="Texto secreto" value={secretText} onChange={e => setSecretText(e.target.value)} />
            <input type="file" accept="video/*" onChange={handleSecretVideo} />
            {secretVideo && <video src={URL.createObjectURL(secretVideo)} controls className="w-32 mt-2 rounded" />}
          </div>
        )}
      </div>
    )
  ];

  return (
    <form
      className="min-h-screen flex flex-col items-center justify-center bg-white/80 p-8"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col p-5 w-[35%] max-[1250px]:w-[40%] max-[1050px]:w-[45%] h-full h-[calc(100vh-40px)] bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Criar Cápsula do Tempo</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-2">{error}</div>}
        {steps[step]}
        <div className="flex justify-between mt-6">
          <button type="button" className="text-gray-500" onClick={onCancel}>Cancelar</button>
          <div>
            {step > 0 && (
              <button type="button" className="mr-2 px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(step - 1)}>
                Voltar
              </button>
            )}
            {step < steps.length - 1 ? (
              <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(step + 1)}>
                Avançar
              </button>
            ) : (
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={submitting}>{submitting ? "Enviando..." : "Criar Memória"}</button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
} 