import { useCallback, useMemo } from "react";

const OFFICIAL_ORIGIN = "https://character-loom.com";

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export function useOfficialSite(): { isValid: boolean; isLocal:boolean; redirect: () => void } {
  const isLocal = useMemo(() => {
    return isLocalhost(window.location.hostname);
  }, []);

  const isValid = useMemo(() => {
    if (typeof window === "undefined") return true;

    const { origin, hostname } = window.location;

    if (isLocalhost(hostname)) return true;
    if (origin === OFFICIAL_ORIGIN) return true;

    return false;
  }, []);

  const redirect = useCallback(() => {
    if (typeof window === "undefined") return;

    const { pathname, search, hash } = window.location;
    window.location.replace(`${OFFICIAL_ORIGIN}${pathname}${search}${hash}`);
  }, []);

  return { isValid, isLocal, redirect };
}