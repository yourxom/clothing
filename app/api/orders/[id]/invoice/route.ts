import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

const inr = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })
    .format(paise / 100);

// GET /api/orders/[id]/invoice — returns a printable HTML invoice
export async function GET(_: NextRequest, { params }: Props) {
  const session = await auth();
  const { id }  = await params;

  const order = await db.order.findUnique({
    where:   { id },
    include: { lines: true, shippingAddress: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Only owner or admin
  const role   = (session?.user as { role?: string } | undefined)?.role;
  const isOwner = session?.user?.id && order.userId === session.user.id;
  const isAdmin = role === "admin" || role === "superadmin";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // No invoice for cancelled or refunded orders. Admins may still pull it if
  // ever needed, but customers cannot download an invoice for a voided order.
  if (!isAdmin && (order.status === "CANCELLED" || order.status === "REFUNDED")) {
    return NextResponse.json(
      { error: "Invoice is not available for cancelled or refunded orders." },
      { status: 409 }
    );
  }

  const addr = order.shippingAddress;
  const rows = order.lines.map(l => `
    <tr>
      <td>${l.productName}<br><small>SKU: ${l.variantSku} · Size ${l.size}</small></td>
      <td style="text-align:center">${l.quantity}</td>
      <td style="text-align:right">${inr(l.unitPaise)}</td>
      <td style="text-align:right">${inr(l.totalPaise)}</td>
    </tr>`).join("");

  const date = new Date(order.createdAt).toLocaleDateString("en-IN",
    { day: "numeric", month: "long", year: "numeric" });

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Invoice ${order.orderNumber} — AURELIA</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,'Times New Roman',serif;color:#29251f;padding:40px;max-width:800px;margin:0 auto;line-height:1.5}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #29251f;padding-bottom:20px;margin-bottom:30px}
  .brand{font-size:32px;letter-spacing:.2em}
  .brand small{display:block;font-size:11px;letter-spacing:.15em;color:#706b62;margin-top:4px}
  .inv-meta{text-align:right;font-size:13px;color:#706b62}
  .inv-meta strong{color:#29251f;font-size:15px}
  .parties{display:flex;justify-content:space-between;margin-bottom:30px;gap:40px}
  .party h4{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#706b62;margin-bottom:8px}
  .party p{font-size:14px;margin:2px 0}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#706b62;border-bottom:1px solid #ded7cc;padding:10px 8px}
  td{padding:12px 8px;border-bottom:1px solid #f0ebe3;font-size:14px;vertical-align:top}
  td small{color:#706b62;font-size:11px}
  .totals{margin-left:auto;width:280px}
  .totals div{display:flex;justify-content:space-between;padding:6px 8px;font-size:14px}
  .totals .grand{border-top:2px solid #29251f;margin-top:6px;padding-top:12px;font-size:17px;font-weight:bold}
  .foot{margin-top:40px;padding-top:20px;border-top:1px solid #ded7cc;font-size:12px;color:#706b62;text-align:center}
  .print-btn{display:inline-block;margin-bottom:20px;padding:10px 20px;background:#29251f;color:#fff;text-decoration:none;font-size:13px;border:none;cursor:pointer;letter-spacing:.1em}
  @media print{.print-btn{display:none}}
</style></head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <div class="head">
    <div class="brand">AURELIA<small>Contemporary Indian Fashion</small></div>
    <div class="inv-meta">
      <strong>TAX INVOICE</strong><br>
      Invoice: ${order.orderNumber}<br>
      Date: ${date}<br>
      Payment: ${order.paymentStatus}
    </div>
  </div>
  <div class="parties">
    <div class="party">
      <h4>Billed to</h4>
      ${addr ? `
        <p>${addr.fullName}</p>
        <p>${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}</p>
        <p>${addr.city}, ${addr.state} — ${addr.pincode}</p>
        <p>${addr.phone}</p>` : `<p>${order.guestEmail ?? "—"}</p>`}
    </div>
    <div class="party" style="text-align:right">
      <h4>Sold by</h4>
      <p>AURELIA Retail Pvt. Ltd.</p>
      <p>India</p>
      <p>GSTIN: (to be configured)</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${inr(order.subtotalPaise)}</span></div>
    <div><span>Shipping</span><span>${order.shippingPaise === 0 ? "FREE" : inr(order.shippingPaise)}</span></div>
    <div><span>GST</span><span>${inr(order.taxPaise)}</span></div>
    ${order.discountPaise > 0 ? `<div><span>Discount${order.couponCode ? " (" + order.couponCode + ")" : ""}</span><span>−${inr(order.discountPaise)}</span></div>` : ""}
    <div class="grand"><span>Total</span><span>${inr(order.totalPaise)}</span></div>
  </div>
  <div class="foot">
    <p>Thank you for shopping with AURELIA.</p>
    <p>This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
