export type DeviceKind = "ac" | "light" | "plug";

export type BaseDevice = {
  id: string;
  name: string;
  room: string;
  kind: DeviceKind;
  createdAt: string;
};

export type ACDevice = BaseDevice & {
  kind: "ac";
  acOn: boolean;
  mode: "frio" | "calor" | "ventilacion";
  setpoint: number;
};

export type LightDevice = BaseDevice & {
  kind: "light";
  on: boolean;
  brightness: number; // 0-100
  colorTemp: number;  // 2700-6500
};

export type PlugDevice = BaseDevice & {
  kind: "plug";
  on: boolean;
};

export type Device = ACDevice | LightDevice | PlugDevice;

/* ====== Hogar / miembros ====== */
export type HomeMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  invitedAt: string;
  accepted: boolean;
};

export type HomeProfile = {
  id: string;
  ownerId: number;
  homeName: string;
  rooms: string[];
  favorites?: string[]; // device ids
  members?: HomeMember[];
  createdAt: string;
  firstConfiguredAt?: string | null;
  theme?: "light" | "dark" | "system";
};

/* ====== Automatizaciones ====== */
export type TriggerType = "schedule" | "geofence" | "manual" | "sensor";
export type ActionType = "device.toggle" | "device.set" | "scene.apply" | "notify";

export type RuleTrigger =
  | { type: "schedule"; cron: string }               // ej "0 22 * * *"
  | { type: "geofence"; enter: boolean }             // enter=true al entrar, false al salir
  | { type: "sensor"; sensor: "presence" | "temp"; op: ">" | "<" | "="; value: number }
  | { type: "manual" };

export type RuleAction =
  | { type: "device.toggle"; deviceId: string; on?: boolean }
  | { type: "device.set"; deviceId: string; patch: Partial<ACDevice & LightDevice & PlugDevice> }
  | { type: "notify"; message: string };

export type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  when: RuleTrigger;
  then: RuleAction[];
  createdAt: string;
};

/* ====== Historial (energía / eventos) ====== */
export type EnergySample = { t: string; kwh: number }; // por día
export type DeviceEvent = { t: string; deviceId: string; message: string };
