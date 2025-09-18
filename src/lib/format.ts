export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID",{ style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);


export const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
export const load = <T>(k: string, fallback: T): T => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fallback; }
  catch { return fallback; }
};