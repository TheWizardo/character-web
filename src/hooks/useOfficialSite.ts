import { useEffect } from "react";

const OFFICIAL_ORIGIN = "https://character-loom.com";

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export function useOfficialSite(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const { origin, hostname, pathname, search, hash } = window.location;

    if (isLocalhost(hostname)) return;
    if (origin === OFFICIAL_ORIGIN) return;

    window.location.replace(`${OFFICIAL_ORIGIN}${pathname}${search}${hash}`);
  }, []);
}