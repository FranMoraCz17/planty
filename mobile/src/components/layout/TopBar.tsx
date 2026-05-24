import { useState } from "react";
import AccountSheet from "./AccountSheet";
import AppHeader from "./AppHeader";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

/**
 * Header global + bottom sheet de cuenta.
 * Coloca <TopBar /> al inicio de cualquier pantalla autenticada.
 */
export default function TopBar({ title, subtitle }: TopBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <AppHeader
        title={title}
        subtitle={subtitle}
        onAvatarPress={() => setSheetOpen(true)}
      />
      <AccountSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
