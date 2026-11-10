"use client";

export function CookiePreferencesButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("rubenweb:cookie-preferences"))} className="text-left hover:text-[#ff9d8e] transition">Preferencias de cookies</button>;
}
