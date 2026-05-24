import { useEffect, useState } from "react";
import MoonPhaseService, {
  type MoonPhase,
} from "@/src/services/moonPhaseService";
import WeatherService, {
  type WeatherSnapshot,
} from "@/src/services/weatherService";

interface UseTodayContextReturn {
  moon: MoonPhase;
  weather: WeatherSnapshot | null;
  isLoadingWeather: boolean;
  weatherError: string | null;
  reload: () => void;
}

/**
 * Provee contexto del dia para el home: fase lunar (offline) + clima local
 * (Open-Meteo con expo-location). La luna es siempre confiable; el clima
 * puede fallar y se reporta con weatherError sin romper el render.
 */
export function useTodayContext(): UseTodayContextReturn {
  const [moon, setMoon] = useState<MoonPhase>(() =>
    MoonPhaseService.getMoonPhase(),
  );
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setMoon(MoonPhaseService.getMoonPhase());
    setIsLoadingWeather(true);
    setWeatherError(null);

    void (async () => {
      try {
        const snapshot = await WeatherService.getCurrentWeather();
        if (cancelled) return;
        setWeather(snapshot);
      } catch (err) {
        if (cancelled) return;
        setWeatherError(
          err instanceof Error ? err.message : "No se pudo obtener el clima.",
        );
      } finally {
        if (!cancelled) setIsLoadingWeather(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const reload = () => setReloadTick((t) => t + 1);

  return { moon, weather, isLoadingWeather, weatherError, reload };
}
