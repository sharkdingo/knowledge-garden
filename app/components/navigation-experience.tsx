"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function NavigationExperience() {
  const pathname = usePathname();
  const liveRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let fallback = 0;
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const next = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (
        next.origin !== current.origin ||
        (next.pathname === current.pathname && next.search === current.search)
      ) return;
      document.documentElement.classList.add("route-pending");
      window.clearTimeout(fallback);
      fallback = window.setTimeout(
        () => document.documentElement.classList.remove("route-pending"),
        1800,
      );
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.documentElement.classList.remove("route-pending");
      document.documentElement.classList.add("route-arrived");
      if (liveRef.current) liveRef.current.textContent = `已进入 ${document.title}`;
    });
    const timer = window.setTimeout(
      () => document.documentElement.classList.remove("route-arrived"),
      520,
    );
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <>
      <span className="route-progress" aria-hidden="true" />
      <span ref={liveRef} className="sr-only" aria-live="polite" />
    </>
  );
}
