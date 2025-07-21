import React from "react";

export default function HomePage({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 to-purple-200">
      <h1 className="text-4xl font-bold mb-4">Cápsula do Tempo Digital</h1>
      <p className="mb-8 text-lg max-w-xl text-center">
        Crie uma cápsula do tempo digital personalizada para alguém especial. Adicione fotos, mensagem, música e defina uma data para ser aberta no futuro!
      </p>
      <button
        className="px-8 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition"
        onClick={onStart}
      >
        Criar minha cápsula
      </button>
    </div>
  );
} 