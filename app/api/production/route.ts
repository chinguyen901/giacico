import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PRODUCTION_SLOTS } from "@/data/mockData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  if (!process.env.DATABASE_URL) {
    let rows = PRODUCTION_SLOTS;
    if (from) rows = rows.filter(s => s.date >= from);
    if (to)   rows = rows.filter(s => s.date <= to);
    rows = [...rows].sort((a, b) => a.date.localeCompare(b.date) || a.machine.localeCompare(b.machine));
    const mapped = rows.map(s => ({
      id: s.id,
      order_code: s.orderId,
      product_code: s.productCode,
      product_line: s.productLine,
      machine: s.machine,
      shift: s.shift,
      slot_date: s.date,
      planned_qty: s.plannedQty,
      actual_qty: s.actualQty,
      lot_no: s.lotNo,
      status: s.status,
    }));
    return NextResponse.json(mapped);
  }

  try {
    const sql = getDb(); const rows = await sql`
      SELECT
        id,
        order_code,
        product_code,
        product_line,
        machine,
        shift,
        slot_date::text,
        planned_qty::float,
        actual_qty::float,
        lot_no,
        status
      FROM production_slots
      WHERE
        (${from} IS NULL OR slot_date >= ${from}::date)
        AND (${to}   IS NULL OR slot_date <= ${to}::date)
      ORDER BY slot_date, machine, shift
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/production error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
