-- ============================================================
-- seed.sql – Auto-generated from Excel files
-- Generated: 2026-06-23T15:33:06.063500
-- ============================================================

-- Reset existing data
TRUNCATE orders, production_slots, materials, products, aged_inventory RESTART IDENTITY CASCADE;

-- Products
INSERT INTO products (code, code_tw, name_vn, name_zh, line, yield_rate, wastage_kg, production_days_per_ton, qa_days, machine_required) VALUES
  ('VAV-AI266-HAA-07', 'VMX-AI266-HAA-07', 'Nha Đam Lô Hội 07', '蘆薈飲料07', 'AV', 0.92, 650, 0.5, 3, 'KM07'),
  ('VAV-AI270-HAA-25', 'VMX-AI270-HAA-25', 'Nha Đam Lô Hội 25', '蘆薈飲料25', 'AV', 0.91, 700, 0.5, 3, 'KM07'),
  ('VPS-AC156-FAD-50', 'VMX-AC156-FAD-50', 'Gel Lô Hội 50ml', '蘆薈凝膠50ml', 'AV', 0.9, 600, 0.8, 5, 'RE05'),
  ('VLC-AP097-FAD-85', 'VMX-AP097-FAD-85', 'Nước Trái Cây Tổng Hợp 85', '綜合果汁85', 'GV', 0.88, 800, 0.6, 7, 'WM01'),
  ('VKM-AP104-FAL-08', 'VMX-AP104-FAL-08', 'Nước Trái Cây Nhiệt Đới 08', '熱帶果汁08', 'GV', 0.87, 850, 0.6, 7, 'GA01'),
  ('VND-NC001-HAA-20', 'VMX-NC001-HAA-20', 'Thạch Dừa Hạt Lựu 20kg', '椰果粒20kg', 'ND', 0.85, 1000, 1.0, 2, 'RE05'),
  ('VND-NC002-HAA-50', 'VMX-NC002-HAA-50', 'Thạch Dừa Tấm Mỏng 50kg', '薄片椰果50kg', 'ND', 0.83, 900, 1.2, 2, 'RE05'),
  ('VAV-BH004-LAA-98', 'VMX-BH004-LAA-98', 'Nha Đam Không Đường 98', '無糖蘆薈98', 'AV', 0.93, 600, 0.5, 3, 'KM07'),
  ('VAV-AI132-HAA-6G', 'AV-AI132-HA-7J', 'Nha Đam AI132', '蘆薈AI132', 'AV', 0.91, 700, 0.5, 3, 'KM07'),
  ('VND-AI002-BAA-5B', 'ND-6I002-BA-5J', 'Thạch Dừa AI002', '椰果AI002', 'ND', 0.85, 1000, 1.0, 2, 'RE05'),
  ('VND-AI018-HAA-07', 'ND-AI018-HA-7J', 'Thạch Dừa AI018', '椰果AI018', 'ND', 0.84, 950, 1.1, 2, 'RE05'),
  ('VAV-AE098-BAA-94', 'AV-AE098-BA-9J', 'Nha Đam AE098', '蘆薈AE098', 'AV', 0.92, 650, 0.5, 3, 'KM07');

