import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/services/auth.service";
import { getAllSoftwareForAdmin } from "@/lib/services/software.service";
import { ComparisonBuilderForm } from "@/components/admin/comparison-builder";

export const instant = false;

export default async function NewComparisonAdminPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const software = await getAllSoftwareForAdmin();

  return (
    <ComparisonBuilderForm
      software={software.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
    />
  );
}
