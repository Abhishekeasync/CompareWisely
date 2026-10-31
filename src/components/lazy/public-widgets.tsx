import dynamic from "next/dynamic";

export const Quiz = dynamic(
  () => import("@/components/quiz").then((m) => ({ default: m.Quiz })),
  {
    loading: () => (
      <div className="panel card--pad" style={{ padding: "32px" }} aria-busy="true">
        <p className="muted">Loading questionnaire…</p>
      </div>
    ),
  },
);

export const CompareWorkspace = dynamic(
  () => import("@/components/compare/compare-workspace").then((m) => ({ default: m.CompareWorkspace })),
  {
    loading: () => <p className="container section muted">Loading comparison tool…</p>,
  },
);

export const NewsletterSignup = dynamic(
  () => import("@/components/content/newsletter-signup").then((m) => ({ default: m.NewsletterSignup })),
  { loading: () => null },
);

export const CommentForm = dynamic(
  () => import("@/components/content/comment-form").then((m) => ({ default: m.CommentForm })),
  {
    loading: () => <p className="tiny muted">Loading comment form…</p>,
  },
);
