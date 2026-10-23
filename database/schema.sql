-- =============================================================================
-- HAALAR DESK (ERPNext Architecture Engine)
-- Professional Relational PostgreSQL Database Schema
-- Standard Frappe / ERPNext Tabular Design with Naming Series & DocStatus
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. SYSTEM SEQUENCES & NAMING SERIES TRACKER (Frappe tabSeries)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tab_series (
    name VARCHAR(100) PRIMARY KEY, -- e.g., 'HR-EMP-', 'PO-2026-', 'ASSET-'
    current_count BIGINT NOT NULL DEFAULT 0
);

-- Function to generate next ERPNext-style naming series value (e.g. HR-EMP-0001)
CREATE OR REPLACE FUNCTION get_next_series(prefix_name VARCHAR, pad_digits INT DEFAULT 4)
RETURNS VARCHAR AS $$
DECLARE
    next_val BIGINT;
    generated_name VARCHAR;
BEGIN
    INSERT INTO tab_series (name, current_count)
    VALUES (prefix_name, 1)
    ON CONFLICT (name) DO UPDATE
    SET current_count = tab_series.current_count + 1
    RETURNING current_count INTO next_val;

    generated_name := prefix_name || LPAD(next_val::TEXT, pad_digits, '0');
    RETURN generated_name;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. CORE IDENTITY & ACCESS CONTROL (Frappe tabUser, tabRole)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tab_role (
    name VARCHAR(140) PRIMARY KEY,
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    role_name VARCHAR(140) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tab_user (
    name VARCHAR(140) PRIMARY KEY, -- Username or Email
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    email VARCHAR(140) UNIQUE NOT NULL,
    username VARCHAR(140) UNIQUE NOT NULL,
    full_name VARCHAR(140) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    enabled SMALLINT NOT NULL DEFAULT 1,
    security_clearance INT NOT NULL DEFAULT 1 CHECK (security_clearance BETWEEN 1 AND 4),
    user_type VARCHAR(50) NOT NULL DEFAULT 'System User'
);

CREATE TABLE IF NOT EXISTS tab_has_role (
    name VARCHAR(140) PRIMARY KEY,
    parent VARCHAR(140) NOT NULL REFERENCES tab_user(name) ON DELETE CASCADE,
    parenttype VARCHAR(140) NOT NULL DEFAULT 'User',
    parentfield VARCHAR(140) NOT NULL DEFAULT 'roles',
    role VARCHAR(140) NOT NULL REFERENCES tab_role(name) ON DELETE CASCADE,
    idx INT NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 3. HUMAN RESOURCES (HRMS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tab_department (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'DEPT-HW-ENG'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    department_name VARCHAR(140) NOT NULL,
    head_of_department VARCHAR(140)
);

CREATE TABLE IF NOT EXISTS tab_designation (
    name VARCHAR(140) PRIMARY KEY,
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    designation_name VARCHAR(140) NOT NULL,
    clearance_ceiling INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tab_employee (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'HR-EMP-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    user_id VARCHAR(140) UNIQUE REFERENCES tab_user(name),
    department VARCHAR(140) REFERENCES tab_department(name),
    designation VARCHAR(140) REFERENCES tab_designation(name),
    reports_to VARCHAR(140) REFERENCES tab_employee(name),
    gender VARCHAR(20),
    date_of_birth DATE NOT NULL,
    date_of_joining DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Suspended', 'Left')),
    cell_number VARCHAR(50) NOT NULL,
    emergency_phone_number VARCHAR(50),
    encrypted_cnic BYTEA,
    encrypted_base_salary BYTEA
);

CREATE TABLE IF NOT EXISTS tab_employee_checkin (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'CHK-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    employee VARCHAR(140) NOT NULL REFERENCES tab_employee(name),
    log_type VARCHAR(10) NOT NULL CHECK (log_type IN ('IN', 'OUT')),
    time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    device_id VARCHAR(140) DEFAULT 'WEB-TERMINAL'
);

CREATE TABLE IF NOT EXISTS tab_attendance (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'ATT-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 1,
    employee VARCHAR(140) NOT NULL REFERENCES tab_employee(name),
    attendance_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('Present', 'Absent', 'Half Day', 'On Leave')),
    in_time TIMESTAMPTZ,
    out_time TIMESTAMPTZ,
    working_hours NUMERIC(4, 2) DEFAULT 0.00,
    UNIQUE (employee, attendance_date)
);

CREATE TABLE IF NOT EXISTS tab_leave_type (
    name VARCHAR(140) PRIMARY KEY,
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    leave_type_name VARCHAR(140) NOT NULL,
    max_days_allowed INT NOT NULL DEFAULT 14
);

CREATE TABLE IF NOT EXISTS tab_leave_application (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'LV-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0, -- 0=Draft/Open, 1=Approved, 2=Rejected
    employee VARCHAR(140) NOT NULL REFERENCES tab_employee(name),
    leave_type VARCHAR(140) NOT NULL REFERENCES tab_leave_type(name),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_leave_days NUMERIC(4, 1) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Approved', 'Rejected', 'Cancelled')),
    approved_by VARCHAR(140) REFERENCES tab_employee(name)
);

-- -----------------------------------------------------------------------------
-- 4. ASSETS & PRECISION LAB EQUIPMENT
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tab_asset_category (
    name VARCHAR(140) PRIMARY KEY,
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    category_name VARCHAR(140) NOT NULL
);

CREATE TABLE IF NOT EXISTS tab_asset (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'ASSET-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    asset_name VARCHAR(200) NOT NULL,
    asset_category VARCHAR(140) NOT NULL REFERENCES tab_asset_category(name),
    serial_no VARCHAR(140) UNIQUE NOT NULL,
    model_no VARCHAR(140),
    manufacturer VARCHAR(140),
    location VARCHAR(140) NOT NULL DEFAULT 'Main Lab',
    custodian_employee VARCHAR(140) REFERENCES tab_employee(name),
    purchase_date DATE,
    gross_purchase_amount_pkr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    calibration_due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'In-Use', 'Under Maintenance', 'Scrapped')),
    classification_level INT NOT NULL DEFAULT 1 CHECK (classification_level BETWEEN 1 AND 4)
);

CREATE TABLE IF NOT EXISTS tab_asset_movement (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'MOV-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 1, -- 1=Submitted
    asset VARCHAR(140) NOT NULL REFERENCES tab_asset(name),
    from_employee VARCHAR(140) REFERENCES tab_employee(name),
    to_employee VARCHAR(140) NOT NULL REFERENCES tab_employee(name),
    purpose VARCHAR(200) NOT NULL,
    target_return_date DATE,
    actual_return_date DATE
);

CREATE TABLE IF NOT EXISTS tab_asset_repair (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'REP-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    asset VARCHAR(140) NOT NULL REFERENCES tab_asset(name),
    failure_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    repair_type VARCHAR(50) NOT NULL CHECK (repair_type IN ('In-House', 'Vendor OEM', 'Calibration')),
    technician_vendor VARCHAR(140),
    estimated_cost_pkr NUMERIC(15, 2) DEFAULT 0.00,
    actual_cost_pkr NUMERIC(15, 2) DEFAULT 0.00,
    repair_status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (repair_status IN ('Pending', 'In Progress', 'Completed', 'Failed'))
);

-- -----------------------------------------------------------------------------
-- 5. STOCK & COMPONENT INVENTORY
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tab_item_group (
    name VARCHAR(140) PRIMARY KEY,
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    item_group_name VARCHAR(140) NOT NULL
);

CREATE TABLE IF NOT EXISTS tab_item (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'ITEM-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    item_code VARCHAR(100) UNIQUE NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_group VARCHAR(140) NOT NULL REFERENCES tab_item_group(name),
    stock_uom VARCHAR(30) NOT NULL DEFAULT 'PCS',
    package_footprint VARCHAR(100),
    standard_rate_pkr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    reorder_level INT NOT NULL DEFAULT 10,
    current_stock INT NOT NULL DEFAULT 0,
    reserved_stock INT NOT NULL DEFAULT 0,
    bin_location VARCHAR(100) NOT NULL DEFAULT 'MAIN-RACK'
);

-- -----------------------------------------------------------------------------
-- 6. CLASSIFIED PROJECTS & BILL OF MATERIALS (BOM)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tab_project (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'PRJ-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    masked_customer VARCHAR(200) NOT NULL,
    encrypted_real_agency BYTEA,
    classification_level INT NOT NULL DEFAULT 3 CHECK (classification_level BETWEEN 1 AND 4),
    lead_engineer VARCHAR(140) NOT NULL REFERENCES tab_employee(name),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Initiation', 'Active', 'Testing', 'Completed', 'Cancelled')),
    total_budget_pkr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    actual_cost_pkr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    target_completion_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS tab_bom (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'BOM-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    bom_name VARCHAR(200) NOT NULL,
    project VARCHAR(140) NOT NULL REFERENCES tab_project(name) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tab_bom_item (
    name VARCHAR(140) PRIMARY KEY,
    parent VARCHAR(140) NOT NULL REFERENCES tab_bom(name) ON DELETE CASCADE,
    parenttype VARCHAR(140) NOT NULL DEFAULT 'BOM',
    parentfield VARCHAR(140) NOT NULL DEFAULT 'items',
    item_code VARCHAR(140) NOT NULL REFERENCES tab_item(name),
    qty_required INT NOT NULL CHECK (qty_required > 0),
    reference_designators TEXT,
    idx INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tab_timesheet (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'TS-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    employee VARCHAR(140) NOT NULL REFERENCES tab_employee(name),
    project VARCHAR(140) NOT NULL REFERENCES tab_project(name),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    hours NUMERIC(4, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    activity_summary TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- 7. BUYING & PROCUREMENT
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tab_supplier (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'SUPP-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    supplier_name VARCHAR(200) NOT NULL,
    tax_id_ntn VARCHAR(100),
    contact_person VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(140),
    address TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00
);

CREATE TABLE IF NOT EXISTS tab_purchase_order (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'PO-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0, -- 0=Draft, 1=Submitted, 2=Cancelled
    supplier VARCHAR(140) NOT NULL REFERENCES tab_supplier(name),
    project VARCHAR(140) REFERENCES tab_project(name),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_by DATE NOT NULL,
    total_amount_pkr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Received', 'Cancelled'))
);

CREATE TABLE IF NOT EXISTS tab_purchase_order_item (
    name VARCHAR(140) PRIMARY KEY,
    parent VARCHAR(140) NOT NULL REFERENCES tab_purchase_order(name) ON DELETE CASCADE,
    parenttype VARCHAR(140) NOT NULL DEFAULT 'Purchase Order',
    parentfield VARCHAR(140) NOT NULL DEFAULT 'items',
    item_code VARCHAR(140) REFERENCES tab_item(name),
    description TEXT NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    rate_pkr NUMERIC(15, 2) NOT NULL,
    amount_pkr NUMERIC(15, 2) GENERATED ALWAYS AS (qty * rate_pkr) STORED,
    idx INT NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 8. FINANCE, UTILITIES & KITCHEN EXPENSES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tab_expense_claim (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'EXP-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0, -- 0=Draft, 1=Submitted
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expense_type VARCHAR(100) NOT NULL CHECK (expense_type IN ('Utilities', 'Canteen/Kitchen', 'R&M', 'Transport & Diesel', 'Lab Consumables', 'Office Supplies')),
    description TEXT NOT NULL,
    total_amount_pkr NUMERIC(15, 2) NOT NULL CHECK (total_amount_pkr > 0),
    paid_to VARCHAR(200) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CompanyBankTransfer', 'CorporateCheque', 'PettyCash')),
    receipt_attachment VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tab_utility_bill (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'UTIL-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 0,
    utility_type VARCHAR(100) NOT NULL CHECK (utility_type IN ('Electricity (IESCO)', 'Sui Gas (SNGPL)', 'Fiber Internet (PTCL Dedicated)', 'Water (CDA)', 'Generator Diesel')),
    billing_month VARCHAR(50) NOT NULL, -- e.g. 'October 2026'
    consumer_no VARCHAR(100) NOT NULL,
    amount_pkr NUMERIC(15, 2) NOT NULL CHECK (amount_pkr > 0),
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid', 'Overdue')),
    paid_date DATE
);

CREATE TABLE IF NOT EXISTS tab_kitchen_expense (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'KIT-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 1,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description VARCHAR(255) NOT NULL,
    vendor_store VARCHAR(200) NOT NULL,
    amount_pkr NUMERIC(15, 2) NOT NULL CHECK (amount_pkr > 0),
    recorded_by VARCHAR(140) NOT NULL
);

CREATE TABLE IF NOT EXISTS tab_payment_entry (
    name VARCHAR(140) PRIMARY KEY, -- e.g. 'PAY-2026-0001'
    creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    owner VARCHAR(140) NOT NULL DEFAULT 'Administrator',
    docstatus SMALLINT NOT NULL DEFAULT 1,
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    party_type VARCHAR(50) NOT NULL CHECK (party_type IN ('Supplier', 'Utility Provider', 'Employee')),
    party_name VARCHAR(200) NOT NULL,
    paid_amount_pkr NUMERIC(15, 2) NOT NULL CHECK (paid_amount_pkr > 0),
    mode_of_payment VARCHAR(50) NOT NULL CHECK (mode_of_payment IN ('Bank Transfer', 'Corporate Cheque', 'Petty Cash')),
    reference_no VARCHAR(100)
);

-- =============================================================================
-- SEED DATA: STANDARD ROLES, DEPARTMENTS, DESIGNATIONS, USERS & INITIAL MASTERS
-- =============================================================================

INSERT INTO tab_role (name, role_name, description) VALUES
('CEO', 'Chief Executive Officer', 'Executive oversight across company burn, equipment, projects, and financials.'),
('Supervisor', 'Engineering Supervisor', 'Lead hardware/firmware architect; approves team attendance, leaves, and equipment checkouts.'),
('Logistics Admin', 'Logistics & Facilities Officer', 'Manages physical warehouse inventory, utility bills, and kitchen petty cash.'),
('Employee', 'Engineering Staff', 'Access restricted strictly to personal attendance, assigned equipment, tasks, and leave.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tab_department (name, department_name) VALUES
('DEPT-EXEC', 'Executive Directorate'),
('DEPT-HW-ENG', 'Hardware & RF Engineering Lab'),
('DEPT-EMBED', 'Embedded Systems & Firmware'),
('DEPT-ADMIN-LOG', 'Administration & Logistics'),
('DEPT-FINANCE', 'Finance & Accounts')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tab_designation (name, designation_name, clearance_ceiling) VALUES
('DESIG-CEO', 'Chief Executive Officer', 4),
('DESIG-HW-LEAD', 'Lead Hardware Architect', 3),
('DESIG-FW-ENG', 'Senior Firmware Engineer', 3),
('DESIG-LOG-MGR', 'Logistics & Warehouse Officer', 2)
ON CONFLICT (name) DO NOTHING;

-- Initial System Users (Password: Haalar@2026! / argon2 / standard hash)
INSERT INTO tab_user (name, email, username, full_name, password_hash, security_clearance) VALUES
('ceo@haalar.com', 'ceo@haalar.com', 'ceo', 'Taha (Managing Director)', '$2b$10$wE8wM6k3n/Kj8P2/mF6tI.F.UePzE0nN3Yy.w0iFw8Q1jYgT3LgK6', 4),
('usman@haalar.com', 'usman@haalar.com', 'usman', 'Usman (Hardware Lead)', '$2b$10$wE8wM6k3n/Kj8P2/mF6tI.F.UePzE0nN3Yy.w0iFw8Q1jYgT3LgK6', 3),
('bilal@haalar.com', 'bilal@haalar.com', 'bilal', 'Bilal (Logistics Manager)', '$2b$10$wE8wM6k3n/Kj8P2/mF6tI.F.UePzE0nN3Yy.w0iFw8Q1jYgT3LgK6', 2),
('zainab@haalar.com', 'zainab@haalar.com', 'zainab', 'Zainab (Firmware Engineer)', '$2b$10$wE8wM6k3n/Kj8P2/mF6tI.F.UePzE0nN3Yy.w0iFw8Q1jYgT3LgK6', 2)
ON CONFLICT (name) DO NOTHING;

-- Assign Roles
INSERT INTO tab_has_role (name, parent, role) VALUES
('ROLE-MAP-001', 'ceo@haalar.com', 'CEO'),
('ROLE-MAP-002', 'usman@haalar.com', 'Supervisor'),
('ROLE-MAP-003', 'bilal@haalar.com', 'Logistics Admin'),
('ROLE-MAP-004', 'zainab@haalar.com', 'Employee')
ON CONFLICT (name) DO NOTHING;

-- Seed Employees matching the users
INSERT INTO tab_employee (
    name, employee_code, first_name, last_name, employee_name, user_id, 
    department, designation, date_of_birth, date_of_joining, cell_number, 
    status, encrypted_cnic
) VALUES
('HR-EMP-0001', 'HSL-0001', 'Taha', 'Managing Director', 'Taha (Managing Director)', 'ceo@haalar.com', 'DEPT-EXEC', 'DESIG-CEO', '1985-05-15', '2020-01-01', '+92-300-1111111', 'Active', pgp_sym_encrypt('61101-1234567-1', 'haalar_secret_key_2026')::bytea),
('HR-EMP-0002', 'HSL-0002', 'Usman', 'Hardware Lead', 'Usman (Hardware Lead)', 'usman@haalar.com', 'DEPT-HW-ENG', 'DESIG-HW-LEAD', '1990-08-20', '2021-03-15', '+92-300-2222222', 'Active', pgp_sym_encrypt('61101-2345678-2', 'haalar_secret_key_2026')::bytea),
('HR-EMP-0003', 'HSL-0003', 'Bilal', 'Logistics Manager', 'Bilal (Logistics Manager)', 'bilal@haalar.com', 'DEPT-ADMIN-LOG', 'DESIG-LOG-MGR', '1992-11-10', '2022-01-10', '+92-300-3333333', 'Active', pgp_sym_encrypt('61101-3456789-3', 'haalar_secret_key_2026')::bytea),
('HR-EMP-0004', 'HSL-0004', 'Zainab', 'Firmware Engineer', 'Zainab (Firmware Engineer)', 'zainab@haalar.com', 'DEPT-EMBED', 'DESIG-FW-ENG', '1995-02-14', '2023-06-01', '+92-300-4444444', 'Active', pgp_sym_encrypt('61101-4567890-4', 'haalar_secret_key_2026')::bytea)
ON CONFLICT (name) DO NOTHING;

-- Seed Asset Categories
INSERT INTO tab_asset_category (name, category_name) VALUES
('Oscilloscopes & Logic Analyzers', 'Oscilloscopes & Logic Analyzers'),
('RF & Spectrum Test Equipment', 'RF & Spectrum Test Equipment'),
('SMD Assembly & Soldering', 'SMD Assembly & Soldering'),
('Machining & CNC Prototyping', 'Machining & CNC Prototyping')
ON CONFLICT (name) DO NOTHING;

-- Seed Equipment
INSERT INTO tab_asset (
    name, asset_name, asset_category, serial_no, model_no, manufacturer, 
    location, custodian_employee, gross_purchase_amount_pkr, calibration_due_date, status, classification_level
) VALUES
('ASSET-0001', 'Tektronix 4-Channel 1GHz Phosphor Oscilloscope', 'Oscilloscopes & Logic Analyzers', 'SN-TEK-4054-001', 'DPO4104B', 'Tektronix', 'RF Testing Lab - Bench A', 'HR-EMP-0002', 3850000.00, '2026-12-31', 'In-Use', 3),
('ASSET-0002', 'Rohde & Schwarz Vector Network Analyzer (9kHz-8.5GHz)', 'RF & Spectrum Test Equipment', 'SN-RNS-ZNB8-002', 'ZNB8', 'Rohde & Schwarz', 'Cleanroom Shielded Bay', NULL, 8200000.00, '2026-11-15', 'Available', 3),
('ASSET-0003', 'NeoDen Automated Desktop Vision Pick & Place', 'SMD Assembly & Soldering', 'SN-NEOD-YY1-003', 'YY1-Vision', 'NeoDen', 'SMD Assembly Floor', NULL, 2150000.00, '2027-02-20', 'Available', 2),
('ASSET-0004', 'Roland MDX-50 High-Precision Milling Machine', 'Machining & CNC Prototyping', 'SN-ROLAND-MDX-004', 'MDX-50', 'Roland', 'Mechanical Bay', NULL, 4500000.00, '2026-10-30', 'Under Maintenance', 2)
ON CONFLICT (name) DO NOTHING;

-- Seed Leave Types
INSERT INTO tab_leave_type (name, leave_type_name, max_days_allowed) VALUES
('Annual Leave', 'Annual Leave', 14),
('Sick Leave', 'Sick Leave', 10),
('Casual Leave', 'Casual Leave', 10)
ON CONFLICT (name) DO NOTHING;

-- Seed Item Groups & Items
INSERT INTO tab_item_group (name, item_group_name) VALUES
('Integrated Circuits (ICs)', 'Integrated Circuits (ICs)'),
('Passive Components', 'Passive Components')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tab_item (name, item_code, item_name, item_group, stock_uom, package_footprint, standard_rate_pkr, current_stock, bin_location) VALUES
('ITEM-0001', 'STM32F407VGT6', 'High-Performance ARM Cortex-M4 MCU 168MHz', 'Integrated Circuits (ICs)', 'PCS', 'LQFP-100', 4200.00, 145, 'RACK-02-SHELF-B'),
('ITEM-0002', 'XC7A100T-2CSG324I', 'Xilinx Artix-7 FPGA 101K Logic Cells', 'Integrated Circuits (ICs)', 'PCS', 'BGA-324', 62000.00, 18, 'SAFE-RACK-01'),
('ITEM-0003', 'RC0603FR-0710KL', 'Yageo SMD Resistor 10k Ohm 1% 0603', 'Passive Components', 'PCS', '0603 SMD', 1.80, 4500, 'BIN-PASS-0603-10K')
ON CONFLICT (name) DO NOTHING;

-- Seed Classified Defense Project
INSERT INTO tab_project (
    name, project_code, project_name, masked_customer, encrypted_real_agency, 
    classification_level, lead_engineer, status, total_budget_pkr, actual_cost_pkr, 
    start_date, target_completion_date
) VALUES
(
    'PRJ-2026-0001', 'PRJ-DEF-2026-01', 'Radar DSP High-Speed Digital Processing Core',
    'Client Agency-Alpha (Defense Spec)',
    pgp_sym_encrypt('Strategic Systems Directorate / Defense Complex', 'haalar_secret_key_2026')::bytea,
    3, 'HR-EMP-0002', 'Active', 18500000.00, 4200000.00, '2026-01-10', '2026-12-20'
),
(
    'PRJ-2026-0002', 'PRJ-AER-2026-02', 'Telemetry ECU & Avionics Interface Unit',
    'Aerospace Directorate (Flight Spec)',
    pgp_sym_encrypt('Aerospace Flight Systems Command', 'haalar_secret_key_2026')::bytea,
    3, 'HR-EMP-0004', 'Active', 9800000.00, 2450000.00, '2026-02-15', '2027-03-15'
)
ON CONFLICT (name) DO NOTHING;

-- Seed Utility Bills (IESCO, Gas, Leased Fiber)
INSERT INTO tab_utility_bill (name, utility_type, billing_month, consumer_no, amount_pkr, due_date, status, paid_date, docstatus) VALUES
('UTIL-2026-0001', 'Electricity (IESCO)', 'October 2026', '04-14123-9988771-U', 342000.00, '2026-10-25', 'Paid', '2026-10-20', 1),
('UTIL-2026-0002', 'Fiber Internet (PTCL Dedicated)', 'October 2026', 'ISB-CORP-FIBER-0881', 85000.00, '2026-10-20', 'Paid', '2026-10-18', 1),
('UTIL-2026-0003', 'Sui Gas (SNGPL)', 'October 2026', '9812401823019', 28500.00, '2026-10-28', 'Unpaid', NULL, 0)
ON CONFLICT (name) DO NOTHING;

-- Seed Kitchen / Canteen Expenses
INSERT INTO tab_kitchen_expense (name, expense_date, description, vendor_store, amount_pkr, recorded_by) VALUES
('KIT-2026-0001', '2026-10-18', 'Daily Engineering Team Tea, Milk, Sugar & Mineral Water', 'Humak Wholesale Mart', 4200.00, 'Bilal (Logistics Manager)'),
('KIT-2026-0002', '2026-10-17', 'Executive Directorate High-Tea & Mineral Water Dispensers', 'Islamabad Bakers', 6800.00, 'Bilal (Logistics Manager)')
ON CONFLICT (name) DO NOTHING;

-- Initialize Naming Series Counter
INSERT INTO tab_series (name, current_count) VALUES
('HR-EMP-', 4),
('ASSET-', 4),
('ITEM-', 3),
('PRJ-2026-', 2),
('UTIL-2026-', 3),
('KIT-2026-', 2)
ON CONFLICT (name) DO NOTHING;
