import { useEffect, useRef } from "react";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";

export function useHideTabBar(active: boolean): void {
  const { hide, show } = useTabBarVisibility();
  const showRef = useRef(show);
  showRef.current = show;

  useEffect(() => {
    if (!active) return;
    hide();
    return () => {
      showRef.current();
    };
  // hide es estable (useCallback sin deps), active es el unico que importa
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
