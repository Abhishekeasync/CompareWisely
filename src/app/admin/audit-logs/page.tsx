import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/services/auth.service";
import { getAuditLogs } from "@/lib/services/admin.service";
import { PageHead } from "@/components/page-head";
import { AdminNav } from "@/components/admin/admin-nav";

export const instant = false;

export default async function AdminAuditLogsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }

  const logs = await getAuditLogs(100);

  return (
    <>
      <PageHead
        current="Audit Ledger"
        eyebrow="Compliance &amp; Integrity"
        title="Administrative Audit Trail"
        lead="Immutable system record of catalog price verifications, editorial modifications, and comment moderations."
      />
      <section className="section">
        <div className="container">
          <AdminNav current="audit-logs" />

          <div style={{ overflowX: "auto", border: "1px solid var(--border)", background: "var(--surface)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "12px 14px", textAlign: "left" }}>Timestamp</th>
                  <th style={{ padding: "12px 14px", textAlign: "left" }}>Actor</th>
                  <th style={{ padding: "12px 14px", textAlign: "left" }}>Action</th>
                  <th style={{ padding: "12px 14px", textAlign: "left" }}>Target Entity</th>
                  <th style={{ padding: "12px 14px", textAlign: "left" }}>Change Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <b>{log.user?.name || "System"}</b>
                      <span className="tiny muted block">{log.user?.email}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {log.entityName} #{log.entityId}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "0.75rem",
                          background: "var(--surface-2)",
                          padding: "6px 8px",
                          borderRadius: "var(--r-sm)",
                          maxWidth: "360px",
                          overflowX: "auto",
                        }}
                      >
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
