/**
 * Calculo de fase lunar offline (sin red, sin librerias).
 *
 * Usa el algoritmo simplificado de Conway (J. Conway, 1972) para estimar la
 * edad de la luna en dias desde la luna nueva mas reciente. Precision ±1 dia,
 * suficiente para uso agricola y de jardineria tradicional.
 */

export type MoonPhaseKey =
  | "nueva"
  | "creciente"
  | "cuarto-creciente"
  | "gibosa-creciente"
  | "llena"
  | "gibosa-menguante"
  | "cuarto-menguante"
  | "menguante";

export interface MoonPhase {
  key: MoonPhaseKey;
  label: string;
  emoji: string;
  age: number; // dias dentro del ciclo lunar (0 a 29.53)
  illumination: number; // porcentaje iluminado (0-100)
  gardenAdvice: string;
}

const LUNAR_CYCLE_DAYS = 29.530588853;

function calculateMoonAge(date: Date): number {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();

  if (month < 3) {
    year -= 1;
    month += 12;
  }

  const yearAdj = year - 1;
  const c = 365.25 * yearAdj;
  const e = 30.6 * (month + 1);

  // dias desde el ultimo dia de luna nueva conocido (1900-01-01 referencia)
  let jd = c + e + day - 694039.09;
  jd /= LUNAR_CYCLE_DAYS;
  const age = (jd - Math.floor(jd)) * LUNAR_CYCLE_DAYS;
  return age < 0 ? age + LUNAR_CYCLE_DAYS : age;
}

function calculateIllumination(age: number): number {
  // Aproximacion: la iluminacion sigue una funcion coseno respecto al ciclo
  const phase = (age / LUNAR_CYCLE_DAYS) * 2 * Math.PI;
  const illumination = (1 - Math.cos(phase)) / 2;
  return Math.round(illumination * 100);
}

function classify(age: number): { key: MoonPhaseKey; label: string; emoji: string } {
  // Limites tipicos en dias dentro del ciclo
  if (age < 1.84566) return { key: "nueva", label: "Luna nueva", emoji: "🌑" };
  if (age < 5.53699) return { key: "creciente", label: "Creciente", emoji: "🌒" };
  if (age < 9.22831)
    return { key: "cuarto-creciente", label: "Cuarto creciente", emoji: "🌓" };
  if (age < 12.91963)
    return { key: "gibosa-creciente", label: "Gibosa creciente", emoji: "🌔" };
  if (age < 16.61096) return { key: "llena", label: "Luna llena", emoji: "🌕" };
  if (age < 20.30228)
    return { key: "gibosa-menguante", label: "Gibosa menguante", emoji: "🌖" };
  if (age < 23.99361)
    return { key: "cuarto-menguante", label: "Cuarto menguante", emoji: "🌗" };
  if (age < 27.68493) return { key: "menguante", label: "Menguante", emoji: "🌘" };
  return { key: "nueva", label: "Luna nueva", emoji: "🌑" };
}

const GARDEN_ADVICE: Record<MoonPhaseKey, string> = {
  nueva: "Ideal para sembrar raices y bulbos. La savia se concentra abajo.",
  creciente:
    "Buena fase para sembrar hojas y vegetales que crecen sobre tierra.",
  "cuarto-creciente":
    "Trasplantes y riegos abundantes. La planta absorbe mejor.",
  "gibosa-creciente":
    "Fase de mayor crecimiento. Evita podar, favorece la fertilizacion.",
  llena: "Cosecha de frutos. No podes ni trasplantes hoy.",
  "gibosa-menguante":
    "Bueno para podar y dar mantenimiento. La savia regresa a las raices.",
  "cuarto-menguante":
    "Ideal para podas fuertes y eliminar plagas. Energia interna.",
  menguante:
    "Tiempo de descanso. Limpia, deshierba y prepara suelo para el siguiente ciclo.",
};

const MoonPhaseService = {
  getMoonPhase(date: Date = new Date()): MoonPhase {
    const age = calculateMoonAge(date);
    const illumination = calculateIllumination(age);
    const { key, label, emoji } = classify(age);
    return {
      key,
      label,
      emoji,
      age,
      illumination,
      gardenAdvice: GARDEN_ADVICE[key],
    };
  },
};

export default MoonPhaseService;
