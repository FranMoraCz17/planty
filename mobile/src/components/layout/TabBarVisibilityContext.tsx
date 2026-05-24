import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface TabBarVisibilityContextValue {
  hidden: boolean;
  hide: () => void;
  show: () => void;
}

const TabBarVisibilityContext = createContext<
  TabBarVisibilityContextValue | undefined
>(undefined);

export function TabBarVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  const hide = useCallback(() => setHidden(true), []);
  const show = useCallback(() => setHidden(false), []);

  const value = useMemo(
    () => ({ hidden, hide, show }),
    [hidden, hide, show],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility(): TabBarVisibilityContextValue {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) {
    throw new Error(
      "useTabBarVisibility must be used inside TabBarVisibilityProvider",
    );
  }
  return ctx;
}
