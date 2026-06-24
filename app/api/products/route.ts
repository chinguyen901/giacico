import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PRODUCTS } from "@/data/mockData";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    const mapped = [...PRODUCTS]
      .sort((a, b) => a.line.localeCompare(b.line) || a.code.localeCompare(b.code))
      .map(p => ({
        id: p.code,
        code: p.code,
        code_tw: p.codeTW,
        name_vn: p.nameVN,
        name_zh: p.nameZH,
        line: p.line,
        yield_rate: p.yieldRate,
        wastage_kg: p.wastageKg,
        production_days_per_ton: p.productionDaysPerTon,
        qa_days: p.qaDays,
        machine_required: p.machineRequired,
      }));
    return NextResponse.json(mapped);
  }

  try {
    const sql = getDb(); const rows = await sql`
      SELECT
        id,
        code,
        code_tw,
        name_vn,
        name_zh,
        line,
        yield_rate::float,
        wastage_kg::float,
        production_days_per_ton::float,
        qa_days,
        machine_required
      FROM products
      ORDER BY line, code
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/products error (falling back to mock):", err);
    return NextResponse.json([...PRODUCTS]
      .sort((a, b) => a.line.localeCompare(b.line) || a.code.localeCompare(b.code))
      .map(p => ({
        id: p.code, code: p.code, code_tw: p.codeTW,
        name_vn: p.nameVN, name_zh: p.nameZH, line: p.line,
        yield_rate: p.yieldRate, wastage_kg: p.wastageKg,
        production_days_per_ton: p.productionDaysPerTon,
        qa_days: p.qaDays, machine_required: p.machineRequired,
      })));
  }
}