-- Materials (inventory)
INSERT INTO materials (code_vn, code_tw, name_vn, name_zh, type, unit, stock_warehouse, stock_sx1, stock_sx2, stock_sx4, expiry_date, lead_time_days, origin, seasonal, supplier) VALUES
  ('VNL-ALOEVERA-001', 'TWM-ALOEVERA-001', 'Nha đam thô (Lô Hội tươi)', '新鮮蘆薈原料', 'raw', 'kg', 8500, 1200, 0, 0, '2026-04-15', 7, 'domestic', TRUE, 'Công ty Nha Đam Bình Thuận'),
  ('VNL-SUGAR-001', 'TWM-SUGAR-001', 'Đường tinh luyện RS', '精製白糖RS', 'raw', 'kg', 25000, 3000, 2000, 500, '2026-12-31', 5, 'domestic', FALSE, 'Đường Biên Hòa'),
  ('VNL-NATA-RAW-001', 'TWM-NATA-RAW-001', 'Thạch dừa thô (chưa xử lý)', '生椰果(未加工)', 'raw', 'kg', 12000, 0, 4500, 0, '2026-04-30', 14, 'domestic', FALSE, 'HTX Thạch Dừa Bến Tre'),
  ('VNL-JUICE-APPLE-001', 'TWM-JUICE-APPLE-001', 'Nước táo cô đặc NFC', '蘋果濃縮汁NFC', 'raw', 'kg', 3200, 0, 0, 800, '2026-05-20', 45, 'import', FALSE, 'Taiwan Juice Co.'),
  ('VNL-JUICE-PASSION-001', 'TWM-JUICE-PASSION-001', 'Nước chanh leo cô đặc', '百香果濃縮汁', 'raw', 'kg', 1800, 0, 0, 200, '2026-03-31', 30, 'domestic', TRUE, 'Đắk Lắk Passion Fruit Co.'),
  ('VBT-ALOEGEL-001', 'TWM-ALOEGEL-001', 'BTP: Gel nha đam đã xử lý', '半成品:蘆薈凝膠', 'semi', 'kg', 4500, 800, 0, 0, '2026-04-10', 3, 'domestic', FALSE, 'Nội bộ'),
  ('VBT-NATA-CUT-001', 'TWM-NATA-CUT-001', 'BTP: Thạch dừa đã cắt hạt', '半成品:椰果粒', 'semi', 'kg', 6800, 0, 2200, 0, '2026-04-05', 21, 'domestic', FALSE, 'Nội bộ'),
  ('VPL-BOTTLE-500-001', 'TWM-BOTTLE-500-001', 'Chai nhựa PET 500ml', 'PET瓶500ml', 'auxiliary', 'cái', 150000, 20000, 15000, 5000, '2028-12-31', 21, 'domestic', FALSE, 'Bao bì Tân Tiến'),
  ('VPL-DECAN-AV07-001', 'TWM-DECAN-AV07-001', 'Decal nhãn VAV-AI266-HAA-07', '標籤VMX-AI266', 'auxiliary', 'cái', 45000, 8000, 0, 0, '2027-06-30', 30, 'import', FALSE, 'Taiwan Label Co.'),
  ('VTP-ALOEVERA-07-001', 'TWM-ALOEVERA-07-001', 'TP: Nha Đam Lô Hội 07 (thành phẩm)', '成品:蘆薈飲料07', 'finished', 'kg', 8000, 0, 0, 0, '2026-03-15', 0, 'domestic', FALSE, 'Nội bộ'),
  ('VNL-CITRIC-001', 'TWM-CITRIC-001', 'Axit citric (phụ gia)', '檸檬酸(添加劑)', 'auxiliary', 'kg', 850, 100, 50, 0, '2026-07-15', 14, 'import', FALSE, 'Chem Import VN'),
  ('VTP-NATA-20-001', 'TWM-NATA-20-001', 'TP: Thạch Dừa Hạt Lựu 20kg', '成品:椰果粒20kg', 'finished', 'kg', 5200, 0, 0, 0, '2026-02-10', 0, 'domestic', FALSE, 'Nội bộ');

