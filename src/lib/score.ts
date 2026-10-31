import type { Answers, SoftwareId } from "./catalog";

const IDS: SoftwareId[] = ["tally", "zoho", "busy", "vyapar", "marg", "odoo", "easync"];

export function rankSoftware(answers: Answers): SoftwareId[] {
  const scores = Object.fromEntries(IDS.map((id) => [id, 0])) as Record<SoftwareId, number>;
  const { size: S, industry: I, budget: B, must: M } = answers;

  if (S === "sole") {
    scores.vyapar += 2;
    scores.zoho += 1;
  }
  if (S === "small") {
    scores.tally += 2;
    scores.busy += 1;
    scores.zoho += 1;
  }
  if (S === "growing") {
    scores.zoho += 2;
    scores.busy += 1;
    scores.tally += 1;
    scores.easync += 1;
  }
  if (S === "mid") {
    scores.odoo += 2;
    scores.zoho += 1;
    scores.marg += 1;
  }
  if (I === "trading") {
    scores.vyapar += 2;
    scores.busy += 1;
  }
  if (I === "manufacturing") {
    scores.tally += 2;
    scores.marg += 1;
    scores.odoo += 1;
  }
  if (I === "services") {
    scores.zoho += 2;
    scores.odoo += 1;
    scores.easync += 1;
  }
  if (I === "distribution") {
    scores.marg += 2;
    scores.busy += 2;
  }
  if (B === "low") {
    scores.vyapar += 2;
    scores.zoho += 1;
  }
  if (B === "mid") {
    scores.busy += 2;
    scores.tally += 1;
    scores.zoho += 1;
    scores.easync += 1;
  }
  if (B === "high") {
    scores.odoo += 2;
    scores.marg += 1;
    scores.zoho += 1;
  }
  if (B === "unsure") {
    scores.tally += 1;
    scores.zoho += 1;
  }
  for (const feature of M) {
    if (feature === "gst") {
      scores.tally += 1;
      scores.zoho += 1;
      scores.busy += 1;
      scores.easync += 1;
    }
    if (feature === "inventory") {
      scores.tally += 2;
      scores.marg += 2;
      scores.busy += 1;
    }
    if (feature === "cloud") {
      scores.zoho += 3;
      scores.odoo += 1;
      scores.easync += 2;
    }
    if (feature === "payroll") {
      scores.tally += 1;
      scores.busy += 1;
    }
    if (feature === "multibranch") {
      scores.busy += 2;
      scores.odoo += 1;
      scores.easync += 1;
    }
    if (feature === "api") {
      scores.zoho += 2;
      scores.odoo += 2;
    }
  }

  return [...IDS].sort((a, b) => scores[b] - scores[a]);
}
