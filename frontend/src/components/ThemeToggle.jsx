import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button"; // adjust path if needed

export function ThemeToggle() {
  // track whether component has mounted (to avoid SSR mismatches)
  const [mounted, setMounted] = useState(false);

  // local state to track current theme; default to "light"
  const [theme, setTheme] = useState("light");

  // On mount: 
  // 1) mark component as mounted 
  // 2) read stored theme from localStorage (if any)
  // 3) add/remove "dark" class on <html> accordingly
  useEffect(() => {
    setMounted(true);

    // read from localStorage (if previously saved); fallback to system preference
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    } else {
      // if no saved theme, check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Whenever `theme` state changes, reflect it on <html> and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  // Until mounted, render a placeholder button to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="opacity-0 pointer-events-none">
        <Sun className="w-4 h-4" />
      </Button>
    );
  }

  // Once mounted, render a toggle that switches theme between light and dark
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="hover:bg-primary/10 transition-colors duration-300"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </Button>
  );
}
