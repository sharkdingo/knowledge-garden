"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NavigationItem, SiteProfile } from "../domain/content";
import { SearchPalette } from "./search-palette";
import { ThemeToggle } from "./theme-toggle";
import { OverlayLayer, useOverlayEnvironment } from "./overlay-layer";

export function SiteHeader({
  active,
  identity,
  navigation,
}: {
  active: string;
  identity: SiteProfile["identity"];
  navigation: NavigationItem[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  useOverlayEnvironment({ active: menuOpen, bodyClass: "menu-open" });
  const closeMenuForSearch = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    navRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key === "Tab" && navRef.current) {
        const links = [...navRef.current.querySelectorAll<HTMLAnchorElement>("a")];
        const focusable = [menuButtonRef.current, ...links].filter(
          (element): element is HTMLButtonElement | HTMLAnchorElement => element !== null,
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    const desktop = window.matchMedia("(min-width: 761px)");
    const onBreakpointChange = () => {
      if (desktop.matches) setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onBreakpointChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onBreakpointChange);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="site-header">
      <div className="header-inner">
        <Link
          className="brand"
          href="/"
          aria-label={`${identity.name}主页`}
          data-easter-brand
        >
          {identity.shortName} <span>/ {identity.latinName}</span>
        </Link>

        <button
          ref={menuButtonRef}
          className={menuOpen ? "menu-toggle is-open" : "menu-toggle"}
          type="button"
          aria-label={menuOpen ? "关闭导航" : "打开导航"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
        </button>

        <nav
          ref={navRef}
          id="primary-navigation"
          className={menuOpen ? "primary-nav is-open" : "primary-nav"}
          aria-label="主导航"
        >
          {navigation.map((link) => (
            <Link
              href={link.href}
              key={link.id}
              className={active === link.id ? "active" : undefined}
              aria-current={active === link.id ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <SearchPalette onOpen={closeMenuForSearch} />
          <ThemeToggle />
        </div>
      </div>
      {menuOpen && <OverlayLayer>
        <button
          className="menu-backdrop"
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setMenuOpen(false)}
        />
      </OverlayLayer>}
    </header>
  );
}
