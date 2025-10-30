export type Mode = "frio" | "calor" | "ventilacion";

export interface DeviceStatus {
  connected: boolean;
  acOn: boolean;
  setpoint: number;
  mode: Mode;
}

export interface RealtimeStats {
  kwhNow: number;
  co2Now: number;
  maintenanceDue: boolean;
}

export type Horario = {
  id: string;
  dias: string[];
  hora: string;
  setpoint: number;
  modo: "Frío" | "Auto" | "Eco";
};

export type SimInput = { setpoint: number; horasDia: number; metros2: number };
export type SimResult = { ahorroPct: number; antesKwh: number; despuesKwh: number };

export type Scene = { id: string; nombre: string; setpoint: number; mode: Mode; acOn: boolean };
