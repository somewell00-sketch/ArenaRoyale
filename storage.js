const KEY = "arena_save_v1";

export function saveToLocal(world){
  try { localStorage.setItem(KEY, JSON.stringify(world)); } catch(_e) { /* storage unavailable: play without saving */ }
}

export function loadFromLocal(){
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch(_e) { return null; }
  if(!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearLocal(){
  try { localStorage.removeItem(KEY); } catch(_e) {}
}

export function downloadJSON(world){
  const blob = new Blob([JSON.stringify(world, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `arena_save_day${world.meta.day}_seed${world.meta.seed}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function uploadJSON(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Falha ao ler arquivo"));
    fr.onload = () => {
      try { resolve(JSON.parse(fr.result)); }
      catch { reject(new Error("JSON inválido")); }
    };
    fr.readAsText(file);
  });
}
