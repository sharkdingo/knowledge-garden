"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type StudioNavigationItem = {
  id: string;
  href: string;
  label: string;
};

export function StudioNavigation({
  active,
  items,
}: {
  active: string;
  items: readonly StudioNavigationItem[];
}) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const current = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current || !navRef.current) return;
    const navBounds = navRef.current.getBoundingClientRect();
    const currentBounds = current.getBoundingClientRect();
    const outside = currentBounds.left < navBounds.left || currentBounds.right > navBounds.right;
    if (outside) current.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  return (
    <nav ref={navRef} aria-label="内容工作室导航">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={active === item.id ? "active" : undefined}
          aria-current={active === item.id ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
