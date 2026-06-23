#!/usr/bin/env python3
"""
seed.py – Đọc dữ liệu thật từ Excel → output seed.sql
Chạy: python3 scripts/seed.py > scripts/seed.sql
Sau đó chạy seed.sql trên Neon (SQL Editor hoặc psql)
"""

import pandas as pd
import re
import sys
import os
from datetime import datetime, date
from typing import Optional

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "..")  # project root = giacico-ke-hoach-tma/

# ─── Helpers ────────────────────────────────────────────────────────────────

def esc(v) -> str:
    """Escape a value for SQL."""
    if v is None or (isinstance(v, float) and str(v) == "nan"):
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (datetime, date)):
        return f"'{v.strftime('%Y-%m-%d')}'"
    s = str(v).strip()
    if s in ("#REF!", "#DIV/0!", "#N/A", "#VALUE!", "#NAME?", "None", "nan", ""):
        return "NULL"
    # escape single quotes
    s = s.replace("'", "''")
    return f"'{s}'"

def safe_str(v) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip()
    if s in ("#REF!", "#DIV/0!", "#N/A", "#VALUE!", "#NAME?", "None", "nan", ""):
        return None
    return s

def safe_num(v) -> Optional[float]:
    if v is None:
        return None
    try:
        f = float(v)
        if str(f) == "nan" or str(f) == "inf":
            return None
        return f
    except (ValueError, TypeError):
        return None

