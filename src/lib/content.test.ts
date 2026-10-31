import test from "node:test";
import assert from "node:assert/strict";
import { getArticles, getArticleBySlug, createComment } from "./services/content.service";
import { subscribeNewsletter, unsubscribeNewsletter } from "./services/newsletter.service";
import { ArticleType } from "@prisma/client";

test("content.service: getArticles queries published blog articles", async () => {
  const result = await getArticles({ type: ArticleType.BLOG });
  assert.ok(result.total >= 1, `Expected at least 1 article, got ${result.total}`);
  assert.ok(result.articles.some((a) => a.slug === "gstr-2b-reconciliation"));

  const gstr = result.articles.find((a) => a.slug === "gstr-2b-reconciliation");
  assert.equal(gstr?.title, "GSTR-2B reconciliation: Tally vs Zoho vs Busy");
  assert.ok(gstr?.tags.length ? gstr.tags.length > 0 : false);
});

test("content.service: getArticleBySlug retrieves full article with relations", async () => {
  const article = await getArticleBySlug("gstr-2b-reconciliation");
  assert.ok(article, "Article gstr-2b-reconciliation should exist");
  assert.equal(article?.slug, "gstr-2b-reconciliation");
  assert.ok(article?.content.includes("GSTR-2B"));
  assert.ok(Array.isArray(article?.comments));
});

test("content.service: createComment adds a comment in PENDING status", async () => {
  const comment = await createComment(
    {
      articleSlug: "gstr-2b-reconciliation",
      authorName: "Ramesh Sharma, CA",
      authorEmail: "ramesh.ca@example.com",
      content: "Does Zoho Books support direct two-factor authentication with the GST portal for 2B auto-pull?",
    },
    { ipHash: "test_ip_hash_123" }
  );

  assert.ok(comment.id > 0);
  assert.equal(comment.authorName, "Ramesh Sharma, CA");
  assert.equal(comment.status, "PENDING");
});

test("newsletter.service: subscribe and unsubscribe flow works", async () => {
  const testEmail = `test_subscriber_${Date.now()}@example.com`;

  // 1. Subscribe
  const sub = await subscribeNewsletter(testEmail, "127.0.0.1");
  assert.equal(sub.email, testEmail);
  assert.equal(sub.status, "SUBSCRIBED");

  // 2. Fetch subscriber token from db to test unsubscribe
  const { prisma } = await import("./db");
  const fullSub = await prisma.newsletterSubscriber.findUnique({
    where: { email: testEmail },
  });
  assert.ok(fullSub?.unsubscribeToken);

  // 3. Unsubscribe
  const unsub = await unsubscribeNewsletter(fullSub.unsubscribeToken);
  assert.equal(unsub.status, "UNSUBSCRIBED");
});
