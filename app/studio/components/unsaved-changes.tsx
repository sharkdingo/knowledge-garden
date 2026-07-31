"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "./confirmation-dialog";

type DirtyRegistration = (owner: symbol, dirty: boolean) => void;

const UnsavedChangesContext = createContext<DirtyRegistration | null>(null);

export function useStudioUnsavedChanges(dirty: boolean) {
  const register = useContext(UnsavedChangesContext);
  const owner = useMemo(() => Symbol("studio-editor"), []);

  useEffect(() => {
    if (!register) return;
    register(owner, dirty);
    return () => register(owner, false);
  }, [dirty, owner, register]);
}

export function StudioUnsavedChangesBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dirtyOwners = useRef(new Set<symbol>());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingHref, setPendingHref] = useState("");

  const register = useCallback<DirtyRegistration>((owner, dirty) => {
    if (dirty) dirtyOwners.current.add(owner);
    else dirtyOwners.current.delete(owner);
    setHasUnsavedChanges(dirtyOwners.current.size > 0);
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const preventLoss = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [hasUnsavedChanges]);

  function guardNavigation(event: ReactMouseEvent<HTMLDivElement>) {
    if (
      !hasUnsavedChanges
      || event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) {
      return;
    }

    const destination = new URL(anchor.href, window.location.href);
    const current = new URL(window.location.href);
    if (
      destination.origin === current.origin
      && destination.pathname === current.pathname
      && destination.search === current.search
    ) return;

    event.preventDefault();
    event.stopPropagation();
    setPendingHref(destination.href);
  }

  function continueNavigation() {
    if (!pendingHref) return;
    const destination = new URL(pendingHref);
    setPendingHref("");
    if (destination.origin === window.location.origin) {
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    } else {
      window.location.assign(destination.href);
    }
  }

  return (
    <UnsavedChangesContext.Provider value={register}>
      <div className="studio-root" onClickCapture={guardNavigation}>
        {children}
      </div>
      <ConfirmationDialog
        open={Boolean(pendingHref)}
        title="离开这个编辑页面？"
        description="当前还有未保存更改。继续离开会丢失这些内容。"
        confirmLabel="放弃更改并离开"
        busyLabel="正在离开…"
        busy={false}
        danger
        onCancel={() => setPendingHref("")}
        onConfirm={continueNavigation}
      />
    </UnsavedChangesContext.Provider>
  );
}