def safe_date(v) -> Optional[str]:
    if v is None:
        return None
    try:
        # catch pandas NaT
        if hasattr(v, "isnull") and v.isnull():
            return None
    except Exception:
        pass
    if isinstance(v, (datetime, date)):
        try:
            return v.strftime("%Y-%m-%d")
        except (ValueError, AttributeError):
            return None
    s = str(v).strip()
    if s in ("", "None", "nan", "#REF!", "#N/A"):
        return None
    # Try common formats
    for fmt in ("%Y/%m/%d", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(s.split("\n")[0].split("+")[0].strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

def infer_product_line(code: Optional[str]) -> Optional[str]:
    if not code:
        return None
    code = str(code).upper()
    if "AV" in code or "VAV" in code or "AA" in code:
        return "AV"
    if "ND" in code or "VND" in code or "NATA" in code or "NC" in code:
        return "ND"
    if "GV" in code or "VGV" in code or "VKM" in code or "VLC" in code or "AP" in code:
        return "GV"
    return None

def infer_status(v) -> str:
    s = safe_str(v)
    if not s:
        return "CH"
    s = s.strip().upper()
    valid = {"CH", "DL", "DX", "CX", "TK", "HU", "NG", "XN", "HM"}
    if s in valid:
        return s
    return "CH"

# ─── 1. ORDERS from 2026年訂單管制表 ────────────────────────────────────────

def extract_orders() -> list[dict]:
    path = os.path.join(DATA, "管理資料 QUẢN LÍ DỮ LIỆU",
                        "2026 年訂單管制表 BẢNG QUẢN LÍ ĐƠN HÀNG",
                        "2026 年訂單管制表- BẢNG QUẢN LÍ ĐƠN HÀNG.xlsx")
    rows = []
    sheet_to_line = {"Aloevera": "AV", "Nata": "ND", "Juice": "GV"}

    for sheet, line in sheet_to_line.items():
        try:
            # header row index 2 (row 3 in Excel, 0-indexed), data starts after
            df = pd.read_excel(path, sheet_name=sheet, header=2,
                               usecols=range(19), engine="openpyxl")
        except Exception as e:
            print(f"-- WARN: could not read {sheet}: {e}", file=sys.stderr)
            continue

        # drop rows where column C (index 2) is empty — no VN order code
        df = df.dropna(subset=[df.columns[2]])
        # skip title/blank rows (status-like values in col B)
        for _, r in df.iterrows():
            status = infer_status(r.iloc[1])
            vn_code = safe_str(r.iloc[2])
            if not vn_code or len(vn_code) < 3:
                continue
            # skip header-like rows that leaked through
            if vn_code.upper() in ("MÃ ĐƠN VIỆT NAM", "越南訂單編號", "TRẠNG THÁI"):
                continue

            tw_code         = safe_str(r.iloc[3])
            tw_product_code = safe_str(r.iloc[5])
            vn_product_code = safe_str(r.iloc[6])
            customer_code   = safe_str(r.iloc[7])
            destination     = safe_str(r.iloc[8])
            unit            = safe_str(r.iloc[9]) or "箱"
            qty_ordered     = safe_num(r.iloc[10]) or 0
            qty_produced    = safe_num(r.iloc[11]) or 0
            qty_remaining   = safe_num(r.iloc[12]) or 0
            weight_kg       = safe_num(r.iloc[13]) or 0
            etd             = safe_date(r.iloc[16])
            ship_date       = safe_date(r.iloc[18])
            order_date      = safe_date(r.iloc[0])

            pl = line or infer_product_line(vn_product_code or tw_product_code)

            rows.append({
                "order_date": order_date,
                "status": status,
                "vn_code": vn_code,
                "tw_code": tw_code,
                "vn_product_code": vn_product_code,
                "tw_product_code": tw_product_code,
                "customer_code": customer_code,
                "destination": destination,
                "unit": unit,
                "qty_ordered": qty_ordered,
                "qty_produced": qty_produced,
                "qty_remaining": qty_remaining,
                "weight_kg": weight_kg,
                "etd": etd,
                "ship_date": ship_date,
                "product_line": pl,
                "notes": None,
            })

    return rows


# ─── 2. AGED INVENTORY from 生產日期超2個月以上表 ──────────────────────────────

def extract_aged_inventory() -> list[dict]:
    path = os.path.join(DATA, "管理資料 QUẢN LÍ DỮ LIỆU",
                        "生產日期超2個月以上表 BẢNG SẢN PHẨM TỒN KHO TRÊN 2 THÁNG CHƯA XUẤT HÀNG",
                        "生產日期超2個月以上表 BẢNG THỐNG KÊ SẢN PHẨM TỒN KHO VƯỢT QUÁ 2 THÁNG CHƯA XUẤT HÀNG.xlsx")

    region_map = {
        "內銷  VIỆT NAM": "VN",
        "韓國 HÀN QUỐC": "HÀN QUỐC",
        "東南亞 ĐÔNG NAM Á ": "ĐNA",
    }
    rows = []

    for sheet, region in region_map.items():
        try:
            df = pd.read_excel(path, sheet_name=sheet, header=10, engine="openpyxl")
        except Exception as e:
            print(f"-- WARN: aged inv {sheet}: {e}", file=sys.stderr)
            continue

        ncols = df.shape[1]
        df = df.dropna(how="all")
        for _, r in df.iterrows():
            vn_order_code = safe_str(r.iloc[2])
            if not vn_order_code or len(vn_order_code) < 3:
                continue
            if vn_order_code.upper() in ("越南訂單編號", "MÃ ĐƠN VIỆT NAM"):
                continue

            classification  = safe_str(r.iloc[0]) or "C"
            order_date      = safe_date(r.iloc[1])
            # VN sheet: col 3 = combined TW+VN code; HÀN/ĐNA: col 3=TW, col4=VN
            if ncols >= 20:
                tw_product_code = safe_str(r.iloc[3])
                vn_product_code = safe_str(r.iloc[4])
                cust_idx, unit_idx, qty_idx, wt_idx, tot_idx = 5, 6, 7, 8, 9
                prod_idx, del_idx, shelf_idx, delay_idx = 10, 11, 12, 13
                exp_idx = 18 if ncols > 18 else ncols - 1
                rem_idx = 19 if ncols > 19 else ncols - 1
            else:
                tw_product_code = safe_str(r.iloc[3])
                vn_product_code = None
                cust_idx, unit_idx, qty_idx, wt_idx, tot_idx = 4, 5, 6, 7, 8
                prod_idx, del_idx, shelf_idx, delay_idx = 9, 10, 11, 12
                exp_idx = 17 if ncols > 17 else ncols - 1
                rem_idx = 18 if ncols > 18 else ncols - 1

            customer_code   = safe_str(r.iloc[cust_idx])
            unit            = safe_str(r.iloc[unit_idx]) or "桶"
            qty_unshipped   = safe_num(r.iloc[qty_idx]) or 0
            weight_kg       = safe_num(r.iloc[wt_idx]) or 0
            total_kg        = safe_num(r.iloc[tot_idx]) or 0
            production_date = safe_str(r.iloc[prod_idx])
            expected_del    = safe_date(r.iloc[del_idx])
            shelf_life      = safe_str(r.iloc[shelf_idx])
            delay_count     = int(safe_num(r.iloc[delay_idx]) or 0)
            expiry_date     = safe_date(r.iloc[exp_idx])
            months_rem      = safe_num(r.iloc[rem_idx])

            rows.append({
                "classification": classification[:1] if classification else "C",
                "order_date": order_date,
                "vn_order_code": vn_order_code,
                "tw_product_code": tw_product_code,
                "vn_product_code": vn_product_code,
                "customer_code": customer_code,
                "unit": unit,
                "qty_unshipped": qty_unshipped,
                "weight_kg": weight_kg,
                "total_kg": total_kg,
                "production_date": production_date,
                "expected_delivery": expected_del,
                "shelf_life": shelf_life,
                "delay_count": delay_count,
                "expiry_date": expiry_date,
                "months_remaining": months_rem,
                "region": region,
            })

    return rows


# ─── 3. MATERIALS from BOM 配方查詢表 THÔNG TIN TỒN KHO ─────────────────────

def extract_materials() -> list[dict]:
    path = os.path.join(DATA, "計算 TÍNH TOÁN", "配方表",
                        "10. 自動整合輔料、半成品及原料等相關資訊（前置期、產品規格、季節性、國外國內採購）",
                        "2026半成品配方查詢表20260302 - Bảng tính phương thức.xlsx")

    rows = []
    try:
        df = pd.read_excel(path, sheet_name="BẢNG PHƯƠNG THỨC TỔNG",
                           header=None, engine="openpyxl",
                           usecols=range(18))
    except Exception as e:
        print(f"-- WARN: materials: {e}", file=sys.stderr)
        return []

    # Real data starts at row 8 (0-indexed)
    for idx, r in df.iterrows():
        if idx < 8:
            continue
        code_vn = safe_str(r.iloc[2])  # col C
        if not code_vn or len(code_vn) < 3:
            continue
        if code_vn.upper() in ("半成品 越南代號", "MÃ SỐ BÁN THÀNH PHẨM", "PHÂN LOẠI"):
            continue

        code_tw       = safe_str(r.iloc[3])  # col D
        stock_total   = safe_num(r.iloc[11]) or 0  # col L = total stock KG

        rows.append({
            "code_vn": code_vn,
            "code_tw": code_tw,
            "name_vn": code_vn,   # will use code as name since no separate name col
            "name_zh": code_tw,
            "type": "semi",       # this sheet is semi-products
            "unit": "kg",
            "stock_warehouse": stock_total,
            "stock_sx1": 0,
            "stock_sx2": 0,
            "stock_sx4": 0,
            "expiry_date": None,
            "lead_time_days": 14,
            "origin": "domestic",
            "seasonal": False,
            "supplier": None,
        })

    return rows


# ─── 4. PRODUCTS (keep from mockData, add real codes from recipe) ────────────

PRODUCTS_STATIC = [
    ("VAV-AI266-HAA-07", "VMX-AI266-HAA-07", "Nha Đam Lô Hội 07",       "蘆薈飲料07",       "AV", 0.92, 650,  0.5, 3, "KM07"),
    ("VAV-AI270-HAA-25", "VMX-AI270-HAA-25", "Nha Đam Lô Hội 25",       "蘆薈飲料25",       "AV", 0.91, 700,  0.5, 3, "KM07"),
    ("VPS-AC156-FAD-50", "VMX-AC156-FAD-50", "Gel Lô Hội 50ml",         "蘆薈凝膠50ml",     "AV", 0.90, 600,  0.8, 5, "RE05"),
    ("VLC-AP097-FAD-85", "VMX-AP097-FAD-85", "Nước Trái Cây Tổng Hợp 85","綜合果汁85",      "GV", 0.88, 800,  0.6, 7, "WM01"),
    ("VKM-AP104-FAL-08", "VMX-AP104-FAL-08", "Nước Trái Cây Nhiệt Đới 08","熱帶果汁08",     "GV", 0.87, 850,  0.6, 7, "GA01"),
    ("VND-NC001-HAA-20", "VMX-NC001-HAA-20", "Thạch Dừa Hạt Lựu 20kg",  "椰果粒20kg",      "ND", 0.85, 1000, 1.0, 2, "RE05"),
    ("VND-NC002-HAA-50", "VMX-NC002-HAA-50", "Thạch Dừa Tấm Mỏng 50kg", "薄片椰果50kg",    "ND", 0.83, 900,  1.2, 2, "RE05"),
    ("VAV-BH004-LAA-98", "VMX-BH004-LAA-98", "Nha Đam Không Đường 98",   "無糖蘆薈98",      "AV", 0.93, 600,  0.5, 3, "KM07"),
    # Real codes from Excel order file
    ("VAV-AI132-HAA-6G", "AV-AI132-HA-7J",  "Nha Đam AI132",            "蘆薈AI132",        "AV", 0.91, 700,  0.5, 3, "KM07"),
    ("VND-AI002-BAA-5B", "ND-6I002-BA-5J",  "Thạch Dừa AI002",          "椰果AI002",        "ND", 0.85, 1000, 1.0, 2, "RE05"),
    ("VND-AI018-HAA-07", "ND-AI018-HA-7J",  "Thạch Dừa AI018",          "椰果AI018",        "ND", 0.84, 950,  1.1, 2, "RE05"),
    ("VAV-AE098-BAA-94", "AV-AE098-BA-9J",  "Nha Đam AE098",            "蘆薈AE098",        "AV", 0.92, 650,  0.5, 3, "KM07"),
]

MATERIALS_STATIC = [
    ("VNL-ALOEVERA-001",  "TWM-ALOEVERA-001",  "Nha đam thô (Lô Hội tươi)",        "新鮮蘆薈原料",      "raw",       "kg",  8500,  1200, 0,    0,    "2026-04-15", 7,  "domestic", True,  "Công ty Nha Đam Bình Thuận"),
    ("VNL-SUGAR-001",     "TWM-SUGAR-001",     "Đường tinh luyện RS",               "精製白糖RS",        "raw",       "kg",  25000, 3000, 2000, 500,  "2026-12-31", 5,  "domestic", False, "Đường Biên Hòa"),
    ("VNL-NATA-RAW-001",  "TWM-NATA-RAW-001",  "Thạch dừa thô (chưa xử lý)",       "生椰果(未加工)",    "raw",       "kg",  12000, 0,    4500, 0,    "2026-04-30", 14, "domestic", False, "HTX Thạch Dừa Bến Tre"),
    ("VNL-JUICE-APPLE-001","TWM-JUICE-APPLE-001","Nước táo cô đặc NFC",             "蘋果濃縮汁NFC",     "raw",       "kg",  3200,  0,    0,    800,  "2026-05-20", 45, "import",   False, "Taiwan Juice Co."),
    ("VNL-JUICE-PASSION-001","TWM-JUICE-PASSION-001","Nước chanh leo cô đặc",       "百香果濃縮汁",      "raw",       "kg",  1800,  0,    0,    200,  "2026-03-31", 30, "domestic", True,  "Đắk Lắk Passion Fruit Co."),
    ("VBT-ALOEGEL-001",   "TWM-ALOEGEL-001",   "BTP: Gel nha đam đã xử lý",        "半成品:蘆薈凝膠",   "semi",      "kg",  4500,  800,  0,    0,    "2026-04-10", 3,  "domestic", False, "Nội bộ"),
    ("VBT-NATA-CUT-001",  "TWM-NATA-CUT-001",  "BTP: Thạch dừa đã cắt hạt",        "半成品:椰果粒",     "semi",      "kg",  6800,  0,    2200, 0,    "2026-04-05", 21, "domestic", False, "Nội bộ"),
    ("VPL-BOTTLE-500-001","TWM-BOTTLE-500-001","Chai nhựa PET 500ml",               "PET瓶500ml",       "auxiliary", "cái", 150000,20000,15000,5000, "2028-12-31", 21, "domestic", False, "Bao bì Tân Tiến"),
    ("VPL-DECAN-AV07-001","TWM-DECAN-AV07-001","Decal nhãn VAV-AI266-HAA-07",      "標籤VMX-AI266",     "auxiliary", "cái", 45000, 8000, 0,    0,    "2027-06-30", 30, "import",   False, "Taiwan Label Co."),
    ("VTP-ALOEVERA-07-001","TWM-ALOEVERA-07-001","TP: Nha Đam Lô Hội 07 (thành phẩm)","成品:蘆薈飲料07", "finished",  "kg",  8000,  0,    0,    0,    "2026-03-15", 0,  "domestic", False, "Nội bộ"),
    ("VNL-CITRIC-001",    "TWM-CITRIC-001",    "Axit citric (phụ gia)",             "檸檬酸(添加劑)",    "auxiliary", "kg",  850,   100,  50,   0,    "2026-07-15", 14, "import",   False, "Chem Import VN"),
    ("VTP-NATA-20-001",   "TWM-NATA-20-001",   "TP: Thạch Dừa Hạt Lựu 20kg",      "成品:椰果粒20kg",   "finished",  "kg",  5200,  0,    0,    0,    "2026-02-10", 0,  "domestic", False, "Nội bộ"),
]

PRODUCTION_SLOTS_STATIC = [
    # (order_code, product_code, line, machine, shift, offset_days, planned, actual, lot, status)
    ("VN-26010045-001", "VAV-AI266-HAA-07", "AV", "KM07", "day",   -2, 2000, 1980, "L26-KM07-001", "done"),
    ("VN-26010045-001", "VAV-BH004-LAA-98", "AV", "KM07", "night", -2, 1500, 1500, "L26-KM07-002", "done"),
    ("VN-26010046-001", "VLC-AP097-FAD-85", "GV", "WM01", "day",   -1, 2500, 2300, "L26-WM01-001", "done"),
    ("VN-26020012-001", "VND-NC001-HAA-20", "ND", "RE05", "day",   -1, 1800, 1800, "L26-RE05-001", "done"),
    ("VN-26030001-001", "VAV-AI270-HAA-25", "AV", "KM07", "day",    0, 3000, None, "L26-KM07-003", "in-progress"),
    ("VN-26010046-001", "VKM-AP104-FAL-08", "GV", "GA01", "day",    0, 2000, None, "L26-GA01-001", "planned"),
    ("VN-26030008-001", "VAV-BH004-LAA-98", "AV", "RE05", "night",  0, 1500, None, "L26-RE05-002", "planned"),
    ("VN-26030001-001", "VAV-AI270-HAA-25", "AV", "KM07", "day",    1, 3000, None, "L26-KM07-004", "planned"),
    ("VN-26010046-001", "VLC-AP097-FAD-85", "GV", "WM01", "day",    1, 2500, None, "L26-WM01-002", "planned"),
    ("VN-26010046-001", "VKM-AP104-FAL-08", "GV", "GA01", "day",    2, 2000, None, "L26-GA01-002", "planned"),
    ("VN-26030008-001", "VAV-BH004-LAA-98", "AV", "RE05", "day",    2, 2000, None, "L26-RE05-003", "planned"),
    ("VN-26030008-001", "VAV-BH004-LAA-98", "AV", "KM07", "day",    3, 2000, None, "L26-KM07-005", "planned"),
    ("VN-26010046-001", "VLC-AP097-FAD-85", "GV", "WM01", "night",  3, 2500, None, "L26-WM01-003", "planned"),
    ("VN-26030001-001", "VAV-AI270-HAA-25", "AV", "RE05", "day",    4, 4000, None, "L26-RE05-004", "planned"),
]

# ─── SQL Generator ───────────────────────────────────────────────────────────

def main():
    print("-- ============================================================")
    print("-- seed.sql – Auto-generated from Excel files")
    print(f"-- Generated: {datetime.now().isoformat()}")
    print("-- ============================================================")
    print()
    print("-- Reset existing data")
    print("TRUNCATE orders, production_slots, materials, products, aged_inventory RESTART IDENTITY CASCADE;")
    print()

    # ── Products ──────────────────────────────────────────────────────────
    print("-- Products")
    print("INSERT INTO products (code, code_tw, name_vn, name_zh, line, yield_rate, wastage_kg, production_days_per_ton, qa_days, machine_required) VALUES")
    rows_sql = []
    for p in PRODUCTS_STATIC:
        rows_sql.append(f"  ({esc(p[0])}, {esc(p[1])}, {esc(p[2])}, {esc(p[3])}, {esc(p[4])}, {p[5]}, {p[6]}, {p[7]}, {p[8]}, {esc(p[9])})")
    print(",\n".join(rows_sql) + ";")
    print()

    # ── Materials (static base) ────────────────────────────────────────────
    print("-- Materials (inventory)")
    print("INSERT INTO materials (code_vn, code_tw, name_vn, name_zh, type, unit, stock_warehouse, stock_sx1, stock_sx2, stock_sx4, expiry_date, lead_time_days, origin, seasonal, supplier) VALUES")
    rows_sql = []
    for m in MATERIALS_STATIC:
        rows_sql.append(
            f"  ({esc(m[0])}, {esc(m[1])}, {esc(m[2])}, {esc(m[3])}, {esc(m[4])}, {esc(m[5])}, "
            f"{m[6]}, {m[7]}, {m[8]}, {m[9]}, {esc(m[10])}, {m[11]}, {esc(m[12])}, {'TRUE' if m[13] else 'FALSE'}, {esc(m[14])})"
        )
    print(",\n".join(rows_sql) + ";")
    print()

    # ── Orders from Excel ──────────────────────────────────────────────────
    print("-- Orders (từ Excel thật)")
    orders = extract_orders()
    if orders:
        print("INSERT INTO orders (order_date, status, vn_code, tw_code, vn_product_code, tw_product_code, customer_code, destination, unit, qty_ordered, qty_produced, qty_remaining, weight_kg, etd, ship_date, product_line, notes) VALUES")
        rows_sql = []
        for o in orders:
            rows_sql.append(
                f"  ({esc(o['order_date'])}, {esc(o['status'])}, {esc(o['vn_code'])}, {esc(o['tw_code'])}, "
                f"{esc(o['vn_product_code'])}, {esc(o['tw_product_code'])}, {esc(o['customer_code'])}, "
                f"{esc(o['destination'])}, {esc(o['unit'])}, "
                f"{o['qty_ordered']}, {o['qty_produced']}, {o['qty_remaining']}, {o['weight_kg']}, "
                f"{esc(o['etd'])}, {esc(o['ship_date'])}, {esc(o['product_line'])}, {esc(o['notes'])})"
            )
        print(",\n".join(rows_sql) + ";")
    else:
        print("-- (no orders extracted)")
    print()

    # ── Production Slots (static – relative to seed date) ─────────────────
    print("-- Production slots")
    today_sql = "CURRENT_DATE"
    print("INSERT INTO production_slots (order_code, product_code, product_line, machine, shift, slot_date, planned_qty, actual_qty, lot_no, status) VALUES")
    rows_sql = []
    for s in PRODUCTION_SLOTS_STATIC:
        order_code, product_code, line, machine, shift, offset, planned, actual, lot, status = s
        date_expr = f"(CURRENT_DATE + INTERVAL '{offset} days')" if offset != 0 else "CURRENT_DATE"
        actual_sql = "NULL" if actual is None else str(actual)
        rows_sql.append(
            f"  ({esc(order_code)}, {esc(product_code)}, {esc(line)}, {esc(machine)}, {esc(shift)}, "
            f"{date_expr}, {planned}, {actual_sql}, {esc(lot)}, {esc(status)})"
        )
    print(",\n".join(rows_sql) + ";")
    print()

    # ── Aged Inventory from Excel ──────────────────────────────────────────
    print("-- Aged inventory > 2 months (từ Excel thật)")
    aged = extract_aged_inventory()
    if aged:
        print("INSERT INTO aged_inventory (classification, order_date, vn_order_code, tw_product_code, vn_product_code, customer_code, unit, qty_unshipped, weight_kg, total_kg, production_date, expected_delivery, shelf_life, delay_count, expiry_date, months_remaining, region) VALUES")
        rows_sql = []
        for a in aged:
            rows_sql.append(
                f"  ({esc(a['classification'])}, {esc(a['order_date'])}, {esc(a['vn_order_code'])}, "
                f"{esc(a['tw_product_code'])}, {esc(a['vn_product_code'])}, {esc(a['customer_code'])}, "
                f"{esc(a['unit'])}, {a['qty_unshipped']}, {a['weight_kg']}, {a['total_kg']}, "
                f"{esc(a['production_date'])}, {esc(a['expected_delivery'])}, {esc(a['shelf_life'])}, "
                f"{a['delay_count']}, {esc(a['expiry_date'])}, "
                f"{'NULL' if a['months_remaining'] is None else a['months_remaining']}, {esc(a['region'])})"
            )
        print(",\n".join(rows_sql) + ";")
    else:
        print("-- (no aged inventory extracted)")
    print()
    print("-- Done!")

if __name__ == "__main__":
    main()
