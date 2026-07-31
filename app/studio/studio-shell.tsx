import Link from "next/link";
import type { ChatGPTUser } from "../chatgpt-auth";
import { chatGPTSignOutPath } from "../chatgpt-auth";
import { StudioNavigation } from "./studio-navigation";
import { StudioUnsavedChangesBoundary } from "./components/unsaved-changes";

const navigation = [
  { id: "overview", href: "/studio", label: "概览" },
  { id: "articles", href: "/studio/articles", label: "文章" },
  { id: "categories", href: "/studio/categories", label: "分类" },
  { id: "algorithms", href: "/studio/problems", label: "题库" },
  { id: "projects", href: "/studio/projects", label: "项目" },
  { id: "site", href: "/studio/site", label: "站点" },
  { id: "backup", href: "/studio/backup", label: "备份" },
];

export function StudioShell({
  active,
  user,
  children,
}: {
  active: "overview" | "articles" | "categories" | "algorithms" | "projects" | "site" | "backup";
  user: ChatGPTUser;
  children: React.ReactNode;
}) {
  return (
    <StudioUnsavedChangesBoundary>
      <a className="skip-link" href="#studio-content">跳到管理内容</a>
      <header className="studio-header">
        <div className="studio-header-inner">
          <Link className="studio-brand" href="/studio">
            <span aria-hidden="true">✦</span>
            内容工作室
          </Link>
          <StudioNavigation active={active} items={navigation} />
          <div className="studio-account">
            <span title={user.email}>{user.displayName}</span>
            <Link href="/">查看网站</Link>
            <Link href={chatGPTSignOutPath("/")}>退出</Link>
          </div>
          <div className="studio-mobile-actions" aria-label="账户操作">
            <Link href="/studio/backup">备份</Link>
            <Link href="/">查看网站</Link>
            <Link href={chatGPTSignOutPath("/")}>退出</Link>
          </div>
        </div>
      </header>
      <main id="studio-content" className="studio-main">{children}</main>
    </StudioUnsavedChangesBoundary>
  );
}
