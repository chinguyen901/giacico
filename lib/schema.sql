-- ============================================================
-- Schema: Hệ Thống Quản Lý Sản Xuất / 生產管理系統
-- Database: Neon PostgreSQL
-- ============================================================

-- Orders (từ file 2026 年訂單管制表)
CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  order_date    DATE,
  status        VARCHAR(5)   NOT NULL DEFAULT 'CH',  -- CH/DL/DX/CX/TK/HU/NG/XN/HM
  vn_code       VARCHAR(60),   -- Mã đơn Việt Nam
  tw_code       VARCHAR(60),   -- Mã đơn Đài Loan / nước ngoài
  vn_product_code VARCHAR(60), -- Mã sản phẩm VN
  tw_product_code VARCHAR(60), -- Mã sản phẩm TW
  customer_code VARCHAR(30),
  destination   VARCHAR(60),
  unit          VARCHAR(10),
  qty_ordered   NUMERIC(12,2) DEFAULT 0,
  qty_produced  NUMERIC(12,2) DEFAULT 0,
  qty_remaining NUMERIC(12,2) DEFAULT 0,
  weight_kg     NUMERIC(12,2) DEFAULT 0,
  etd           DATE,
  ship_date     DATE,
  product_line  VARCHAR(5),    -- AV / ND / GV
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Production slots (từ file AV/ND/GV 生産排程)
CREATE TABLE IF NOT EXISTS production_slots (
  id            SERIAL PRIMARY KEY,
  order_code    VARCHAR(60),
  product_code  VARCHAR(60),
  product_line  VARCHAR(5),
  machine       VARCHAR(10),
  shift         VARCHAR(10) DEFAULT 'day',   -- day / night
  slot_date     DATE,
  planned_qty   NUMERIC(12,2) DEFAULT 0,
  actual_qty    NUMERIC(12,2),
  lot_no        VARCHAR(50),
  status        VARCHAR(20) DEFAULT 'planned', -- planned/in-progress/done/delayed
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Materials / Inventory (từ file BOM + Tồn kho)
CREATE TABLE IF NOT EXISTS materials (
  id              SERIAL PRIMARY KEY,
  code_vn         VARCHAR(60) NOT NULL,
  code_tw         VARCHAR(60),
  name_vn         TEXT,
  name_zh         TEXT,
  type            VARCHAR(20),  -- raw / semi / auxiliary / finished
  unit            VARCHAR(10) DEFAULT 'kg',
  stock_warehouse NUMERIC(12,2) DEFAULT 0,
  stock_sx1       NUMERIC(12,2) DEFAULT 0,
  stock_sx2       NUMERIC(12,2) DEFAULT 0,
  stock_sx4       NUMERIC(12,2) DEFAULT 0,
  expiry_date     DATE,
  lead_time_days  INTEGER DEFAULT 7,
  origin          VARCHAR(20) DEFAULT 'domestic', -- domestic / import
  seasonal        BOOLEAN DEFAULT FALSE,
  supplier        TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Products / BOM (từ file 配方表 + mockData đã có)
CREATE TABLE IF NOT EXISTS products (
  id                      SERIAL PRIMARY KEY,
  code                    VARCHAR(60) NOT NULL UNIQUE,
  code_tw                 VARCHAR(60),
  name_vn                 TEXT,
  name_zh                 TEXT,
  line                    VARCHAR(5),   -- AV / ND / GV
  yield_rate              NUMERIC(5,4) DEFAULT 0.90,
  wastage_kg              NUMERIC(8,2) DEFAULT 600,
  production_days_per_ton NUMERIC(5,2) DEFAULT 0.5,
  qa_days                 INTEGER DEFAULT 3,
  machine_required        VARCHAR(10),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Aged inventory > 2 months (từ file 生產日期超2個月以上表)
CREATE TABLE IF NOT EXISTS aged_inventory (
  id              SERIAL PRIMARY KEY,
  classification  VARCHAR(5),   -- A / B / C
  order_date      DATE,
  vn_order_code   VARCHAR(60),
  tw_product_code VARCHAR(60),
  vn_product_code VARCHAR(60),
  customer_code   VARCHAR(30),
  unit            VARCHAR(10),
  qty_unshipped   NUMERIC(12,2) DEFAULT 0,
  weight_kg       NUMERIC(12,2) DEFAULT 0,
  total_kg        NUMERIC(12,2) DEFAULT 0,
  production_date TEXT,         -- giữ dạng text vì có thể là "2025/12/8+9+10"
  expected_delivery DATE,
  shelf_life      VARCHAR(20),  -- "1年", "2年"
  delay_count     INTEGER DEFAULT 0,
  expiry_date     DATE,
  months_remaining NUMERIC(5,1),
  region          VARCHAR(30),  -- VN / HÀN QUỐC / ĐNA
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_product_line ON orders(product_line);
CREATE INDEX IF NOT EXISTS idx_orders_etd          ON orders(etd);
CREATE INDEX IF NOT EXISTS idx_slots_date          ON production_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_slots_machine       ON production_slots(machine);
CREATE INDEX IF NOT EXISTS idx_materials_type      ON materials(type);
CREATE INDEX IF NOT EXISTS idx_materials_expiry    ON materials(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_line       ON products(line);
CREATE INDEX IF NOT EXISTS idx_aged_region         ON aged_inventory(region);
