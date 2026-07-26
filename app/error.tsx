"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="not-found">
      <p>ERROR / RECOVERABLE</p>
      <h1>这条路径暂时出了问题。</h1>
      <div className="recovery-actions">
        <button className="button button-primary" type="button" onClick={reset}>重新尝试 →</button>
        <Link className="button button-secondary" href="/">返回首页</Link>
      </div>
    </main>
  );
}
