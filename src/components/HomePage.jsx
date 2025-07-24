import React from "react";

export default function HomePage({ onNavigate, canCreate }) {
  return (
    <div className="text-center p-8 max-w-2xl mx-auto bg-slate-900 text-white h-screen flex flex-col justify-center">
      <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">Cápsula do Tempo</h1>
      <p className="mb-8 text-lg text-slate-300">Crie uma mensagem para o futuro, aprimorada com um toque de magia da IA.</p>
      {canCreate ? (
        <button onClick={() => onNavigate('form')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform transform hover:scale-105">
          Criar Cápsula Agora
        </button>
      ) : (
        <p className="text-slate-400">Apenas criadores autorizados podem criar cápsulas.</p>
      )}
    </div>
  );
} 