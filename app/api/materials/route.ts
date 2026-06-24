import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { INVENTORY } from "@/data/mockData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type");
  const search = searchParams.get("search");

  if (!process.env.DATABASE_URL) {
    let rows = INVENTORY;
    if (type)   rows = rows.filter(m => m.type === type);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(m =>
        m.codeVN.toLowerCase().includes(q) ||
        m.codeTW.toLowerCase().includes(q) ||
        m.nameVN.toLowerCase().includes(q) ||
        m.nameZH.toLowerCase().includes(q)
      );
    }
    const mapped = rows.map(m => ({
      id: m.id,
      code_vn: m.codeVN,
      code_tw: m.codeTW,
      name_vn: m.nameVN,
      name_zh: m.nameZH,
      type: m.type,
      unit: m.unit,
      stock_warehouse: m.stockWarehouse,
      stock_sx1: m.stockSX1,
      stock_sx2: m.stockSX2,
      stock_sx4: m.stockSX4,
      expiry_date: m.expiryDate,
      lead_time_days: m.leadTimeDays,
      origin: m.origin,
      seasonal: m.seasonal,
      supplier: m.supplier,
    }));
    return NextResponse.json(mapped);
  }

  try {
    const sql = getDb(); const rows = await sql`
      SELECT
        id,
        code_vn,
        code_tw,
        name_vn,
        name_zh,
        type,
        unit,
        stock_warehouse::float,
        stock_sx1::float,
        stock_sx2::float,
        stock_sx4::float,
        expiry_date::text,
        lead_time_days,
        origin,
        seasonal,
        supplier
      FROM materials
      WHERE
        (${type}   IS NULL OR type = ${type})
        AND (${search} IS NULL OR
             code_vn ILIKE ${'%' + (search ?? '') + '%'} OR
             code_tw ILIKE ${'%' + (search ?? '') + '%'} OR
             name_vn ILIKE ${'%' + (search ?? '') + '%'} OR
             name_zh ILIKE ${'%' + (search ?? '') + '%'})
      ORDER BY expiry_date ASC NULLS LAST
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/materials error (falling back to mock):", err);
    let rows = INVENTORY;
    if (type)   rows = rows.filter(m => m.type === type);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(m =>
        m.codeVN.toLowerCase().includes(q) || m.codeTW.toLowerCase().includes(q) ||
        m.nameVN.toLowerCase().includes(q) || m.nameZH.toLowerCase().includes(q)
      );
    }
    return NextResponse.json(rows.map(m => ({
      id: m.id, code_vn: m.codeVN, code_tw: m.codeTW,
      name_vn: m.nameVN, name_zh: m.nameZH, type: m.type, unit: m.unit,
      stock_warehouse: m.stockWarehouse, stock_sx1: m.stockSX1,
      stock_sx2: m.stockSX2, stock_sx4: m.stockSX4,
      expiry_date: m.expiryDate, lead_time_days: m.leadTimeDays,
      origin: m.origin, seasonal: m.seasonal, supplier: m.supplier,
    })));
  }
}
