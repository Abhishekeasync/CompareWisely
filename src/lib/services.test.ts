import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllCategories,
  getSoftwareProducts,
  getSoftwareBySlug,
  getAllSoftwareSlugs,
} from "./services/software.service";
import {
  getComparisonMatrix,
  getCuratedComparison,
  getAllCuratedComparisonSlugs,
  resolveSlug,
} from "./services/comparison.service";

test("resolveSlug: maps legacy aliases and leaves full slugs intact", () => {
  assert.equal(resolveSlug("tally"), "tally-prime");
  assert.equal(resolveSlug("zoho"), "zoho-books");
  assert.equal(resolveSlug("easync"), "easync-books");
  assert.equal(resolveSlug("tally-prime"), "tally-prime");
  assert.equal(resolveSlug("unknown-tool"), "unknown-tool");
});

test("software.service: getSoftwareProducts and category filtering", async () => {
  const all = await getSoftwareProducts();
  assert.ok(all.length >= 6, "Expected at least 6 software products in database");

  const categories = await getAllCategories();
  assert.ok(categories.length >= 3, "Expected at least 3 categories");

  const filtered = await getSoftwareProducts({ categorySlug: "accounting-compliance" });
  assert.ok(filtered.length > 0, "Expected products in accounting-compliance category");
  for (const item of filtered) {
    assert.equal(item.category.slug, "accounting-compliance");
  }
});

test("software.service: getSoftwareBySlug returns full relations", async () => {
  const tally = await getSoftwareBySlug("tally-prime");
  assert.ok(tally, "Tally Prime should be found");
  assert.equal(tally.name, "Tally Prime");
  assert.ok(tally.pricingPlans.length > 0, "Should include pricing plans");
  assert.ok(tally.featureValues.length > 0, "Should include feature values");

  const missing = await getSoftwareBySlug("non-existent-product-12345");
  assert.equal(missing, null, "Missing product should return null");
});

test("software.service: getAllSoftwareSlugs returns list of active slugs", async () => {
  const slugs = await getAllSoftwareSlugs();
  assert.ok(slugs.includes("tally-prime"));
  assert.ok(slugs.includes("zoho-books"));
  assert.ok(slugs.includes("easync-books"));
});

test("software.service: getSoftwareBySlug returns Easync Books profile", async () => {
  const easync = await getSoftwareBySlug("easync-books");
  assert.ok(easync, "Easync Books should be found");
  assert.equal(easync.name, "Easync Books");
  assert.equal(easync.websiteUrl, "https://www.easyncbooks.com/");
  assert.ok(easync.featureValues.length > 0, "Should include feature values");
});

test("comparison.service: getComparisonMatrix computes columns and diffs", async () => {
  const matrix = await getComparisonMatrix(["tally", "zoho"]);
  assert.equal(matrix.columns.length, 2, "Matrix should contain 2 columns");
  assert.equal(matrix.columns[0].slug, "tally-prime");
  assert.equal(matrix.columns[1].slug, "zoho-books");

  assert.ok(matrix.categories.length > 0, "Matrix should contain feature categories");

  // Verify feature values and diff detection
  let hasDifferenceFound = false;
  for (const cat of matrix.categories) {
    for (const feat of cat.features) {
      if (feat.isDifferent) {
        hasDifferenceFound = true;
      }
      assert.ok(feat.values["tally-prime"], "Should have value for tally-prime");
      assert.ok(feat.values["zoho-books"], "Should have value for zoho-books");
    }
  }

  assert.equal(hasDifferenceFound, true, "Matrix should detect differences between Tally and Zoho");
});

test("comparison.service: getCuratedComparison retrieves page and matrix", async () => {
  const comparison = await getCuratedComparison("tally-prime-vs-zoho-books");
  assert.ok(comparison, "Should retrieve curated comparison");
  assert.equal(comparison.page.slug, "tally-prime-vs-zoho-books");
  assert.ok(comparison.page.verdictSummary, "Verdict summary should not be empty");
  assert.equal(comparison.matrix.columns.length, 2);

  const slugs = await getAllCuratedComparisonSlugs();
  assert.ok(slugs.includes("tally-prime-vs-zoho-books"));
  assert.ok(slugs.includes("easync-books-vs-zoho-books"));
});

test("comparison.service: getComparisonMatrix includes Easync Books", async () => {
  const matrix = await getComparisonMatrix(["easync-books", "zoho-books"]);
  assert.equal(matrix.columns.length, 2);
  assert.equal(matrix.columns[0].slug, "easync-books");
  assert.ok(matrix.columns[0].startingPrice.includes("14,999"));
});
