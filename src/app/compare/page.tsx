import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareWorkspace } from "@/components/lazy/public-widgets";

export const metadata: Metadata = {
  title: "Compare accounting software",
  description:
    "Pick up to four India accounting and ERP products and compare pricing, GST features, and platform fit side by side.",
};

export default function CompareHubPage() {
  return (
    <Suspense fallback={<p className="container section muted">Loading comparison tool…</p>}>
      <CompareWorkspace />
    </Suspense>
  );
}
