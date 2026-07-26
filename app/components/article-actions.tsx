"use client";

import { useState } from "react";

export function ArticleActions({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        setMessage("分享面板已打开。");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setMessage("链接已复制。");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("暂时无法分享，请从浏览器地址栏复制链接。");
    }
  }

  return (
    <div className="article-actions">
      <button type="button" onClick={share}>
        <span aria-hidden="true">↗</span> 分享这篇文章
      </button>
      <p role="status" aria-live="polite">{message}</p>
    </div>
  );
}
