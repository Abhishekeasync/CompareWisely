import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/services/auth.service";
import { getCommentsForAdmin } from "@/lib/services/admin.service";
import { PageHead } from "@/components/page-head";
import { AdminNav } from "@/components/admin/admin-nav";
import { CommentModerationList } from "@/components/admin/comment-moderation";

export const instant = false;

export default async function AdminCommentsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const comments = await getCommentsForAdmin();

  return (
    <>
      <PageHead
        current="Comment Moderation"
        eyebrow="Admin Portal"
        title="Reader Discussions &amp; Moderation Queue"
        lead="Review community submissions, verify CA/practitioner questions, and approve or reject comments."
      />
      <section className="section">
        <div className="container">
          <AdminNav current="comments" />
          <CommentModerationList initialComments={comments} />
        </div>
      </section>
    </>
  );
}
