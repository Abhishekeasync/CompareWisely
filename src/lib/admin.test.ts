import test from "node:test";
import assert from "node:assert/strict";
import { authenticateUser, signSessionToken, verifySessionToken } from "./services/auth.service";
import {
  getAdminDashboardStats,
  getAllSoftwareForAdmin,
  markPricingVerified,
  getCommentsForAdmin,
  moderateComment,
  getAuditLogs,
} from "./services/admin.service";
import { CommentStatus } from "@prisma/client";

test("auth.service: authenticateUser authenticates seeded admin and denies bad password", async () => {
  // Correct password
  const admin = await authenticateUser("admin@comparewisely.com", "Admin@CompareWisely2026!");
  assert.ok(admin, "Admin user should authenticate successfully");
  assert.equal(admin?.role, "ADMIN");

  // Incorrect password
  const badAuth = await authenticateUser("admin@comparewisely.com", "WrongPassword123!");
  assert.equal(badAuth, null, "Bad password must return null");
});

test("auth.service: signSessionToken and verifySessionToken round-trip securely", () => {
  const payload = {
    id: 1,
    email: "admin@comparewisely.com",
    name: "Editorial Lead",
    role: "ADMIN" as const,
  };

  const token = signSessionToken(payload);
  assert.ok(token.includes("."));

  const verified = verifySessionToken(token);
  assert.deepEqual(verified, payload);

  // Tampered token test
  const tamperedToken = token + "xyz";
  assert.equal(verifySessionToken(tamperedToken), null);
});

test("admin.service: getAdminDashboardStats returns valid integer counts", async () => {
  const stats = await getAdminDashboardStats();
  assert.ok(stats.totalSoftware > 0);
  assert.ok(stats.totalCategories > 0);
  assert.ok(typeof stats.pendingCommentsCount === "number");
  assert.ok(typeof stats.stalePricingCount === "number");
});

test("admin.service: markPricingVerified records pricing history and audit log", async () => {
  const allSoftware = await getAllSoftwareForAdmin();
  assert.ok(allSoftware.length > 0);

  const zoho = allSoftware.find((s) => s.slug === "zoho-books");
  assert.ok(zoho, "Zoho Books should exist");

  const startingPlan = zoho?.pricingPlans[0];
  assert.ok(startingPlan, "Zoho Books pricing plan should exist");

  const verifyResult = await markPricingVerified({
    softwareId: zoho.id,
    planId: startingPlan.id,
    newPrice: "from ₹749/month",
    sourceUrl: "https://www.zoho.com/in/books/pricing",
    userId: 1,
  });

  assert.equal(verifyResult.success, true);

  // Verify audit log has the record
  const auditLogs = await getAuditLogs(5);
  const verifyLog = auditLogs.find((l) => l.action === "VERIFY_PRICING");
  assert.ok(verifyLog, "Audit log for verify pricing must exist");
});

test("admin.service: moderateComment updates comment status to APPROVED", async () => {
  const comments = await getCommentsForAdmin();
  assert.ok(comments.length > 0, "At least 1 comment should exist from content tests");

  const targetComment = comments[0];
  const moderated = await moderateComment(targetComment.id, CommentStatus.APPROVED, 1);

  assert.equal(moderated.status, "APPROVED");
  assert.equal(moderated.moderatedById, 1);
});
