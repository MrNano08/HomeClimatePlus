// src/store/storage.ts
export const USERS_KEY = "hc-users";
export const AUTH_KEY = "hc-auth";
export const HOME_KEY = "hc-home";
export const DEVICES_KEY = "hc-devices";              // 👈 clave ÚNICA para dispositivos
export const FIRST_LOGIN_KEY = "hc-first-login";

export const RULES_KEY = "hc-rules";
export const ENERGY_KEY = "hc-energy";     // [{t:YYYY-MM-DD, kwh:number}]
export const EVENTS_KEY = "hc-events";     // [{t, deviceId, message}]

export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function saveJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ===== Tipos mínimos para utilidades ===== */
export type DeviceKind = "ac" | "light" | "plug";
export type Device = {
  id: string;
  name: string;
  room: string;
  kind: DeviceKind;
  createdAt: string;
} & Record<string, any>;

export type Session = { id: number; name: string; email: string };
export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/* ===== Normalización / Migración de dispositivos ===== */
function normKind(v: any): DeviceKind {
  const k = String(v ?? "").toLowerCase().trim();
  if (["ac", "a/c", "aire", "aa", "air"].includes(k)) return "ac";
  if (["light", "luz", "bombillo", "lamp"].includes(k)) return "light";
  if (["plug", "enchufe", "tomacorriente"].includes(k)) return "plug";
  return "ac";
}
function normDevice(d: any): Device {
  return { ...d, kind: normKind(d?.kind) } as Device;
}

/** Carga desde DEVICES_KEY y migra posibles claves antiguas */
export function loadDevices(): Device[] {
  try {
    const raw =
      localStorage.getItem(DEVICES_KEY) ??           // oficial
      localStorage.getItem("hc_devices") ??          // legado underscore
      localStorage.getItem("devices") ??             // otro legado
      "[]";
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(normDevice);
  } catch {
    return [];
  }
}
/** Guarda dispositivos normalizados en la clave oficial */
export function saveDevices(list: Device[]) {
  const normalized = (list ?? []).map(normDevice);
  saveJSON(DEVICES_KEY, normalized);
}

/* ====== Simulación: energía diaria ====== */
function ymd(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
export function pushEnergySample(deltaKwh: number) {
  const list = loadJSON<{ t: string; kwh: number }[]>(ENERGY_KEY, []);
  const today = ymd();
  const idx = list.findIndex((s) => s.t === today);
  if (idx >= 0) list[idx].kwh = Math.max(0, +(list[idx].kwh + deltaKwh).toFixed(2));
  else list.push({ t: today, kwh: Math.max(0, +deltaKwh.toFixed(2)) });
  saveJSON(ENERGY_KEY, list);
}
export function listEnergy() {
  return loadJSON<{ t: string; kwh: number }[]>(ENERGY_KEY, []);
}
export function pushEvent(deviceId: string, message: string) {
  const list = loadJSON<{ t: string; deviceId: string; message: string }[]>(EVENTS_KEY, []);
  list.push({ t: new Date().toISOString(), deviceId, message });
  saveJSON(EVENTS_KEY, list.slice(-500)); // limit simple
}
