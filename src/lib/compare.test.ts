import assert from "node:assert/strict";
import test from "node:test";
import type { SoftwareId } from "./catalog";
import {
  addProductId,
  canCompare,
  moveProductId,
  parseProductIds,
  removeProductId,
  serializeProductIds,
} from "./compare";

test("parseProductIds deduplicates and caps at four", () => {
  assert.deepEqual(parseProductIds("tally,zoho,tally,busy,marg,odoo,vyapar"), [
    "tally",
    "zoho",
    "busy",
    "marg",
  ]);
});

test("parseProductIds ignores unknown ids", () => {
  assert.deepEqual(parseProductIds("tally,unknown,zoho"), ["tally", "zoho"]);
});

test("canCompare requires two to four products", () => {
  assert.equal(canCompare(["tally"]), false);
  assert.equal(canCompare(["tally", "zoho"]), true);
  assert.equal(canCompare(["tally", "zoho", "busy", "marg"]), true);
});

test("add and remove maintain order", () => {
  assert.deepEqual(addProductId(["tally"], "zoho"), ["tally", "zoho"]);
  assert.deepEqual(removeProductId(["tally", "zoho", "busy"], "zoho"), ["tally", "busy"]);
});

test("moveProductId swaps neighbors", () => {
  assert.deepEqual(moveProductId(["tally", "zoho", "busy"], "zoho", 1), ["tally", "busy", "zoho"]);
});

test("serializeProductIds round-trips", () => {
  const ids: SoftwareId[] = ["vyapar", "odoo"];
  assert.deepEqual(parseProductIds(serializeProductIds(ids)), ids);
});
