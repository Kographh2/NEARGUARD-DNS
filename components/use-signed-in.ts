"use client";

import { useSyncExternalStore } from "react";

export const AUTH_CHANGE_EVENT = "nearguard:auth-change";

function hasSessionCookie(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie.split(";").some((part) => {
    const name = part.trim().split("=")[0] ?? "";
    return /^sb-.+-auth-token(?:\.\d+)?$/.test(name);
  });
}

function subscribe(onChange: () => void): () => void {
  const onVisibilityChange = () => {
    if (!document.hidden) {
      onChange();
    }
  };
  const timer = window.setInterval(onChange, 60_000);

  window.addEventListener("focus", onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

export function useSignedIn(): boolean {
  return useSyncExternalStore(subscribe, hasSessionCookie, () => false);
}
