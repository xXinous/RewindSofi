import React from "react";
import QRCode from "react-qr-code";

export default function SuccessPage({ id, onGoHome }) {
  const url = `${window.location.origin}/?id=${id}`;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-100">
      <div className="flex flex-col p-5 w-[35%] max-[1250px]:w-[40%] max-[1050px]:w-[45%] h-full h-[calc(100vh-40px)] bg-white rounded-lg shadow-lg items-center">
        <h2 className="text-2xl font-bold mb-4">Cápsula criada com sucesso!</h2>
        <p className="mb-2">Compartilhe este link com o destinatário:</p>
        <a href={url} className="text-blue-600 underline break-all mb-4">{url}</a>
        <div className="bg-white p-2 rounded mb-4">
          <QRCode value={url} size={180} />
        </div>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded" onClick={onGoHome}>
          Voltar para início
        </button>
      </div>
    </div>
  );
} 