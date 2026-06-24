import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ORDERS, INVENTORY, PRODUCTION_SLOTS } from "@/data/mockData";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    const today = new Date().toISOString().split("T")[0];
    const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const todaySlots = PRODUCTION_SLOTS.filter(s => s.date === today);
    return NextResponse.json({
      orders: {
        total:        ORDERS.length,
        in_production: ORDERS.filter(o => o.status === "DL").length,
        ready_to_ship: ORDERS.filter(o => o.status === "CX").length,
        shipped:       ORDERS.filter(o => o.status === "DX").length,
        pending:       ORDERS.filter(o => o.status === "CH").length,
      },
      expiryAlerts: INVENTORY.filter(m => m.expiryDate >= today && m.expiryDate <= in30).length,
      agedCount: 35,
      todayPlan: {
        planned: todaySlots.reduce((s, x) => s + x.plannedQty, 0),
        actual:  todaySlots.reduce((s, x) => s + (x.actualQty ?? 0), 0),
      },
    });
  }

  try {
    const sql = getDb(); const [orderStats, expiryAlerts, agedCount, todayProd] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int                                    AS total,
          COUNT(*) FILTER (WHERE status = 'DL')::int      AS in_production,
          COUNT(*) FILTER (WHERE status = 'CX')::int      AS ready_to_ship,
          COUNT(*) FILTER (WHERE status = 'DX')::int      AS shipped,
          COUNT(*) FILTER (WHERE status = 'CH')::int      AS pending
        FROM orders
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM materials
        WHERE expiry_date IS NOT NULL
          AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM aged_inventory
      `,
      sql`
        SELECT
          COALESCE(SUM(planned_qty), 0)::float AS planned,
          COALESCE(SUM(actual_qty),  0)::float AS actual
        FROM production_slots
        WHERE slot_date = CURRENT_DATE
      `,
    ]);

    return NextResponse.json({
      orders:       orderStats[0],
      expiryAlerts: expiryAlerts[0].count,
      agedCount:    agedCount[0].count,
      todayPlan:    todayProd[0],
    });
  } catch (err) {
    console.error("GET /api/stats error (falling back to mock):", err);
    const today = new Date().toISOString().split("T")[0];
    const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const todaySlots = PRODUCTION_SLOTS.filter(s => s.date === today);
    return NextResponse.json({
      orders: {
        total:         ORDERS.length,
        in_production: ORDERS.filter(o => o.status === "DL").length,
        ready_to_ship: ORDERS.filter(o => o.status === "CX").length,
        shipped:       ORDERS.filter(o => o.status === "DX").length,
        pending:       ORDERS.filter(o => o.status === "CH").length,
      },
      expiryAlerts: INVENTORY.filter(m => m.expiryDate >= today && m.expiryDate <= in30).length,
      agedCount: 35,
      todayPlan: {
        planned: todaySlots.reduce((s, x) => s + x.plannedQty, 0),
        actual:  todaySlots.reduce((s, x) => s + (x.actualQty ?? 0), 0),
      },
    });
  }
}
