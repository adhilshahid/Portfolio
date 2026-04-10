"use client";

import React, { useState } from "react";
import { ThemeSwitcher } from "@/components/ui/apple-liquid-glass-switcher";

type Theme = "light" | "dark" | "dim";

export default function Demo() {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <div className="theme-provider" data-theme={theme}>
      <ThemeSwitcher value={theme} onValueChange={setTheme} />
    </div>
  );
}
