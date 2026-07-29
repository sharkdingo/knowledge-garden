import { contentServices } from "../../composition/content";
import { requireStudioUser } from "../studio-auth";
import { StudioShell } from "../studio-shell";
import { CategoryManager } from "./category-manager";

export const dynamic = "force-dynamic";

export default async function StudioCategoriesPage() {
  const user = await requireStudioUser("/studio/categories");
  const categories = await contentServices.studio.categories.list();
  return (
    <StudioShell active="categories" user={user}>
      <header className="studio-page-heading">
        <div>
          <p className="eyebrow">TAXONOMY / {categories.length} ITEMS</p>
          <h1>文章分类</h1>
          <p>分类是发布文章前的基础结构；删除前会检查是否仍被内容使用。</p>
        </div>
      </header>
      <CategoryManager initialCategories={categories} />
    </StudioShell>
  );
}
