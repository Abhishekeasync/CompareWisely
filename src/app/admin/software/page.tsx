import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/services/auth.service";
import { getAllSoftwareForAdmin } from "@/lib/services/admin.service";
import { prisma } from "@/lib/db";
import { PageHead } from "@/components/page-head";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSoftwareTable } from "@/components/admin/software-table";

export const instant = false;

export default async function AdminSoftwarePage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [softwareList, categories, availableFeatures] = await Promise.all([
    getAllSoftwareForAdmin(),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.feature.findMany({
      orderBy: [{ categoryId: "asc" }, { displayOrder: "asc" }],
      include: { category: true },
    }),
  ]);

  return (
    <>
      <PageHead
        current="Software Catalogue"
        eyebrow="Admin Portal"
        title="Software &amp; Pricing Verification Ledger"
        lead="Inspect active catalog records, verified pricing plans, proof sources, and freshness status."
      />
      <section className="section">
        <div className="container">
          <AdminNav current="software" />
          <AdminSoftwareTable
            initialSoftwareList={softwareList}
            categories={categories}
            availableFeatures={availableFeatures}
          />
        </div>
      </section>
    </>
  );
}
