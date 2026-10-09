import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Newsletter — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="admin-page">
      <h1 className="admin-heading">
        Newsletter subscribers <span className="admin-count">({subscribers.length})</span>
      </h1>
      {subscribers.length === 0 ? (
        <p className="notice">No subscribers yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Source</th>
                <th>Confirmed</th>
                <th>Signed up</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(s => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.source}</td>
                  <td>{s.confirmedAt
                    ? new Date(s.confirmedAt).toLocaleDateString("en-IN")
                    : <span className="muted">Pending</span>}
                  </td>
                  <td className="muted" style={{ fontSize: ".78rem" }}>
                    {new Date(s.createdAt).toLocaleDateString("en-IN",
                      { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
