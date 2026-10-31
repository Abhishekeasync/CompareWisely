import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/services/auth.service";
import { getAllCategories } from "@/lib/services/software.service";
import { ArticleEditorForm } from "@/components/admin/article-editor";

export const instant = false;

export default async function NewArticleAdminPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const categories = await getAllCategories();

  return (
    <ArticleEditorForm
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
