import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ORDERS } from "@/data/mockData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const line   = searchParams.get("line");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  if (!process.env.DATABASE_URL) {
    let rows = ORDERS;
    if (line)   rows = rows.filter(o => o.productLine === line);
    if (status) rows = rows.filter(o => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(o =>
        o.vnCode.toLowerCase().includes(q) ||
        o.twCode.toLowerCase().includes(q) ||
        o.productCode.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q)
      );
    }
    const mapped = rows.map(o => ({
      id: o.id,
      order_date: o.orderDate,
      status: o.status,
      vn_code: o.vnCode,
      tw_code: o.twCode,
      vn_product_code: o.productCode,
      tw_product_code: o.productCodeTW,
      customer_code: o.customer,
      destination: o.region,
      unit: "kg",
      qty_ordered: o.qty,
      qty_produced: o.qtyProduced,
      qty_remaining: o.qty - o.qtyShipped,
      weight_kg: o.qty,
      etd: o.deliveryDate,
      ship_date: o.status === "DX" ? o.deliveryDate : null,
      product_line: o.productLine,
      notes: o.note ?? null,
    }));
    return NextResponse.json(mapped);
  }

  try {
    const sql = getDb(); const rows = await sql`
      SELECT
        id,
        order_date::text,
        status,
        vn_code,
        tw_code,
        vn_product_code,
        tw_product_code,
        customer_code,
        destination,
        unit,
        qty_ordered::float,
        qty_produced::float,
        qty_remaining::float,
        weight_kg::float,
        etd::text,
        ship_date::text,
        product_line,
        notes
      FROM orders
      WHERE
        (${line}   IS NULL OR product_line = ${line})
        AND (${status} IS NULL OR status = ${status})
        AND (${search} IS NULL OR
             vn_code ILIKE ${'%' + (search ?? '') + '%'} OR
             tw_code ILIKE ${'%' + (search ?? '') + '%'} OR
             vn_product_code ILIKE ${'%' + (search ?? '') + '%'} OR
             customer_code ILIKE ${'%' + (search ?? '') + '%'})
      ORDER BY order_date DESC NULLS LAST, id DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
