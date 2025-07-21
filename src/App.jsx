import React, { useState, useEffect } from "react";
import { auth, signInAnonymously, db, storage } from "./firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import HomePage from "./components/HomePage";
import MemoryForm from "./components/MemoryForm";
import SuccessPage from "./components/SuccessPage";
import CountdownPage from "./components/CountdownPage";
import MemoryPage from "./components/MemoryPage";
import { ALLOWED_CREATOR_UIDS } from "./allowedCreators";

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

export default function App() {
  const [page, setPage] = useState("home");
  const [currentId, setCurrentId] = useState(null);
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    signInAnonymously(auth).then(() => {
      setAuthChecked(true);
      if (ALLOWED_CREATOR_UIDS.includes(auth.currentUser.uid)) {
        setCanCreate(true);
      }
    });
  }, []);

  useEffect(() => {
    const id = getIdFromUrl();
    if (id) {
      setLoading(true);
      getDoc(doc(db, "memories", id)).then(docSnap => {
        if (docSnap.exists()) {
          setMemory(docSnap.data());
          setCurrentId(id);
          const now = new Date();
          const openDate = new Date(docSnap.data().openDate);
          if (now < openDate) setPage("countdown");
          else setPage("memory");
        } else {
          setMemory(null);
          setPage("home");
        }
        setLoading(false);
      });
    } else {
      setPage("home");
    }
  }, [window.location.search]);

  async function handleCreateMemory(data) {
    setLoading(true);
    // Upload das fotos
    const photoUrls = [];
    for (const file of data.photos) {
      const storageRef = ref(storage, `memories/${file.name}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      photoUrls.push(url);
    }
    // Upload vídeo secreto se existir
    let secretVideoUrl = null;
    if (data.secretLove?.enabled && data.secretLove.video) {
      const file = data.secretLove.video;
      const storageRef = ref(storage, `secretLove/${file.name}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      secretVideoUrl = await getDownloadURL(storageRef);
    }
    // Salvar no Firestore
    const docRef = await addDoc(collection(db, "memories"), {
      ...data,
      photos: photoUrls,
      createdAt: new Date().toISOString(),
      openDate: data.openDate,
      creatorId: auth.currentUser.uid,
      secretLove: data.secretLove?.enabled ? {
        enabled: true,
        passwordHash: data.secretLove.passwordHash,
        text: data.secretLove.text,
        videoUrl: secretVideoUrl
      } : { enabled: false }
    });
    setCurrentId(docRef.id);
    setMemory({ ...data, photos: photoUrls, createdAt: new Date().toISOString(), openDate: data.openDate, secretLove: data.secretLove?.enabled ? {
      enabled: true,
      passwordHash: data.secretLove.passwordHash,
      text: data.secretLove.text,
      videoUrl: secretVideoUrl
    } : { enabled: false } });
    setPage("success");
    window.history.replaceState({}, "", `?id=${docRef.id}`);
    setLoading(false);
  }

  function handleGoHome() {
    setPage("home");
    setCurrentId(null);
    setMemory(null);
    window.history.replaceState({}, "", "/");
  }

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center text-xl">Verificando acesso...</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Carregando...</div>;
  if (page === "home") return <HomePage onStart={() => canCreate ? setPage("form") : null} canCreate={canCreate} />;
  if (page === "form") {
    if (!canCreate) return <div className="min-h-screen flex items-center justify-center text-xl">Acesso restrito.</div>;
    return <MemoryForm onCreate={handleCreateMemory} onCancel={handleGoHome} />;
  }
  if (page === "success") return <SuccessPage id={currentId} onGoHome={handleGoHome} />;
  if (page === "countdown") return <CountdownPage memory={memory} onGoHome={handleGoHome} />;
  if (page === "memory") return <MemoryPage memory={memory} onGoHome={handleGoHome} />;
  return null;
} 