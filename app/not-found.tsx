import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p>404 / PATH NOT FOUND</p>
      <h1>这条知识路径还不存在。</h1>
      <div className="recovery-actions">
        <Link className="button button-primary" href="/">返回首页 →</Link>
        <Link className="button button-secondary" href="/explore">搜索内容</Link>
      </div>
    </main>
  );
}