-- Orders (từ Excel thật)
INSERT INTO orders (order_date, status, vn_code, tw_code, vn_product_code, tw_product_code, customer_code, destination, unit, qty_ordered, qty_produced, qty_remaining, weight_kg, etd, ship_date, product_line, notes) VALUES
  (NULL, 'CH', '東南亞2025年預估', '0', 'VAV-AE098-BAA-94', '0', '0', '0', '箱', 675.0, 0, -675.0, 200.0, NULL, NULL, 'AV', NULL),
  (NULL, 'DL', 'PPO-25120021-2', 'PTE-25120023', 'VAV-AI132-HAA-6G', 'AV-AI132-HA-7J', 'AM004', 'PORT KLANG', '箱', 1400.0, 607.0, -793.0, 10.0, NULL, NULL, 'AV', NULL),
  (NULL, 'DX', 'VN-25120013-1', '0', 'VAV-AI270-HAA-36', '0', 'CV003', 'CANADA', '箱', 320.0, 320.0, 0, 10.0, NULL, NULL, 'AV', NULL),
  (NULL, 'DX', 'VN-25120013-2', '0', 'VAV-AI270-HAA-36', '0', 'CV003', 'CANADA', '箱', 320.0, 320.0, 0, 10.0, NULL, NULL, 'AV', NULL),
  (NULL, 'CX', 'VN-26010004-1', '0', 'VAV-AE095-BAA-52', '0', 'CJ004', '内销', '桶', 1008.0, 1008.0, 0, 200.0, NULL, NULL, 'AV', NULL),
  (NULL, 'DL', 'VN-26010004-2', '0', 'VAV-AE095-BAA-52', '0', 'CJ004', '内销', '桶', 948.0, 433.0, -515.0, 200.0, NULL, NULL, 'AV', NULL),
  (NULL, 'CH', 'VN-26010005', '0', 'VAV-AI270-HAA-25', '0', 'BE001', '北部', '箱', 1400.0, 0, -1400.0, 10.0, NULL, NULL, 'AV', NULL),
  (NULL, 'CH', 'PPO-26010016', 'PTE-26010014', 'VAV-AI242-HAA-6G', 'AV-6I242-HA-7J', 'AM004', 'SINGAPORE', '箱', 1400.0, 0, -1400.0, 10.0, NULL, NULL, 'AV', NULL),
  (NULL, 'CH', 'VN-26010013-1', '0', 'VAV-AI266-HAA-07', '0', '內銷', '北部', '桶', 535.0, 0, -535.0, 18.7, NULL, NULL, 'AV', NULL),
  (NULL, 'CH', 'VN-26010013-2', '0', 'VAV-AI266-HAA-07', '0', '內銷', '北部', '桶', 803.0, 0, -803.0, 18.7, NULL, NULL, 'AV', NULL),
  (NULL, 'CH', 'VN-26010013-3', '0', 'VAV-AI266-HAA-07', '0', '內銷', '北部', '桶', 803.0, 0, -803.0, 18.7, NULL, NULL, 'AV', NULL),
  (NULL, 'CH', 'VN-26010014-1', '0', 'VAV-AI266-HAA-07', '0', '內銷', '北部', '桶', 535.0, 0, -535.0, 18.7, NULL, NULL, 'AV', NULL),
  (NULL, 'CH', 'VN-26010014-2', '0', 'VAV-AI266-HAA-07', '0', '內銷', '北部', '桶', 803.0, 0, -803.0, 18.7, NULL, NULL, 'AV', NULL),
  (NULL, 'CH', 'VN-26010014-3', '0', 'VAV-AI266-HAA-07', '0', '內銷', '北部', '桶', 803.0, 0, -803.0, 18.7, NULL, NULL, 'AV', NULL),
  (NULL, 'CX', 'VN-26020010-1', '0', 'VAV-AI266-HAA-25', '0', 'BB010', '北部', '箱', 1000.0, 1000.0, 0, 10.0, NULL, NULL, 'AV', NULL),
  (NULL, 'TK', 'VN-26020010-2', '0', 'VAV-AI266-HAA-25', '0', 'BB010', '北部', '箱', 1000.0, 138.0, -862.0, 10.0, NULL, NULL, 'AV', NULL),
  (NULL, 'DX', 'PPO-24040014-13', 'PTE-24040021', 'VND-AI002-BAA-5B', 'ND-6I002-BA-5J', 'AH001', 'BUSAN', '桶', 504.0, 504.0, 0, 157.5, NULL, NULL, 'ND', NULL),
  (NULL, 'DX', 'PPO-25080018', 'PTE-25080016', 'VNC-AE163-HAA-28', 'ND-6E163-HA-25', 'AA081', 'KOLKATA', '箱', 4900.0, 4900.0, 0, 10.0, NULL, NULL, 'ND', NULL),
  (NULL, 'DX', 'VN-25080014', '0', 'VNC-AI237-HAA-25', '0', 'BB010', '北部', '箱', 46.0, 46.0, 0, 10.0, NULL, NULL, 'ND', NULL),
  (NULL, 'DX', 'PPO-25110022', 'PTE-25110020', 'VND-AI002-HAA-6G', 'ND-6I002-HA-7J', 'AT051', 'VLADIVOSTOK', '箱', 1600.0, 1600.0, 0, 10.0, NULL, NULL, 'ND', NULL),
  (NULL, 'CH', 'VN-25120006', '0', 'VNC-AI237-HAA-25', '0', 'BB010', '北部', '箱', 1000.0, 0, -1000.0, 10.0, NULL, NULL, 'ND', NULL),
  (NULL, 'CX', 'PPO-25120015', 'PTE-25120012', 'VNC-AI306-BAA-92', 'ND-6I306-BA-82', 'AE035', 'INCHEON', '箱', 800.0, 800.0, 0, 20.0, NULL, NULL, 'ND', NULL),
  (NULL, 'DX', 'PPO-25120017', 'PTE-25120021', 'VNC-AI406-HAA-25', 'ND-6I406-HA-25', 'AK041', 'LAEM CHABANG', '箱', 200.0, 200.0, 0, 10.0, NULL, NULL, 'ND', NULL),
  (NULL, 'DL', 'YPI-25120005', 'TAICHUNG', 'VNC-AI024-HAA-29', 'ND-6I024-H6-7C', 'TW001', 'TAICHUNG,TAIWAN', '桶', 1400.0, 27.0, -1373.0, 10.0, NULL, '2026-03-03', 'ND', NULL),
  (NULL, 'CH', 'YPI-25120006', 'TAICHUNG', 'VNC-AI305-HAA-07', 'ND-6I305-HA-07', 'TW001', 'TAICHUNG,TAIWAN', '桶', 450.0, 0, -450.0, 18.0, NULL, NULL, 'ND', NULL),
  (NULL, 'CH', 'VN-25120016', '0', 'VNC-AI448-HAA-07', '0', 'BT013', '中部', '桶', 535.0, 0, -535.0, 18.7, NULL, NULL, 'ND', NULL),
  (NULL, 'DL', 'YPI-26010002', 'TAICHUNG', 'VND-AI018-HAA-07', 'ND-AI018-HA-B7', 'TW001', 'TAICHUNG,TAIWAN', '桶', 940.0, 11.0, -929.0, 18.0, NULL, NULL, 'ND', NULL),
  (NULL, 'CX', 'PPO-26010004', 'PTE-26010003', 'VNC-AI262-BAA-32', 'ND-6I262-BA-3S', 'AN031', 'BUSAN', '桶', 160.0, 78.0, -82.0, 200.0, NULL, NULL, 'ND', NULL),
  (NULL, 'CH', 'PPO-26010014', 'PTE-26010010', 'VNC-AI301-HAA-6G', 'ND-6I301-HA-7J', 'AS052', 'INCHEON', '箱', 800.0, 0, -800.0, 10.0, NULL, NULL, 'ND', NULL),
  (NULL, 'CH', 'YPI-26010004-1', 'TAICHUNG', 'VNC-AI024-HAA-29', 'ND-6I024-H6-7C', 'TW001', 'TAICHUNG,TAIWAN', '桶', 1400.0, 0, -1400.0, 10.0, NULL, NULL, 'ND', NULL),
  (NULL, 'NG', 'VN-23030027', '0', 'VMX-AP165-RAD-U1', '0', 'CY002', 'INCHEON', '箱', 1680.0, 0, -1680.0, 10.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CX', 'PPO-24110010-3', 'PTE-24110016', 'VWM-AP108-RAL-69', 'WM-6P108-PL-ED', 'AC043', 'BUSAN', '箱', 2090.0, 2090.0, 0, 10.0, NULL, NULL, 'GV', NULL),
  (NULL, 'HU', 'PPO-24110013-1', 'PTE-24110021', 'VKM-AP010-FAL-26', 'KM-6P010-FL-22', 'AS009', 'HONG KONG', '桶', 65.0, 65.0, 0, 20.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', '東南亞2025年預估', '0', 'VGA-AP018-FAD-80', 'GA-6P004-FD-5N', 'AS009', '0', '桶', 0, 0, 0, 180.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', '內銷-2025年預估', '0', 'VGA-AP018-HAD-07', '0', 'BB010', '北部', '桶', 2195.0, 0, -2195.0, 18.0, NULL, NULL, 'GV', NULL),
  (NULL, 'DX', 'PPO-24110014-2', 'PTE-24110022', 'VPN-AC228-FAL-50', 'PN-6C228-FL-50', 'AA060', 'YOKOHAMA', '桶', 216.0, 216.0, 0, 260.0, NULL, NULL, 'GV', NULL),
  (NULL, 'DL', 'PPO-24110037', 'PTE-24110033', 'VWM-AP113-RAL-36', 'WM-6P113-PL-7D', 'AT061', 'INCHEON', '箱', 16000.0, 3007.0, -12993.0, 10.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', '2025-26VKM003', '0', 'VKM-AP098-FAL-08 
VKM-AP010-FAL-08', '0', 'NO', '上海/广州', '桶', 1700.0, 0, -1700.0, 17.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'TW001-2026年預估', 'TAICHUNG', 'VPY-AC109-FAD-84', 'PY-AC109-FD-2A', 'TW001', 'TAICHUNG,TAIWAN', '桶', 8400.0, 0, -8400.0, 20.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'VN-25010016-1', '0', 'VCO-AC074-FAL-A9', '0', 'CG007', 'CHINA', '桶', 1000.0, 0, -1000.0, 22.0, NULL, NULL, 'GV', NULL),
  (NULL, 'DL', 'PPO-25090026', 'PTE-25090025', 'VPS-AC004-FAD-50', 'PS-AC112-FD-50', 'AI005', 'YOKOHAMA', '桶', 184.0, 92.0, -92.0, 230.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'SHO26008', '0', 'VKM-AP010-FAL-08', '0', 'NO', '广州', '桶', 1100.0, 0, -1100.0, 17.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'TW002-2026年預估', 'TAICHUNG', 'VSC-AC046-FAL-22', 'SC-6C046-FL-22', 'TW002', 'TAICHUNG,TAIWAN', '桶', 16950.0, 0, -16950.0, 1.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'SHO26009', '0', 'VKM-AP098-FAL-08', '0', 'NO', '上海', '桶', 1100.0, 0, -1100.0, 17.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'VN-25090028', '0', 'VGA-AP018-HAD-07', '0', 'BB010', '北部', '桶', 1500.0, 0, -1500.0, 18.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'SHO26010', '0', 'VKM-AP098-FAL-08', '0', 'NO', '上海', '桶', 1100.0, 0, -1100.0, 17.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'VN-25100011', '0', 'VPS-AP012-FAD-08', '0', 'AI002', '東南部', '桶', 615.0, 615.0, 0, 17.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'VN-25100028', '0', 'VGA-AP018-HAD-07', '0', 'BB010', '北部', '桶', 1500.0, 0, -1500.0, 18.0, NULL, NULL, 'GV', NULL),
  (NULL, 'TK', 'VN-25120009', '0', 'VLC-AP018-FAL-84', '0', 'AM004', '内销', '桶', 4.0, 4.0, 0, 20.0, NULL, NULL, 'GV', NULL),
  (NULL, 'DL', 'PPO-25120016', 'PTE-25120017', 'VPN-AC228-FAL-50', 'PN-6C228-FL-50', 'AA060', 'YOKOHAMA', '桶', 72.0, 69.0, -3.0, 260.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'VN-26020022-1', '0', 'VGA-AP018-FAD-79', '0', 'AN007', '南部', '箱', 0, 0, 0, 10.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'VN-26020022-2', '0', 'VLE-AP001-FAD-79', '0', 'AN007', '南部', '箱', 500.0, 0, -500.0, 10.0, NULL, NULL, 'GV', NULL),
  (NULL, 'CH', 'VN-26020023', '0', 'VGA-AP018-FAD-79', '0', 'AN007', '南部', '箱', 1000.0, 0, -1000.0, 10.0, NULL, NULL, 'GV', NULL);

-- Production slots
INSERT INTO production_slots (order_code, product_code, product_line, machine, shift, slot_date, planned_qty, actual_qty, lot_no, status) VALUES
  ('VN-26010045-001', 'VAV-AI266-HAA-07', 'AV', 'KM07', 'day', (CURRENT_DATE + INTERVAL '-2 days'), 2000, 1980, 'L26-KM07-001', 'done'),
  ('VN-26010045-001', 'VAV-BH004-LAA-98', 'AV', 'KM07', 'night', (CURRENT_DATE + INTERVAL '-2 days'), 1500, 1500, 'L26-KM07-002', 'done'),
  ('VN-26010046-001', 'VLC-AP097-FAD-85', 'GV', 'WM01', 'day', (CURRENT_DATE + INTERVAL '-1 days'), 2500, 2300, 'L26-WM01-001', 'done'),
  ('VN-26020012-001', 'VND-NC001-HAA-20', 'ND', 'RE05', 'day', (CURRENT_DATE + INTERVAL '-1 days'), 1800, 1800, 'L26-RE05-001', 'done'),
  ('VN-26030001-001', 'VAV-AI270-HAA-25', 'AV', 'KM07', 'day', CURRENT_DATE, 3000, NULL, 'L26-KM07-003', 'in-progress'),
  ('VN-26010046-001', 'VKM-AP104-FAL-08', 'GV', 'GA01', 'day', CURRENT_DATE, 2000, NULL, 'L26-GA01-001', 'planned'),
  ('VN-26030008-001', 'VAV-BH004-LAA-98', 'AV', 'RE05', 'night', CURRENT_DATE, 1500, NULL, 'L26-RE05-002', 'planned'),
  ('VN-26030001-001', 'VAV-AI270-HAA-25', 'AV', 'KM07', 'day', (CURRENT_DATE + INTERVAL '1 days'), 3000, NULL, 'L26-KM07-004', 'planned'),
  ('VN-26010046-001', 'VLC-AP097-FAD-85', 'GV', 'WM01', 'day', (CURRENT_DATE + INTERVAL '1 days'), 2500, NULL, 'L26-WM01-002', 'planned'),
  ('VN-26010046-001', 'VKM-AP104-FAL-08', 'GV', 'GA01', 'day', (CURRENT_DATE + INTERVAL '2 days'), 2000, NULL, 'L26-GA01-002', 'planned'),
  ('VN-26030008-001', 'VAV-BH004-LAA-98', 'AV', 'RE05', 'day', (CURRENT_DATE + INTERVAL '2 days'), 2000, NULL, 'L26-RE05-003', 'planned'),
  ('VN-26030008-001', 'VAV-BH004-LAA-98', 'AV', 'KM07', 'day', (CURRENT_DATE + INTERVAL '3 days'), 2000, NULL, 'L26-KM07-005', 'planned'),
  ('VN-26010046-001', 'VLC-AP097-FAD-85', 'GV', 'WM01', 'night', (CURRENT_DATE + INTERVAL '3 days'), 2500, NULL, 'L26-WM01-003', 'planned'),
  ('VN-26030001-001', 'VAV-AI270-HAA-25', 'AV', 'RE05', 'day', (CURRENT_DATE + INTERVAL '4 days'), 4000, NULL, 'L26-RE05-004', 'planned');

-- Aged inventory > 2 months (từ Excel thật)
INSERT INTO aged_inventory (classification, order_date, vn_order_code, tw_product_code, vn_product_code, customer_code, unit, qty_unshipped, weight_kg, total_kg, production_date, expected_delivery, shelf_life, delay_count, expiry_date, months_remaining, region) VALUES
  ('B', NULL, 'VN-25020010', 'VGW-AC014-FAC-08', NULL, 'BB010', '桶', 117.0, 20.0, 2340.0, '2025/02/28', '2025-03-20', '2年', 7, '2027-02-27', 12.0, 'VN'),
  ('C', NULL, 'VN-25060013', 'VOL-AC021-FAL-08', NULL, 'BB010', '桶', 7.0, 20.0, 140.0, '2025-07-18 00:00:00', NULL, '2年', 3, '2027-07-17', 17.0, 'VN'),
  ('C', NULL, 'VN-25070008', 'VOL-AC021-FAL-08', NULL, 'BB010', '桶', 252.0, 20.0, 5040.0, '2025-07-18 00:00:00', '2025-08-18', '2年', 3, '2027-07-17', 17.0, 'VN'),
  ('C', NULL, 'VN-25090011', 'VAV-AI266-HAA-25', NULL, 'BB010', '箱', 35.0, 10.0, 350.0, '2025/10/3', '2025-11-06', '1年', 1, '2026-10-02', 8.0, 'VN'),
  ('C', NULL, 'VN-25080014', 'VNC-AI237-HAA-25', NULL, 'BB010', '箱', 46.0, 10.0, 460.0, '2025/09/30', '2025-10-17', '1年', 1, '2026-09-29', 7.0, 'VN'),
  ('C', NULL, 'VN-25090006', 'VLE-AP001-FAD-79', NULL, 'AN007', '箱', 260.0, 10.0, 2600.0, '2025-10-06 00:00:00', NULL, '2年', 1, '2027-10-05', 20.0, 'VN'),
  ('C', NULL, 'VN-25070009', 'VPE-AC004-HAD-07', NULL, 'BB010', '桶', 175.0, 19.2, 3360.0, '2025-09-15 00:00:00', NULL, '1年', 1, '2026-09-14', 7.0, 'VN'),
  ('C', NULL, 'VN-25100016', 'VAP-AC027-CAC-52', NULL, 'BT013', '桶', 20.0, 260.0, 5200.0, '2025-11-27 00:00:00', NULL, '2年', 0, '2027-11-26', 21.0, 'VN'),
  ('C', NULL, 'VN-25110010-3', 'VAP-AC027-CAC-52', NULL, 'BB010', '桶', 32.0, 260.0, 8320.0, '2025-11-28 00:00:00', '2025-01-06', '2年', 0, '2027-11-27', 21.0, 'VN'),
  ('C', NULL, 'VN-25110008-1', 'VCO-AC098-FAL-A9', NULL, 'AD009', '桶', 1000.0, 22.0, 22000.0, '2025-12-15 00:00:00', '2025-12-15', '2年', 0, '2027-12-14', 22.0, 'VN'),
  ('C', NULL, 'VN-25110007', 'VGA-AP018-FAD-79', NULL, 'AN007', '箱', 10.0, 10.0, 100.0, '2025-12-02 00:00:00', '2025-12-15', '2年', 0, '2027-12-01', 22.0, 'VN'),
  ('C', NULL, 'VN-25120002', 'VGA-AP018-HAD-07', NULL, 'BB010', '桶', 224.0, 18.0, 4032.0, '2025-12-05 00:00:00', NULL, '1年', 0, '2026-12-04', 10.0, 'VN'),
  ('C', NULL, 'VN-25090014', 'VLE-AP001-FAD-79', NULL, 'AN007', '箱', 950.0, 10.0, 9500.0, '2025-11-10 00:00:00', NULL, '2年', 0, '2027-11-09', 21.0, 'VN'),
  ('C', NULL, 'VN-25110006', 'VLE-AP001-FAD-79', NULL, 'AN007', '箱', 350.0, 10.0, 3500.0, '2025-11-21 00:00:00', NULL, '2年', 0, '2027-11-20', 21.0, 'VN'),
  ('C', NULL, 'VN-25100013-3+8', 'VMX-AP245-RAL-T2', NULL, 'CC002', '箱', 336.0, 2.22, 745.9200000000001, '2025-12-01 00:00:00', '2025-12-10', NULL, 0, NULL, NULL, 'VN'),
  ('C', NULL, 'VN-25100013-2+9', 'VMX-AP273-RAL-T2', NULL, 'CC002', '箱', 448.0, 2.22, 994.5600000000001, '2025-12-01 00:00:00', '2025-12-10', NULL, 0, NULL, NULL, 'VN'),
  ('C', NULL, 'VN-25100013-5,12', 'VMX-AP318-RAL-T2', NULL, 'CC002', '箱', 672.0, 2.22, 1491.8400000000001, '2025-12-03 00:00:00', '2025-12-10', NULL, 0, NULL, NULL, 'VN'),
  ('C', NULL, 'VN-25100013-7', 'VMX-AP321-RAL-T2', NULL, 'CC002', '箱', 336.0, 2.22, 745.9200000000001, '2025-12-03 00:00:00', '2025-12-10', NULL, 0, NULL, NULL, 'VN'),
  ('C', NULL, 'VN-25100020', 'VPS-AP095-HAD-07', NULL, 'BB010', '桶', 83.0, 18.5, 1535.5, '2025-11-26 00:00:00', '2025-12-17', '1年', 0, '2026-11-25', 9.0, 'VN'),
  ('B', NULL, 'PPO-25120003', 'KM-AP125-PD-7P', 'VKM-AP028-RAD-70', 'AE035', '箱', 350.0, 10.0, 3500.0, '2025-05-12 00:00:00', NULL, '1年', 0, NULL, NULL, 'HÀN QUỐC'),
  ('C', NULL, 'PPO-24110037', 'WM-6P113-PL-7D', 'VWM-AP113-RAL-36', 'AT061', '箱', 3007.0, 10.0, 30070.0, '2025/03/20+21', '2025-02-09', '2年', 0, '2025-03-20', NULL, 'HÀN QUỐC'),
  ('C', NULL, 'PPO-24120034', 'WM-6P053-FD-EW', 'VWM-AP053-FAD-78', 'AS052', '箱', 4691.0, 10.0, 46910.0, '2025/06/3+10+11
2025/08/5+6+11+12+13+15', '2025-05-11', '2年', 0, '2025-06-03', NULL, 'HÀN QUỐC'),
  ('C', NULL, 'PPO-25020012-12-15', 'WM-6P108-PL-7P', 'VWM-AP108-RAL-70', 'AC043', '箱', 6062.0, 10.0, 60620.0, '2025/6/10
2025/8/21
2025/10/1', NULL, '2年', 0, '2025-06-10', NULL, 'HÀN QUỐC'),
  ('C', NULL, 'PPO-24120020-6', 'AV-6E020-BA-5J', 'VAV-AE020-BAA-55', 'AW006', '桶', 312.0, 200.0, 62400.0, '2025/10/10+13', NULL, '1年', 0, '2025-10-10', NULL, 'HÀN QUỐC'),
  ('C', NULL, 'PPO-25110015-1', 'CR-6P006-PD-7P', 'VCR-AP006-RAD-70', 'AS052', '箱', 6.0, 10.0, 60.0, '2025-11-17 00:00:00', NULL, '1年', 0, NULL, NULL, 'HÀN QUỐC'),
  ('C', NULL, 'PPO-25050029-1', 'GU-AC128-FA-5A', 'VGU-AC011-FAA-51', 'AM038', '桶', 416.0, 240.0, 99840.0, '2025/12/12
2026/01/15+16', NULL, '2年', 0, '2025-12-12', NULL, 'HÀN QUỐC'),
  ('C', NULL, 'PPO-25110005', 'PN-6C228-FL-08', 'VPN-AC228-FAL-08', 'AA019', '桶', 125.0, 20.0, 2500.0, '2025-11-18 00:00:00', '2025-12-07', '3年', 0, NULL, NULL, 'HÀN QUỐC'),
  ('C', NULL, 'PPO-25090009', 'LC-AP007-HL-A5', 'VLC-AP015-HAL-A5', 'AF006', '桶', 28.0, 19.5, 546.0, '2025-09-22 00:00:00', '2025-10-14', '1年', 1, '2026-09-21', 7.0, 'ĐNA'),
  ('C', NULL, 'PPO-25100002-1', 'GA-6P004-FD-08', 'VGA-AP018-FAD-08', 'AS009', '桶', 32.0, 17.0, 544.0, '2025-10-21 00:00:00', NULL, '2年', 1, '2027-10-20', 20.0, 'ĐNA'),
  ('C', NULL, 'PPO-25100002-2', 'GA-6P004-FD-5N', 'VGA-AP018-FAD-80', 'AS009', '桶', 7.0, 180.0, 1260.0, '2025-10-21 00:00:00', '2025-11-05', '2年', 1, '2027-10-20', 20.0, 'ĐNA'),
  ('C', NULL, 'PPO-25110018-1', 'AV-6I242-HA-7J', 'VAV-AI242-HAA-6G', 'AM004', '箱', 1400.0, 10.0, 14000.0, '2025/12/15+17+18', '2026-01-30', '1年', 0, '2026-12-14', 10.0, 'ĐNA'),
  ('C', NULL, 'PPO-25110040-1', 'GA-6P004-FD-08', 'VGA-AP018-FAD-08', 'AC108', '桶', 942.0, 17.0, 16014.0, '2025-12-19 00:00:00', NULL, '2年', 0, '2027-12-18', 22.0, 'ĐNA'),
  ('C', NULL, 'PPO-25070045-1', 'LC-AC002-FL-08', 'VLC-AC014-FAL-08', 'AM002', '桶', 760.0, 18.0, 13680.0, '2025-11-13 00:00:00', NULL, '2年', 0, '2027-11-12', 21.0, 'ĐNA'),
  ('C', NULL, 'PPO-24090027-5', 'MX-AC295-FL-08', 'VMX-AC024-FAL-08', 'AM004', '桶', 3.0, 22.0, 66.0, '2025-12-02 00:00:00', '2025-12-26', '2年', 0, '2027-12-01', 22.0, 'ĐNA'),
  ('C', NULL, 'PPO-25110040-2', 'MX-AC295-FL-08', 'VMX-AC024-FAL-08', 'AC108', '桶', 3.0, 22.0, 66.0, '2025-12-02 00:00:00', NULL, '2年', 0, '2027-12-01', 22.0, 'ĐNA');

-- Done!
