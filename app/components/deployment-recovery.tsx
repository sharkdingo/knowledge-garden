"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "knowledge-garden-deployment-reload";
const CHUNK_ERROR = /loading chunk|failed to fetch dynamically imported module|importing a module script failed/i;

function shouldRecover(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return CHUNK_ERROR.test(message);
}

export function DeploymentRecovery() {
  useEffect(() => {
    let recovering = false;

    function recover() {
      if (recovering) return;
      const previous = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
      if (Date.now() - previous < 60_000) return;
      recovering = true;
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));

      const notice = document.createElement("div");
      notice.className = "deployment-recovery";
      notice.setAttribute("role", "status");
      notice.textContent = "站点已更新，正在恢复当前页面…";
      document.body.appendChild(notice);
      window.setTimeout(() => window.location.reload(), 650);
    }

    function onError(event: ErrorEvent) {
      const target = event.target;
      if (
        target instanceof HTMLScriptElement &&
        target.src.startsWith(window.location.origin) &&
        target.src.includes("/assets/")
      ) {
        recover();
        return;
      }
      if (shouldRecover(event.error ?? event.message)) recover();
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      if (shouldRecover(event.reason)) recover();
    }

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
