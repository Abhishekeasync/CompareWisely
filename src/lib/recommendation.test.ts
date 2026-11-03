import test from "node:test";
import assert from "node:assert/strict";
import { calculateRecommendation } from "./services/recommendation.service";

test("recommendation.service: cloud services workflow selects Zoho Books", async () => {
  const result = await calculateRecommendation({
    businessSize: "small",
    industry: "services",
    budget: "mid",
    userSeats: "2_to_5",
    monthlyInvoiceVolume: "100_to_1000",
    bankAccountsCount: "multiple",
    mustHaveFeatures: ["cloud", "gst", "bank_feeds"],
  });

  assert.equal(result.softwareSlug, "zoho-books");
  assert.ok(result.overallFitScore >= 80, `Expected score >= 80, got ${result.overallFitScore}`);
  assert.ok(result.matchReasons.length > 0);
  assert.ok(result.tradeOffs.length > 0);

  // Check requirements audit
  const cloudReq = result.requirementsAudit.find((r) => r.featureKey === "cloud");
  assert.equal(cloudReq?.status, "MET");

  const bankFeedsReq = result.requirementsAudit.find((r) => r.featureKey === "bank_feeds");
  assert.equal(bankFeedsReq?.status, "MET");

  assert.ok(result.runnersUp.length >= 1);
});

test("recommendation.service: offline manufacturing workflow selects Tally Prime", async () => {
  const result = await calculateRecommendation({
    businessSize: "growing",
    industry: "manufacturing",
    budget: "high",
    userSeats: "6_to_20",
    monthlyInvoiceVolume: "1000_plus",
    bankAccountsCount: "single",
    mustHaveFeatures: ["offline", "inventory", "gst"],
  });

  assert.equal(result.softwareSlug, "tally-prime");
  assert.ok(result.overallFitScore >= 75);

  const offlineReq = result.requirementsAudit.find((r) => r.featureKey === "offline");
  assert.equal(offlineReq?.status, "MET");

  assert.ok(result.tradeOffs.some((t) => t.toLowerCase().includes("cloud") || t.toLowerCase().includes("desktop") || t.toLowerCase().includes("mobile")));
});

test("recommendation.service: sole proprietor low-budget selects Vyapar", async () => {
  const result = await calculateRecommendation({
    businessSize: "sole",
    industry: "trading",
    budget: "low",
    userSeats: "single",
    monthlyInvoiceVolume: "under_100",
    bankAccountsCount: "single",
    mustHaveFeatures: ["gst"],
  });

  assert.equal(result.softwareSlug, "vyapar");
  assert.ok(result.overallFitScore >= 80);
});
