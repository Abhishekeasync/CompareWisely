import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./db";

test("Database connectivity: verify seeded software products", async () => {
  const products = await prisma.softwareProduct.findMany({
    orderBy: { id: "asc" },
    include: {
      category: true,
      pricingPlans: true,
      featureValues: {
        include: {
          feature: true,
        },
      },
    },
  });

  assert.equal(products.length >= 6, true, "Should have at least 6 seeded software products");

  const tally = products.find((p) => p.slug === "tally-prime");
  assert.ok(tally, "Tally Prime should exist in the database");
  assert.equal(tally.name, "Tally Prime");
  assert.equal(tally.category.slug, "accounting-compliance");
  assert.ok(tally.pricingPlans.length > 0, "Tally should have pricing plans");

  const zoho = products.find((p) => p.slug === "zoho-books");
  assert.ok(zoho, "Zoho Books should exist in the database");
  assert.equal(zoho.name, "Zoho Books");

  // Verify feature values
  const offlineFeature = tally.featureValues.find(
    (fv) => fv.feature.code === "offline"
  );
  assert.ok(offlineFeature, "Tally should have an offline feature record");
  assert.equal(offlineFeature.booleanValue, true);
});

test("Database connectivity: verify curated comparison page", async () => {
  const page = await prisma.comparisonPage.findUnique({
    where: { slug: "tally-prime-vs-zoho-books" },
    include: {
      comparisonProducts: {
        include: {
          software: true,
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  assert.ok(page, "Tally vs Zoho comparison page should exist");
  assert.equal(page.comparisonProducts.length, 2);
  assert.equal(page.comparisonProducts[0].software.slug, "tally-prime");
  assert.equal(page.comparisonProducts[1].software.slug, "zoho-books");
});
