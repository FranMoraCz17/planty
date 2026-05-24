import * as Location from "expo-location";

/**
 * Servicio de clima usando Open-Meteo (API gratuita, sin API key).
 * Documentacion: https://open-meteo.com/
 *
 * Si el usuario niega la ubicacion, hace fallback a San Jose, CR.
 */

export interface WeatherSnapshot {
  city: string | null;
  temperatureC: number;
  feelsLikeC: number;
  humidity: number; // 0-100
  precipitationMm: number;
  windKph: number;
  conditionCode: number; // codigo WMO
  conditionLabel: string;
  conditionEmoji: string;
  isFromFallback: boolean;
}

const DEFAULT_COORDS = { latitude: 9.9281, longitude: -84.0907 }; // San Jose, CR
const DEFAULT_CITY = "San Jose";

// WMO weather code mapping (https://open-meteo.com/en/docs)
const CONDITION_MAP: Record<number, { label: string; emoji: string }> = {
  0: { label: "Despejado", emoji: "☀️" },
  1: { label: "Mayormente despejado", emoji: "🌤️" },
  2: { label: "Parcialmente nublado", emoji: "⛅" },
  3: { label: "Nublado", emoji: "☁️" },
  45: { label: "Niebla", emoji: "🌫️" },
  48: { label: "Niebla escarchada", emoji: "🌫️" },
  51: { label: "Llovizna ligera", emoji: "🌦️" },
  53: { label: "Llovizna", emoji: "🌦️" },
  55: { label: "Llovizna intensa", emoji: "🌧️" },
  61: { label: "Lluvia ligera", emoji: "🌧️" },
  63: { label: "Lluvia", emoji: "🌧️" },
  65: { label: "Lluvia fuerte", emoji: "🌧️" },
  71: { label: "Nieve ligera", emoji: "🌨️" },
  73: { label: "Nieve", emoji: "🌨️" },
  75: { label: "Nieve fuerte", emoji: "❄️" },
  80: { label: "Chubascos", emoji: "🌦️" },
  81: { label: "Chubascos intensos", emoji: "🌧️" },
  82: { label: "Chubascos violentos", emoji: "⛈️" },
  95: { label: "Tormenta", emoji: "⛈️" },
  96: { label: "Tormenta con granizo", emoji: "⛈️" },
  99: { label: "Tormenta severa", emoji: "⛈️" },
};

function describeCondition(code: number): { label: string; emoji: string } {
  return CONDITION_MAP[code] ?? { label: "Sin datos", emoji: "🌡️" };
}

async function getCoordsOrFallback(): Promise<{
  latitude: number;
  longitude: number;
  isFallback: boolean;
}> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== "granted") {
        return { ...DEFAULT_COORDS, isFallback: true };
      }
    }
    const position = await Location.getLastKnownPositionAsync({});
    const fallbackPosition =
      position ?? (await Location.getCurrentPositionAsync({}));
    if (!fallbackPosition) return { ...DEFAULT_COORDS, isFallback: true };
    return {
      latitude: fallbackPosition.coords.latitude,
      longitude: fallbackPosition.coords.longitude,
      isFallback: false,
    };
  } catch {
    return { ...DEFAULT_COORDS, isFallback: true };
  }
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!results || results.length === 0) return null;
    const place = results[0];
    return (
      place.city ||
      place.subregion ||
      place.region ||
      place.country ||
      null
    );
  } catch {
    return null;
  }
}

const WeatherService = {
  async getCurrentWeather(): Promise<WeatherSnapshot> {
    const { latitude, longitude, isFallback } = await getCoordsOrFallback();

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
      `precipitation,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new Error("No se pudo consultar el clima.");
    }

    if (!response.ok) {
      throw new Error("El servicio de clima no respondio.");
    }

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        relative_humidity_2m?: number;
        precipitation?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };

    const current = data.current ?? {};
    const code = current.weather_code ?? 0;
    const { label, emoji } = describeCondition(code);

    const city = isFallback
      ? DEFAULT_CITY
      : (await reverseGeocode(latitude, longitude)) ?? null;

    return {
      city,
      temperatureC: Math.round(current.temperature_2m ?? 0),
      feelsLikeC: Math.round(current.apparent_temperature ?? 0),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      precipitationMm: Number(current.precipitation ?? 0),
      windKph: Math.round(current.wind_speed_10m ?? 0),
      conditionCode: code,
      conditionLabel: label,
      conditionEmoji: emoji,
      isFromFallback: isFallback,
    };
  },
};

export default WeatherService;
