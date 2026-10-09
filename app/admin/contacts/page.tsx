import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdminMarkRead } from "@/components/admin-actions";

export const metadata: Metadata = { title: "Messages — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="admin-page">
      <h1 className="admin-heading">
        Contact messages <span className="admin-count">({messages.length})</span>
      </h1>
      {messages.length === 0 ? (
        <p className="notice">No messages yet.</p>
      ) : (
        <div className="admin-messages">
          {messages.map(m => (
            <article key={m.id} className={`admin-message${m.read ? " admin-message--read" : ""}`}>
              <header className="admin-message-header">
                <div>
                  <strong>{m.name}</strong>
                  <span className="muted" style={{ marginLeft: ".6rem", fontSize: ".78rem" }}>{m.email}</span>
                  <span className="admin-message-subject">{m.subject}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span className="muted" style={{ fontSize: ".75rem" }}>
                    {new Date(m.createdAt).toLocaleDateString("en-IN",
                      { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {!m.read && <AdminMarkRead messageId={m.id} />}
                  {m.read && <span className="admin-read-badge">Read</span>}
                </div>
              </header>
              <p className="admin-message-body">{m.message}</p>
              <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                className="text-link" style={{ fontSize: ".72rem" }}>
                Reply via email ↗
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
