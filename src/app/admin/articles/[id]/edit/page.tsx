import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/services/auth.service";
import { getAllCategories } from "@/lib/services/software.service";
import { getArticleForAdminById } from "@/lib/services/content.service";
import { ArticleEditorForm } from "@/components/admin/article-editor";

export const instant = false;

interface EditArticleAdminPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticleAdminPage({ params }: EditArticleAdminPageProps) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (Number.isNaN(id)) {
    notFound();
  }

  const [article, categories] = await Promise.all([
    getArticleForAdminById(id),
    getAllCategories(),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <ArticleEditorForm
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      article={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        articleType: article.articleType,
        excerpt: article.excerpt,
        content: article.content,
        featuredImageUrl: article.featuredImageUrl,
        imageUrls: article.imageUrls,
        videoUrl: article.videoUrl,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        canonicalUrl: article.canonicalUrl,
        categoryId: article.categoryId,
        isPublished: article.isPublished,
        tags: article.tags,
      }}
    />
  );
}
