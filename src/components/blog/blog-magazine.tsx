import Link from "next/link";
import { blogHref, blogPageNumbers } from "@/lib/blog-index";
import { ArticleCover } from "@/components/blog/article-cover";

export type BlogCardModel = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  authorName: string;
  initials: string;
  dateLabel: string | null;
  dateTime: string | null;
  readingLabel: string | null;
  imageUrl: string | null;
};

function plateLabel(article: BlogCardModel): string {
  if (article.category) return article.category;
  const words = article.title.split(/\s+/).filter((word) => !/^(how|the|a|an|why|what)$/i.test(word));
  return words.slice(0, 2).join(" ") || article.title;
}

function ArticleMeta({
  article,
  tone = "default",
  showDate = false,
}: {
  article: BlogCardModel;
  tone?: "default" | "on-cover";
  showDate?: boolean;
}) {
  return (
    <div className={`blog-meta${tone === "on-cover" ? " blog-meta--on-cover" : ""}`}>
      <span className="blog-avatar" aria-hidden="true">
        {article.initials}
      </span>
      <span>{article.authorName}</span>
      {showDate && article.dateLabel ? (
        <time dateTime={article.dateTime ?? undefined}>{article.dateLabel}</time>
      ) : null}
    </div>
  );
}

export function IssueCluster({ cover }: { cover: BlogCardModel }) {
  const titleId = `feature-title-${cover.id}`;
  const summary = proseExcerpt(cover.excerpt);

  return (
    <section className="blog-bento" aria-label="Cover story">
      <Link href={`/blog/${cover.slug}`} className="blog-bento__cover" aria-labelledby={titleId}>
        <ArticleCover
          src={cover.imageUrl}
          alt={cover.title}
          bare
          priority
          sizes="(min-width: 768px) 1120px, 100vw"
          variant="feature"
        />
        <div className="blog-bento__overlay">
          <span className="blog-bento__mark">Cover story</span>
          <h2 id={titleId}>{cover.title}</h2>
          {summary ? <p>{summary}</p> : null}
          <ArticleMeta article={cover} tone="on-cover" showDate />
        </div>
      </Link>
    </section>
  );
}

function proseExcerpt(excerpt: string): string | null {
  const text = excerpt.trim();
  const commas = text.split(",").length - 1;
  if (commas >= 3 && !/[.!?]/.test(text)) return null;
  return text;
}

export function ArticleCard({ article }: { article: BlogCardModel }) {
  const href = `/blog/${article.slug}`;
  const titleId = `article-title-${article.id}`;

  return (
    <article className="blog-card-wrap">
      <Link href={href} className="blog-card" aria-labelledby={titleId}>
        <ArticleCover
          src={article.imageUrl}
          alt={article.title}
          label={plateLabel(article)}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="blog-card__body">
          {article.dateLabel ? (
            <time className="blog-card__date" dateTime={article.dateTime ?? undefined}>
              {article.dateLabel}
            </time>
          ) : null}
          <h3 id={titleId}>{article.title}</h3>
          <p className="blog-excerpt">{article.excerpt}</p>
          <div className="blog-card__foot">
            <ArticleMeta article={article} />
          </div>
        </div>
      </Link>
    </article>
  );
}

export function BlogPagination({
  page,
  totalPages,
  search,
  category,
  basePath,
}: {
  page: number;
  totalPages: number;
  search: string;
  category?: string;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  const numbers = blogPageNumbers(page, totalPages);
  const shared = { search, category, base: basePath };

  return (
    <nav className="blog-pager" aria-label="Pagination">
      {page > 1 ? (
        <Link href={blogHref({ ...shared, page: page - 1, hash: true })} rel="prev">
          Previous
        </Link>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}
      {numbers.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="blog-pager__gap" aria-hidden="true">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page">
            {item}
          </span>
        ) : (
          <Link key={item} href={blogHref({ ...shared, page: item, hash: true })}>
            {item}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link href={blogHref({ ...shared, page: page + 1, hash: true })} rel="next">
          Next
        </Link>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  );
}

/** The latest article is the only cover. Every other article stays in the archive grid. */
export function splitIssue(cards: BlogCardModel[], featured: boolean) {
  if (!featured || cards.length === 0) {
    return { cover: undefined, archive: cards };
  }

  return {
    cover: cards[0],
    archive: cards.slice(1),
  };
}
