import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";

/**
 * Oculta la tab bar mientras `active` sea true Y la pantalla esté enfocada.
 *
 * Usa `useFocusEffect` (no `useEffect`) a propósito: en un Tab navigator las
 * pantallas NO se desmontan al cambiar de tab, así que un efecto con cleanup
 * basado solo en `active` se queda "pegado" y desincroniza la visibilidad.
 * Con el foco, el estado se recalcula cada vez que entras/sales de la pantalla:
 *  - al ganar foco con cámara abierta → hide()
 *  - al perder foco (cambiar de tab, cerrar) → show()
 *  - al cambiar `active` estando enfocada (foto tomada → resultado) → show()
 */
export function useHideTabBar(active: boolean): void {
  const { hide, show } = useTabBarVisibility();

  useFocusEffect(
    useCallback(() => {
      if (active) {
        hide();
      } else {
        show();
      }
      return () => {
        show();
      };
    }, [active, hide, show]),
  );
}
