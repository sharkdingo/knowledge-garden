"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function OverlayLayer({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function useOverlayEnvironment({
  active,
  bodyClass,
  isolate,
}: {
  active: boolean;
  bodyClass: string;
  isolate?: string;
}) {
  useEffect(() => {
    if (!active) return;
    const body = document.body;
    const isolated = isolate ? document.querySelector<HTMLElement>(isolate) : null;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
      ariaHidden: isolated?.getAttribute("aria-hidden"),
      inert: isolated?.inert ?? false,
    };

    body.classList.add(bodyClass);
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll";
    if (isolated) {
      isolated.inert = true;
      isolated.setAttribute("aria-hidden", "true");
    }

    return () => {
      body.classList.remove(bodyClass);
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflowY = previous.overflowY;
      if (isolated) {
        isolated.inert = previous.inert;
        if (previous.ariaHidden == null) isolated.removeAttribute("aria-hidden");
        else isolated.setAttribute("aria-hidden", previous.ariaHidden);
      }
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    };
  }, [active, bodyClass, isolate]);
}
