import { useEffect } from "react";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";

/**
 * Oculta la tab bar mientras `active` es true. Cuando cambia a false o el
 * componente se desmonta, vuelve a mostrarla. Util para pantallas inmersivas
 * (camara, lectura, etc).
 */
export function useHideTabBar(active: boolean): void {
  const { hide, show } = useTabBarVisibility();

  useEffect(() => {
    if (active) {
      hide();
      return () => show();
    }
    show();
  }, [active, hide, show]);
}
