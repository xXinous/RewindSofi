import React, { useEffect, useState } from "react";

function getTimeLeft(openDate) {
  const now = new Date();
  const target = new Date(openDate);
  const diff = target - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function CountdownPage({ memory, onGoHome }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(memory.openDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(memory.openDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [memory.openDate]);

  if (!timeLeft) {
    window.location.reload(); // força atualização para mostrar a memória
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-100">
      <div className="flex flex-col p-5 w-[35%] max-[1250px]:w-[40%] max-[1050px]:w-[45%] h-full h-[calc(100vh-40px)] bg-white rounded-lg shadow-lg items-center">
        <h2 className="text-2xl font-bold mb-4">Ainda não chegou a hora!</h2>
        <p className="mb-2">A cápsula será aberta em:</p>
        <div className="text-3xl font-mono mb-4">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </div>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded" onClick={onGoHome}>
          Voltar para início
        </button>
      </div>
    </div>
  );
} 