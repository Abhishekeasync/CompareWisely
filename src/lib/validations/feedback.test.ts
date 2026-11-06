import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema } from "./auth";
import { commentSubmitSchema } from "./content";
import { newsletterSubscribeSchema } from "./newsletter";
import { adminSoftwarePatchSchema, adminSoftwareWriteSchema } from "./software";
import { readApiError, validationErrorPayload } from "./feedback";

test("software form names the fields that need a fix", () => {
  const parsed = adminSoftwareWriteSchema.safeParse({
    name: "A",
    slug: "Bad Slug",
    categoryId: 0,
    description: "Too short",
    websiteUrl: "zoho.com",
    status: "PUBLISHED",
  });

  assert.equal(parsed.success, false);
  if (parsed.success) return;

  const payload = validationErrorPayload(parsed.error);
  assert.match(payload.fields.name, /at least 2 characters/);
  assert.match(payload.fields.slug, /lowercase/);
  assert.match(payload.fields.categoryId, /category/i);
  assert.match(payload.fields.description, /10 characters/);
  assert.match(payload.fields.websiteUrl, /https:\/\//);
  assert.match(payload.message, /more/);
});

test("login, comments, and newsletter reject empty or malformed input in plain language", () => {
  const login = loginSchema.safeParse({ email: "admin", password: "short" });
  assert.equal(login.success, false);
  if (!login.success) {
    const payload = validationErrorPayload(login.error);
    assert.match(payload.fields.email, /valid email/i);
    assert.match(payload.fields.password, /8 characters/);
  }

  const comment = commentSubmitSchema.safeParse({
    articleSlug: "gst-guide",
    authorName: "A",
    authorEmail: "not-an-email",
    content: "hi",
  });
  assert.equal(comment.success, false);
  if (!comment.success) {
    const payload = validationErrorPayload(comment.error);
    assert.match(payload.fields.authorName, /at least 2/);
    assert.match(payload.fields.authorEmail, /valid email/i);
    assert.match(payload.fields.content, /at least 5/);
  }

  const newsletter = newsletterSubscribeSchema.safeParse({ email: "person", consent: false });
  assert.equal(newsletter.success, false);
  if (!newsletter.success) {
    const payload = validationErrorPayload(newsletter.error);
    assert.match(payload.fields.email, /valid email/i);
    assert.match(payload.fields.consent, /agree/i);
  }
});

test("a draft action does not publish the product by default", () => {
  const parsed = adminSoftwarePatchSchema.safeParse({ action: "draft" });
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.action, "draft");
  assert.equal(parsed.data.status, undefined);
});

test("api errors hide raw status codes", () => {
  const expired = readApiError(
    { success: false, error: { code: "UNAUTHORIZED", message: "UNAUTHORIZED" } },
    "Try again."
  );
  assert.match(expired.message, /session has expired/i);

  const validation = readApiError(
    {
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Product name must be at least 2 characters.",
        fields: { name: "Product name must be at least 2 characters." },
      },
    },
    "Try again."
  );
  assert.equal(validation.message, "Product name must be at least 2 characters.");
  assert.equal(validation.fields.name, "Product name must be at least 2 characters.");
});
