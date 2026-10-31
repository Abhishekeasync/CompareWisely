import type { Metadata } from "next";
import { PageHead } from "@/components/page-head";
import { Quiz } from "@/components/lazy/public-widgets";

export const metadata: Metadata = {
  title: "Find Your Best Fit — CompareWisely",
  description:
    "Answer 6 questions about your business scale, workflows, and dealbreakers. CompareWisely calculates transparent fit scores, constraint audits, and factual trade-offs.",
};

export default function FindYourBestFitPage() {
  return (
    <>
      <PageHead
        current="Find Your Best Fit"
        eyebrow="Requirements Wizard"
        title="Find Your Best Fit Software"
        lead="Answer 6 structured questions about your business scale, industry, and essential capabilities. Get a transparent match percentage with explicit trade-offs — not a sales pitch."
      />
      <section className="section">
        <div className="container">
          <Quiz />
        </div>
      </section>
    </>
  );
}
